import { Type, type Schema } from '../schema-types';

export const loreExtractSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING },
    title: { type: Type.STRING },
    content: { type: Type.STRING },
    reason: { type: Type.STRING },
  },
  required: ['category', 'title', 'content', 'reason'],
};
