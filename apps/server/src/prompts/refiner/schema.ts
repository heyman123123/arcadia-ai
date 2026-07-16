import { Type, type Schema } from '../schema-types';

export const refinerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    polishedContent: { type: Type.STRING },
  },
  required: ['polishedContent'],
};
