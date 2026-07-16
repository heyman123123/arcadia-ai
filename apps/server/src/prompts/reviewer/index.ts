import { runPrompt, type PromptModule } from '../_loader';
import { reviewerSchema } from './schema';

export interface ReviewerInput {
  title: string;
  genre: string;
  worldview: string;
  characterInfo: string;
  writingPrompt: string;
  kbContextString: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  draftContent: string;
}

export interface ReviewerOutput {
  critique: string;
  suggestions: string[];
  score: number;
}

const module: PromptModule<ReviewerInput, ReviewerOutput> = {
  name: 'Reviewing Agent',
  schema: reviewerSchema,
  buildVars: (input) => ({
    title: input.title,
    genre: input.genre,
    worldview: input.worldview,
    characterInfo: input.characterInfo,
    writingPrompt: input.writingPrompt,
    kbContextString: input.kbContextString,
    chapterNumber: String(input.chapterNumber),
    chapterTitle: input.chapterTitle,
    chapterSummary: input.chapterSummary,
    draftContent: input.draftContent || '(空草稿)',
  }),
};

export function runReviewerPrompt(
  input: ReviewerInput,
  requestId?: string,
): Promise<ReviewerOutput> {
  return runPrompt('./reviewer', module, input, requestId);
}
