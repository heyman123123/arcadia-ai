/**
 * Lore Service
 *
 * 从章节内容里抽取新 lore,推荐到知识库。
 */

import type { SuggestKBEntryRequest, SuggestKBEntryResponse } from '@arcadia/shared';
import { runLoreExtractPrompt } from '../prompts/lore-extract';
import { ValidationError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';

export const loreService = {
  async suggest(
    input: SuggestKBEntryRequest,
    requestId?: string,
  ): Promise<SuggestKBEntryResponse> {
    if (!input.chapterContent) {
      throw new ValidationError({ chapterContent: 'required' }, 'chapterContent is required');
    }
    logger.info(`[Lore] extracting from "${input.chapterTitle}"`, undefined, requestId);
    return runLoreExtractPrompt(input, requestId);
  },
};
