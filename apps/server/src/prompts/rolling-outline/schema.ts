import { Type, type Schema } from '../schema-types';

export const rollingOutlineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    updatedChapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
        },
        required: ['number', 'title', 'summary'],
      },
    },
  },
  required: ['updatedChapters'],
};
