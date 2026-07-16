/**
 * book-init Prompt 模块
 *
 * 入口:runBookInitPrompt(input, requestId) → BookInitResponse
 */

import type { BookInitRequest, BookInitResponse } from '@arcadia/shared';
import { runPrompt, type PromptModule } from '../_loader';
import { bookInitSchema } from './schema';

const module: PromptModule<BookInitRequest, BookInitResponse> = {
  name: 'BookInit Agent',
  schema: bookInitSchema,
  buildVars: (input) => ({
    title: input.title,
    genre: input.genre || 'Fantasy/Sci-Fi',
    brief: input.brief || 'A captivating story',
  }),
};

export function runBookInitPrompt(
  input: BookInitRequest,
  requestId?: string,
): Promise<BookInitResponse> {
  return runPrompt('./book-init', module, input, requestId);
}
