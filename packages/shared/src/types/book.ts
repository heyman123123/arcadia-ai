/**
 * 书籍 / 章节 / 场景 领域类型
 *
 * 这些类型是前后端共用的契约:前端 BookStore 用它们管理状态,
 * 后端 controllers/services 用它们做入参校验和响应序列化。
 */

// ---- 字面量联合(不用 enum,避免运行时膨胀) ----

/** 章节状态(章节字段 `status` 的取值) */
export type ChapterStatus =
  | 'pending'     // 待创作
  | 'planning'    // 大纲智子规划中
  | 'drafting'    // 写作智子撰写中
  | 'reviewing'   // 审校智子评审中
  | 'completed';  // 正式完成

/** 场景冲突强度(场景字段 `conflictLevel`) */
export type ConflictLevel = 'low' | 'medium' | 'high';

// ---- 实体 ----

/** 单个分镜场景(由规划阶段产出,作为撰写阶段的输入) */
export interface Scene {
  title: string;
  summary: string;
  characters: string[];
  conflictLevel: ConflictLevel;
  targetWordCount: number;
}

/** 单个章节 */
export interface Chapter {
  number: number;
  title: string;
  summary: string;
  content: string;
  status: ChapterStatus;
  /** 规划阶段产出的分镜列表(可选) */
  scenes?: Scene[];
  /** 规划阶段标记的"本章激活上下文"(可选) */
  activeContextHighlights?: string[];
}

/** 书籍项目(顶层聚合根) */
export interface BookProject {
  id: string;
  title: string;
  genre: string;
  brief: string;
  worldview: string;
  characters: Character[];
  writingPrompt: string;
  chapters: Chapter[];
  knowledgeBase: KBEntry[];
  currentChapterIndex: number;
  /** 形如 "2026-07-15 14:30" */
  createdAt: string;
  /** 新建书籍时的 AI 初始化进行中标记 */
  isInitializing?: boolean;
}

// 注:Character/KBEntry 在同包另文件定义,这里只 import 类型
// 真正的 import 在文件底部,避免循环引用
import type { Character } from './character';
import type { KBEntry } from './knowledge-base';
