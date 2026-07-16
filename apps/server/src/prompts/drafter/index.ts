import type { StyleFilters } from '@arcadia/shared';
import { runPrompt, type PromptModule } from '../_loader';
import { drafterSchema } from './schema';

export interface DrafterInput {
  title: string;
  genre: string;
  worldview: string;
  characterInfo: string;
  writingPrompt: string;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  sceneIndex: number;
  sceneCount: number;
  sceneTitle: string;
  sceneSummary: string;
  sceneCharacters: string;
  sceneConflictLevel: string;
  targetWordCount: number;
  previousSections: string;
  styleRulesText: string;
  kbContextString: string;
  steeringPrompt: string;
  styleFilters?: StyleFilters;
}

const module: PromptModule<DrafterInput, { prose: string; sceneHighlights: string[] }> = {
  name: 'Drafting Agent',
  schema: drafterSchema,
  buildVars: (input) => ({
    title: input.title,
    genre: input.genre,
    worldview: input.worldview,
    characterInfo: input.characterInfo,
    writingPrompt: input.writingPrompt,
    chapterNumber: String(input.chapterNumber),
    chapterTitle: input.chapterTitle,
    chapterSummary: input.chapterSummary,
    sceneIndex: String(input.sceneIndex + 1),
    sceneCount: String(input.sceneCount),
    sceneTitle: input.sceneTitle,
    sceneSummary: input.sceneSummary,
    sceneCharacters: input.sceneCharacters,
    sceneConflictLevel: input.sceneConflictLevel,
    targetWordCount: String(input.targetWordCount),
    previousSections: input.previousSections,
    styleRulesText: input.styleRulesText,
    kbContextString: input.kbContextString,
    steeringPrompt: input.steeringPrompt,
  }),
};

export function runDrafterScenePrompt(
  input: DrafterInput,
  requestId?: string,
): Promise<{ prose: string; sceneHighlights: string[] }> {
  return runPrompt('./drafter', module, input, requestId);
}
