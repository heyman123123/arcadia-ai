/**
 * Outline Service
 *
 * 写完一章后,根据已发生事件滚动重排后续章节大纲。
 */

import type { RollOutlineRequest, RollOutlineResponse } from '@arcadia/shared';
import { runRollingOutlinePrompt } from '../prompts/rolling-outline';
import { NotFoundError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';

export const outlineService = {
  async roll(input: RollOutlineRequest, requestId?: string): Promise<RollOutlineResponse> {
    const completed = input.chapters[input.currentChapterIndex];
    if (!completed) {
      throw new NotFoundError(`Completed chapter not found at index ${input.currentChapterIndex}`);
    }

    const futureChapters = input.chapters.slice(input.currentChapterIndex + 1);
    if (futureChapters.length === 0) {
      logger.info('[Outline] no subsequent chapters, skipping', undefined, requestId);
      return { updatedChapters: [] };
    }

    logger.info(
      `[Outline] rolling for ${futureChapters.length} subsequent chapters after Ch.${completed.number}`,
      undefined,
      requestId,
    );
    return runRollingOutlinePrompt(input, requestId);
  },
};
