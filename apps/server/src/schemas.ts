/**
 * Zod 入参 schemas
 *
 * Controller 入参校验用,统一在一个文件方便审阅。
 * 校验失败抛 ValidationError → 400。
 */

import { z } from 'zod';

// ===== POST /api/books/generate-init =====
export const bookInitSchema = z.object({
  title: z.string().min(1, 'title is required'),
  genre: z.string().default('Fantasy/Sci-Fi'),
  brief: z.string().default(''),
});

// ===== POST /api/agent/run-pipeline-step =====
export const pipelineStepSchema = z.object({
  title: z.string(),
  genre: z.string(),
  worldview: z.string(),
  characters: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      description: z.string(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  writingPrompt: z.string(),
  chapters: z.array(
    z.object({
      number: z.number(),
      title: z.string(),
      summary: z.string(),
      content: z.string(),
      status: z.string(),
      scenes: z
        .array(
          z.object({
            title: z.string(),
            summary: z.string(),
            characters: z.array(z.string()),
            conflictLevel: z.string(),
            targetWordCount: z.number(),
          }),
        )
        .optional(),
      activeContextHighlights: z.array(z.string()).optional(),
    }),
  ),
  currentChapterIndex: z.number().int().nonnegative(),
  stage: z.enum(['planning', 'drafting', 'reviewing']),
  steeringPrompt: z.string().default(''),
  knowledgeBase: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      title: z.string(),
      content: z.string(),
    }),
  ),
  currentDraftContent: z.string().default(''),
  styleFilters: z
    .object({
      noCliches: z.boolean(),
      showDontTell: z.boolean(),
      slowPacing: z.boolean(),
      keepMystery: z.boolean(),
    })
    .optional(),
});

// ===== POST /api/agent/roll-outline =====
export const rollOutlineSchema = z.object({
  title: z.string(),
  genre: z.string(),
  worldview: z.string(),
  characters: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      description: z.string(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  writingPrompt: z.string(),
  chapters: z.array(
    z.object({
      number: z.number(),
      title: z.string(),
      summary: z.string(),
      content: z.string(),
      status: z.string(),
    }),
  ),
  currentChapterIndex: z.number().int().nonnegative(),
  knowledgeBase: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      title: z.string(),
      content: z.string(),
    }),
  ),
});

// ===== POST /api/books/suggest-kb-entry =====
export const suggestKbEntrySchema = z.object({
  title: z.string(),
  worldview: z.string(),
  characters: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      description: z.string(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  chapterContent: z.string().min(1, 'chapterContent is required'),
  chapterTitle: z.string(),
});

// ===== POST /api/books/generate-element =====
export const generateElementSchema = z.object({
  type: z.string(),
  title: z.string(),
  worldview: z.string().default(''),
  detail: z.string().default(''),
});
