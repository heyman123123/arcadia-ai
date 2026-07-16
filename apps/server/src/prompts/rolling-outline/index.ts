import type { RollOutlineRequest, RollOutlineResponse } from '@arcadia/shared';
import { runPrompt, type PromptModule } from '../_loader';
import { rollingOutlineSchema } from './schema';

const module: PromptModule<RollOutlineRequest, RollOutlineResponse> = {
  name: 'Outline Agent',
  schema: rollingOutlineSchema,
  buildVars: (input) => {
    const completedChapter = input.chapters[input.currentChapterIndex];
    const futureChapters = input.chapters.slice(input.currentChapterIndex + 1);
    const kbContextString = input.knowledgeBase
      ?.map((kb) => `[${kb.category.toUpperCase()}] ${kb.title}: ${kb.content}`)
      .join('\n') || '';
    const characterInfo = input.characters
      ?.map((c) => `- Name: ${c.name} (${c.role})\n  Bio: ${c.description}\n  Skills: ${c.skills?.join(', ')}`)
      .join('\n');
    const completedChaptersSummary = input.chapters
      .slice(0, input.currentChapterIndex + 1)
      .map(
        (ch) =>
          `Chapter ${ch.number}: ${ch.title}\n  Summary: ${ch.summary}\n  Content written: ${
            ch.content ? ch.content.substring(0, 800) + '...' : 'None.'
          }`,
      )
      .join('\n\n');
    const futureChaptersOriginal = futureChapters
      .map((ch) => `Chapter ${ch.number}: "${ch.title}" - Expected Plot: ${ch.summary}`)
      .join('\n');

    return {
      title: input.title,
      genre: input.genre,
      worldview: input.worldview,
      characterInfo: characterInfo || '(无角色信息)',
      kbContextString,
      completedChaptersSummary: completedChaptersSummary || '(无已完成章节)',
      futureChaptersOriginal: futureChaptersOriginal || '(无后续章节)',
      completedChapterNumber: String(completedChapter?.number ?? '?'),
    };
  },
};

export function runRollingOutlinePrompt(
  input: RollOutlineRequest,
  requestId?: string,
): Promise<RollOutlineResponse> {
  return runPrompt('./rolling-outline', module, input, requestId);
}
