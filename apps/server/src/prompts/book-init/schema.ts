/**
 * book-init 的 Gemini responseSchema
 */

import { Type, type Schema } from '../schema-types';

export const bookInitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    worldview: { type: Type.STRING },
    writingPrompt: { type: Type.STRING },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          description: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['name', 'role', 'description', 'skills'],
      },
    },
    outline: {
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
    initialKnowledgeBase: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ['category', 'title', 'content'],
      },
    },
  },
  required: ['worldview', 'characters', 'writingPrompt', 'outline', 'initialKnowledgeBase'],
};
