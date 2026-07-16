/**
 * Pipeline Service
 *
 * 多智能体流水线编排:规划 → 撰写 → 评审
 * - planning: 一次 Gemini 调用,产出 refinedTitle/Summary/scenes
 * - drafting: 按 scenes 循环,每个 scene 一次 Gemini,拼成完整 content
 * - reviewing: 两轮 — 第一次 critique,第二次 refine
 */

import type {
  PipelineStepName,
  PipelineStepRequest,
  PipelineStepResponse,
  PlanningResult,
  DraftingResult,
  ReviewingResult,
  StyleFilters,
  ConflictLevel,
  Scene,
} from '@arcadia/shared';
import { runPlannerPrompt } from '../prompts/planner';
import { runDrafterScenePrompt, type DrafterInput } from '../prompts/drafter';
import { runReviewerPrompt } from '../prompts/reviewer';
import { runRefinerPrompt } from '../prompts/refiner';
import { logger } from '../infrastructure/logger';
import { NotFoundError } from '../infrastructure/errors';

// ============ Style filter 拼装工具 ============

function buildStyleRules(filters?: StyleFilters): string {
  const rules: string[] = [];
  if (!filters) return '保持优雅、自然、极富文学感染力的白描笔法。';
  if (filters.noCliches) {
    rules.push('【去AI味与高频词屏蔽】绝对禁止使用"突然"、"然而"、"不可否认"、"总而言之"、"只见"、"猛地"等低级大模型极其偏爱的俗套、做作连词。句子之间多用短句和动词进行物理层面的连接,而非逻辑概念词。');
  }
  if (filters.showDontTell) {
    rules.push('【Show, Don\'t Tell】禁止直接白描或在文中判定角色的抽象情绪(如直接写"他感到极其悲伤"或"他们非常痛苦")。必须通过微表情、手部的细微动作、偏过的目光、呼吸的停顿、紧咬的牙关,或者环境景物的变化(如冷雾中的叶片瑟缩),将人物内心的震颤生动、克制地展现给读者。');
  }
  if (filters.slowPacing) {
    rules.push('【慢节奏留白】节奏必须舒缓细腻、富有温情。拒绝急躁和流水账式的推图,给每一个眼神交互、每一秒沉默留出空间。加强林间光影、空气湿度、草木芬香、能量微光等细节渲染。');
  }
  if (filters.keepMystery) {
    rules.push('【含蓄高雅】避免粗俗或低龄化的打斗与对话。角色言行应有其深层的含蓄动机,展现水面之下的心理角力。');
  }
  return rules.join('\n') || '保持优雅、自然、极富文学感染力的白描笔法。';
}

function buildCharacterInfo(chars: PipelineStepRequest['characters']): string {
  return chars
    ?.map((c) => `- Name: ${c.name} (${c.role})\n  Bio: ${c.description}\n  Skills/Moves: ${c.skills?.join(', ')}`)
    .join('\n') || '(无角色信息)';
}

function buildKbString(kb: PipelineStepRequest['knowledgeBase']): string {
  return kb
    ?.map((k) => `[${k.category.toUpperCase()}] ${k.title}: ${k.content}`)
    .join('\n') || '';
}

// ============ Stage 派发 ============

