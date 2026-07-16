/**
 * 知识库 / Lore 领域类型
 *
 * 知识库是"一书一独立知识库"系统的核心数据,
 * 用来约束 AI 创作不出现世界观/人设/时间线 偏离。
 */

/** 知识库条目分类 */
export type KBCategory = 'worldview' | 'characters' | 'timeline';

/** 知识库条目(用户手动 / AI 自动抽取) */
export interface KBEntry {
  id: string;
  category: KBCategory;
  title: string;
  content: string;
}

/**
 * 后端 /api/books/suggest-kb-entry 抽取出的 Lore 建议
 * (比 KBEntry 多一个 reason 字段,解释为什么要加入知识库)
 */
export interface LoreSuggestion {
  category: KBCategory;
  title: string;
  content: string;
  reason: string;
}
