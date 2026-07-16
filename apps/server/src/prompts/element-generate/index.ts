import type { GenerateElementRequest, GenerateElementResponse } from '@arcadia/shared';
import { runPrompt, type PromptModule } from '../_loader';
import { elementGenerateSchema } from './schema';

const module: PromptModule<GenerateElementRequest, GenerateElementResponse> = {
  name: 'Element Agent',
  schema: elementGenerateSchema,
  buildVars: (input) => ({
    title: input.title,
    worldview: input.worldview || 'A fresh novel setting',
    type: input.type,
    detail: input.detail || 'Generate something unique',
  }),
};

export function runElementGeneratePrompt(
  input: GenerateElementRequest,
  requestId?: string,
): Promise<GenerateElementResponse> {
  return runPrompt('./element-generate', module, input, requestId);
}