export const pipelineService = {
  async runStage(
    input: PipelineStepRequest,
    requestId?: string,
  ): Promise<PipelineStepResponse> {
    const target = input.chapters[input.currentChapterIndex];
    if (!target) {
      throw new NotFoundError(`Target chapter not found at index ${input.currentChapterIndex}`);
    }

    switch (input.stage) {
      case 'planning':
        return this.runPlanner(input, requestId);
      case 'drafting':
        return this.runDrafter(input, requestId);
      case 'reviewing':
        return this.runReviewer(input, requestId);
      default:
        throw new NotFoundError(`Unknown stage: ${input.stage as string}`);
    }
  },

  async runPlanner(input: PipelineStepRequest, requestId?: string): Promise<PlanningResult> {
    logger.info(`[Pipeline] planning Ch.${input.chapters[input.currentChapterIndex].number}`, undefined, requestId);
    return runPlannerPrompt(input, requestId);
  },

  async runDrafter(input: PipelineStepRequest, requestId?: string): Promise<DraftingResult> {
    const target = input.chapters[input.currentChapterIndex];
    logger.info(`[Pipeline] drafting Ch.${target.number}`, undefined, requestId);

    // 1. 确定 scenes(可能没有,需要先做"动态分镜")
    let scenes = (target.scenes || []) as Scene[];
    if (scenes.length === 0) {
      // 退化:本地 3 幕模板
      logger.warn('[Pipeline] no scenes on chapter, using local 3-act template', undefined, requestId);
      scenes = [
        { title: '分镜一:迷雾笼罩', summary: '氛围渲染', characters: [input.characters?.[0]?.name || '主角'], conflictLevel: 'low' as ConflictLevel, targetWordCount: 600 },
        { title: '分镜二:宿命誓言', summary: '核心冲突', characters: input.characters?.map((c) => c.name) || ['主角'], conflictLevel: 'high' as ConflictLevel, targetWordCount: 800 },
        { title: '分镜三:余响', summary: '余韵', characters: [input.characters?.[1]?.name || '主角'], conflictLevel: 'medium' as ConflictLevel, targetWordCount: 600 },
      ];
    }

    // 2. 准备共享变量
    const characterInfo = buildCharacterInfo(input.characters);
    const styleRulesText = buildStyleRules(input.styleFilters);
    const kbContextString = buildKbString(input.knowledgeBase);

    // 3. 逐 scene 调 drafter,拼成完整 content
    let written = '';
    const accumulated: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const drafterInput: DrafterInput = {
        title: input.title,
        genre: input.genre,
        worldview: input.worldview,
        characterInfo,
        writingPrompt: input.writingPrompt,
        chapterNumber: target.number,
        chapterTitle: target.title,
        chapterSummary: target.summary,
        sceneIndex: i,
        sceneCount: scenes.length,
        sceneTitle: scene.title,
        sceneSummary: scene.summary,
        sceneCharacters: scene.characters?.join(', ') || '',
        sceneConflictLevel: scene.conflictLevel,
        targetWordCount: scene.targetWordCount,
        previousSections: written || 'This is the first scene of the chapter. Set up the atmospheric environment, temperature, scents, and character focus.',
        styleRulesText,
        kbContextString,
        steeringPrompt: input.steeringPrompt,
        styleFilters: input.styleFilters,
      };

      const sceneResult = await runDrafterScenePrompt(drafterInput, requestId);
      if (written) written += `\n\n${sceneResult.prose}`;
      else written = sceneResult.prose;
      if (sceneResult.sceneHighlights) accumulated.push(...sceneResult.sceneHighlights);
    }

    return {
      content: written,
      focusHighlight: Array.from(new Set(accumulated)),
    };
  },

  async runReviewer(input: PipelineStepRequest, requestId?: string): Promise<ReviewingResult> {
    const target = input.chapters[input.currentChapterIndex];
    logger.info(`[Pipeline] reviewing Ch.${target.number}`, undefined, requestId);

    const draft = input.currentDraftContent || target.content;

    // Pass 1: critique
    const critiqueResult = await runReviewerPrompt(
      {
        title: input.title,
        genre: input.genre,
        worldview: input.worldview,
        characterInfo: buildCharacterInfo(input.characters),
        writingPrompt: input.writingPrompt,
        kbContextString: buildKbString(input.knowledgeBase),
        chapterNumber: target.number,
        chapterTitle: target.title,
        chapterSummary: target.summary,
        draftContent: draft,
      },
      requestId,
    );

    // Pass 2: refine
    const refineResult = await runRefinerPrompt(
      {
        title: input.title,
        genre: input.genre,
        worldview: input.worldview,
        writingPrompt: input.writingPrompt,
        critique: critiqueResult.critique,
        suggestions: critiqueResult.suggestions,
        draftContent: draft,
      },
      requestId,
    );

    return {
      critique: critiqueResult.critique,
      polishedContent: refineResult.polishedContent || draft,
      score: critiqueResult.score,
    };
  },
};

// 重新导出 stage 类型,供 controller 用
export type { PipelineStepName };
