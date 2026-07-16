import { Type, type Schema } from '../schema-types';

export const plannerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    refinedTitle: { type: Type.STRING },
    refinedSummary: { type: Type.STRING },
    activeContextHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    thoughtProcess: { type: Type.STRING },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          characters: { type: Type.ARRAY, items: { type: Type.STRING } },
          conflictLevel: { type: Type.STRING },
          targetWordCount: { type: Type.INTEGER },
        },
        required: ['title', 'summary', 'characters', 'conflictLevel', 'targetWordCount'],
      },
    },
  },
  required: ['refinedTitle', 'refinedSummary', 'activeContextHighlights', 'thoughtProcess', 'scenes'],
};
