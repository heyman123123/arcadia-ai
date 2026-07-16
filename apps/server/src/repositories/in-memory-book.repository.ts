/**
 * 内存版 BookRepository
 *
 * 本期不挂任何 service,只是占位实现。
 * 阶段 4+ 如果要把书存到后端,再换 SQLite/Postgres 实现。
 */

import type { BookProject } from '@arcadia/shared';
import type { BookRepository } from './book.repository';

export class InMemoryBookRepository implements BookRepository {
  private store = new Map<string, BookProject>();

  async get(id: string) {
    return this.store.get(id) ?? null;
  }

  async list() {
    return Array.from(this.store.values());
  }

  async save(book: BookProject) {
    this.store.set(book.id, book);
  }

  async delete(id: string) {
    this.store.delete(id);
  }
}
