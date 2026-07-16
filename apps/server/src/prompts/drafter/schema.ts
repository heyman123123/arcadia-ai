import { Type, type Schema } from '../schema-types';

export const drafterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    prose: { type: Type.STRING },
    sceneHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['prose', 'sceneHighlights'],
};
