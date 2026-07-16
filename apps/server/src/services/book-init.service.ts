/**
 * book-init Service
 *
 * 负责生成新书的初始骨架(世界观/角色/大纲/初始知识库)。
 */

import type { BookInitRequest, BookInitResponse } from '@arcadia/shared';
import { runBookInitPrompt } from '../prompts/book-init';
import { logger } from '../infrastructure/logger';

export const bookInitService = {
  async execute(input: BookInitRequest, requestId?: string): Promise<BookInitResponse> {
    logger.info('[BookInit] start', { title: input.title, genre: input.genre }, requestId);
    const result = await runBookInitPrompt(input, requestId);
    logger.info('[BookInit] done', {
      worldviewLen: result.worldview?.length,
      characterCount: result.characters?.length,
      outlineCount: result.outline?.length,
    }, requestId);
    return result;
  },
};
