import type { SuggestKBEntryRequest, SuggestKBEntryResponse } from '@arcadia/shared';
import { runPrompt, type PromptModule } from '../_loader';
import { loreExtractSchema } from './schema';

const module: PromptModule<SuggestKBEntryRequest, SuggestKBEntryResponse> = {
  name: 'Lore Agent',
  schema: loreExtractSchema,
  buildVars: (input) => ({
    title: input.title,
    chapterTitle: input.chapterTitle,
    chapterContentExcerpt: (input.chapterContent || '').substring(0, 3000),
  }),
};

export function runLoreExtractPrompt(
  input: SuggestKBEntryRequest,
  requestId?: string,
): Promise<SuggestKBEntryResponse> {
  return runPrompt('./lore-extract', module, input, requestId);
}
