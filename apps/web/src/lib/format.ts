/**
 * 渲染层兜底工具
 *
 * 历史数据可能因为 AI 输出与 schema 不一致,带出非 string 类型的字段
 * (典型:`skills: [{name, description}]`)。渲染前先 normalize,避免 React 报
 * "Objects are not valid as a React child"。
 */

type SkillLike = string | { name?: unknown; title?: unknown; description?: unknown } | null | undefined;

/** 把任意形态的 skill 规整为可显示的字符串 */
export function formatSkill(sk: SkillLike): string {
  if (sk == null) return '';
  if (typeof sk === 'string') return sk;
  if (typeof sk === 'object') {
    const name = (sk as { name?: unknown }).name ?? (sk as { title?: unknown }).title;
    const desc = (sk as { description?: unknown }).description;
    if (typeof name === 'string' && name) {
      return desc ? `${name} (${desc})` : name;
    }
    try {
      return JSON.stringify(sk);
    } catch {
      return '';
    }
  }
  return String(sk);
}

/** 把可能为对象的 skill 数组规整为字符串数组(用于持久化前/类型兜底) */
export function normalizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return skills.map((s) => formatSkill(s as SkillLike)).filter(Boolean);
}

/** 把单本书的 characters.skills 全部规整为 string[] */
export function normalizeBook<T extends { characters?: Array<{ skills?: unknown }> }>(book: T): T {
  if (!book || !Array.isArray(book.characters)) return book;
  return {
    ...book,
    characters: book.characters.map((c) => ({
      ...c,
      skills: normalizeSkills(c.skills),
    })),
  };
}

/** 把一组书全部规整(用于 store rehydrate 后的迁移) */
export function normalizeBooks<T extends { characters?: Array<{ skills?: unknown }> }>(books: T[]): T[] {
  if (!Array.isArray(books)) return books;
  return books.map((b) => normalizeBook(b));
}
