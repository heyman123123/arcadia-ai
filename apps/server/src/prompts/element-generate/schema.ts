import { Type, type Schema } from '../schema-types';

export const elementGenerateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    combatOrMechanic: { type: Type.STRING },
  },
  required: ['title', 'description', 'combatOrMechanic'],
};
