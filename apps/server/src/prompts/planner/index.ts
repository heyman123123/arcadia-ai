import type { PipelineStepRequest, PlanningResult } from '@arcadia/shared';
import { runPrompt, type PromptModule } from '../_loader';
import { plannerSchema } from './schema';

interface PlannerInput {
  title: string;
  genre: string;
  worldview: string;
  characters: PipelineStepRequest['characters'];
  writingPrompt: string;
  chapters: PipelineStepRequest['chapters'];
  currentChapterIndex: number;
  steeringPrompt: string;
  knowledgeBase: PipelineStepRequest['knowledgeBase'];
}

const module: PromptModule<PlannerInput, PlanningResult> = {
  name: 'Planning Agent',
  schema: plannerSchema,
  buildVars: (input) => {
    const targetChapter = input.chapters[input.currentChapterIndex];
    const previousChaptersSummary = input.chapters
      .slice(0, input.currentChapterIndex)
      .map(
        (ch) =>
          `Chapter ${ch.number}: ${ch.title} - Summary: ${ch.summary}. Content excerpt: ${
            ch.content ? ch.content.substring(0, 500) + '...' : 'Not written yet.'
          }`,
      )
      .join('\n\n');
    const futureChaptersOutline = input.chapters
      .slice(input.currentChapterIndex + 1)
      .map((ch) => `Chapter ${ch.number}: ${ch.title} - Expected Plot: ${ch.summary}`)
      .join('\n');
    const kbContextString = input.knowledgeBase
      ?.map((kb) => `[${kb.category.toUpperCase()}] ${kb.title}: ${kb.content}`)
      .join('\n') || '';
    const characterInfo = input.characters
      ?.map((c) => `- Name: ${c.name} (${c.role})\n  Bio: ${c.description}\n  Skills/Moves: ${c.skills?.join(', ')}`)
      .join('\n');

    return {
      title: input.title,
      genre: input.genre,
      worldview: input.worldview,
      characterInfo: characterInfo || '(无角色信息)',
      writingPrompt: input.writingPrompt,
      previousChaptersSummary: previousChaptersSummary || 'This is the first chapter.',
      futureChaptersOutline: futureChaptersOutline || 'No further chapters planned yet.',
      kbContextString,
      targetChapterNumber: String(targetChapter?.number ?? '?'),
      targetChapterTitle: targetChapter?.title || '',
      targetChapterSummary: targetChapter?.summary || '',
      steeringPrompt: input.steeringPrompt || 'Continue naturally according to outline.',
    };
  },
};

export function runPlannerPrompt(
  input: PipelineStepRequest,
  requestId?: string,
): Promise<PlanningResult> {
  return runPrompt('./planner', module, input as unknown as PlannerInput, requestId);
}
