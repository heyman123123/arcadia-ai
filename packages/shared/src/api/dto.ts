/**
 * API 数据传输对象(DTO)
 *
 * 这是"前端能拿到的、来自后端的响应形状"的契约。
 * 与 types/* 的领域类型不同:DTO 是网络层的,可能包含 API 特有的字段
 * (如 score、reason 等),也可能略微偏离领域类型。
 *
 * 阶段 2 后端 MVC 拆分时,这些 DTO 也会被后端 service 返回。
 */

import type { ConflictLevel } from '../types/book';
import type { KBCategory, LoreSuggestion } from '../types/knowledge-base';

// ===== POST /api/books/generate-init =====

/** 请求入参 */
export interface BookInitRequest {
  title: string;
  genre: string;
  brief: string;
}

/** 响应:一本书的初始化骨架 */
export interface BookInitResponse {
  worldview: string;
  writingPrompt: string;
  characters: Array<{
    name: string;
    role: string;
    description: string;
    skills: string[];
  }>;
  outline: Array<{
    number: number;
    title: string;
    summary: string;
  }>;
  initialKnowledgeBase: Array<{
    category: KBCategory;
    title: string;
    content: string;
  }>;
}

// ===== POST /api/agent/run-pipeline-step =====

/** 流水线阶段(后端入参) */
export type PipelineStepName = 'planning' | 'drafting' | 'reviewing';

export interface PipelineStepRequest {
  title: string;
  genre: string;
  worldview: string;
  characters: Array<{
    name: string;
    role: string;
    description: string;
    skills: string[];
  }>;
  writingPrompt: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    content: string;
    status: string;
    scenes?: Array<{
      title: string;
      summary: string;
      characters: string[];
      conflictLevel: ConflictLevel;
      targetWordCount: number;
    }>;
    activeContextHighlights?: string[];
  }>;
  currentChapterIndex: number;
  stage: PipelineStepName;
  steeringPrompt: string;
  knowledgeBase: Array<{
    id: string;
    category: KBCategory;
    title: string;
    content: string;
  }>;
  currentDraftContent: string;
  styleFilters: {
    noCliches: boolean;
    showDontTell: boolean;
    slowPacing: boolean;
    keepMystery: boolean;
  };
}

/** 规划阶段响应 */
export interface PlanningResult {
  refinedTitle: string;
  refinedSummary: string;
  activeContextHighlights: string[];
  thoughtProcess: string;
  scenes: Array<{
    title: string;
    summary: string;
    characters: string[];
    conflictLevel: ConflictLevel;
    targetWordCount: number;
  }>;
}

/** 撰写阶段响应 */
export interface DraftingResult {
  content: string;
  focusHighlight: string[];
}

/** 审校阶段响应(两轮:critique + refine) */
export interface ReviewingResult {
  critique: string;
  polishedContent: string;
  score: number;
}

/** 流水线响应联合类型 */
export type PipelineStepResponse = PlanningResult | DraftingResult | ReviewingResult;

// ===== POST /api/agent/roll-outline =====

export interface RollOutlineRequest {
  title: string;
  genre: string;
  worldview: string;
  characters: Array<{
    name: string;
    role: string;
    description: string;
    skills: string[];
  }>;
  writingPrompt: string;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    content: string;
    status: string;
  }>;
  currentChapterIndex: number;
  knowledgeBase: Array<{
    id: string;
    category: KBCategory;
    title: string;
    content: string;
  }>;
}

export interface RollOutlineResponse {
  message?: string;
  updatedChapters: Array<{
    number: number;
    title: string;
    summary: string;
  }>;
}

// ===== POST /api/books/suggest-kb-entry =====

export interface SuggestKBEntryRequest {
  title: string;
  worldview: string;
  characters: Array<{ name: string; role: string; description: string; skills: string[] }>;
  chapterContent: string;
  chapterTitle: string;
}

/** 响应就是 LoreSuggestion,直接用领域类型 */
export type SuggestKBEntryResponse = LoreSuggestion;

// ===== POST /api/books/generate-element =====

export interface GenerateElementRequest {
  type: string;
  title: string;
  worldview: string;
  detail: string;
}

export interface GenerateElementResponse {
  title: string;
  description: string;
  combatOrMechanic: string;
}

// ===== 统一响应信封 =====

/** 后端成功响应统一格式 */
export interface ApiSuccess<T> {
  data: T;
  requestId: string;
}

/** 后端错误响应统一格式 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
