import { runPrompt, type PromptModule } from '../_loader';
import { refinerSchema } from './schema';

export interface RefinerInput {
  title: string;
  genre: string;
  worldview: string;
  writingPrompt: string;
  critique: string;
  suggestions: string[];
  draftContent: string;
}

export interface RefinerOutput {
  polishedContent: string;
}

const module: PromptModule<RefinerInput, RefinerOutput> = {
  name: 'Refining Agent',
  schema: refinerSchema,
  buildVars: (input) => ({
    title: input.title,
    genre: input.genre,
    worldview: input.worldview,
    writingPrompt: input.writingPrompt,
    critique: input.critique,
    suggestionsFormatted: (input.suggestions || []).map((s) => `- ${s}`).join('\n') || '- (无具体建议)',
    draftContent: input.draftContent,
  }),
};

export function runRefinerPrompt(
  input: RefinerInput,
  requestId?: string,
): Promise<RefinerOutput> {
  return runPrompt('./refiner', module, input, requestId);
}
