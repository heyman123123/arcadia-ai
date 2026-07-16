/**
 * booksStore - 书籍集合
 *
 * 业务核心:管理用户的全部 BookProject,persist 到 localStorage。
 * 业务操作都在这里(createBook / updateChapter / addKBEntry / deleteBook 等),
 * 组件不再直接调 setBooks(prev => ...)。
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BookProject, Chapter, Character, KBEntry } from '@arcadia/shared';

interface BooksState {
  books: BookProject[];

  // --- 派生 getter(从 store 计算,不存) ---
  getBook: (id: string) => BookProject | undefined;

  // --- 写操作 ---
  setBooks: (updater: (prev: BookProject[]) => BookProject[]) => void;

  createBook: (book: BookProject) => void;
  deleteBook: (id: string) => void;

  /** 局部更新某本书(用 updater 改) */
  updateBook: (id: string, updater: (book: BookProject) => BookProject) => void;

  /** 改当前章节的字段(只改当前 active book) */
  updateActiveChapter: (bookId: string, chapterIndex: number, fields: Partial<Chapter>) => void;

  /** 切换当前章节 */
  setCurrentChapter: (bookId: string, index: number) => void;

  /** 给某本书追加 KB 条目 */
  appendKnowledgeBase: (bookId: string, entry: KBEntry) => void;

  /** 给某本书追加/更新角色 */
  addCharacter: (bookId: string, char: Character) => void;
  removeCharacter: (bookId: string, name: string) => void;
  appendSkillToCharacter: (bookId: string, charName: string, skill: string) => void;
}

export const useBooksStore = create<BooksState>()(
  persist(
    (set, get) => ({
      books: [],

      getBook: (id) => get().books.find((b) => b.id === id),

      setBooks: (updater) => {
        const next = updater(get().books);
        set({ books: next });
      },

      createBook: (book) => set({ books: [book, ...get().books] }),

      deleteBook: (id) => set({ books: get().books.filter((b) => b.id !== id) }),

      updateBook: (id, updater) =>
        set({ books: get().books.map((b) => (b.id === id ? updater(b) : b)) }),

      updateActiveChapter: (bookId, chapterIndex, fields) => {
        get().updateBook(bookId, (book) => ({
          ...book,
          chapters: book.chapters.map((ch, idx) => (idx === chapterIndex ? { ...ch, ...fields } : ch)),
        }));
      },

      setCurrentChapter: (bookId, index) => {
        get().updateBook(bookId, (book) => ({ ...book, currentChapterIndex: index }));
      },

      appendKnowledgeBase: (bookId, entry) => {
        get().updateBook(bookId, (book) => ({
          ...book,
          knowledgeBase: [...book.knowledgeBase, entry],
        }));
      },

      addCharacter: (bookId, char) => {
        get().updateBook(bookId, (book) => ({
          ...book,
          characters: [...book.characters, char],
        }));
      },

      removeCharacter: (bookId, name) => {
        get().updateBook(bookId, (book) => ({
          ...book,
          characters: book.characters.filter((c) => c.name !== name),
        }));
      },

      appendSkillToCharacter: (bookId, charName, skill) => {
        get().updateBook(bookId, (book) => ({
          ...book,
          characters: book.characters.map((c) =>
            c.name === charName ? { ...c, skills: [...(c.skills || []), skill] } : c,
          ),
        }));
      },
    }),
    {
      name: 'arcadia_books',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
