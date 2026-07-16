import { Type, type Schema } from '../schema-types';

export const reviewerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    critique: { type: Type.STRING },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    score: { type: Type.INTEGER },
  },
  required: ['critique', 'suggestions', 'score'],
};
