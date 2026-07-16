/**
 * BookRepository 接口
 *
 * 本期架构占位:前端书架管理走 localStorage,后端不存 book。
 * 未来若要把 book 持久化到 DB,只需实现此接口并在 services 调用即可,
 * 上层代码(controllers/services)不用动。
 */

import type { BookProject } from '@arcadia/shared';

export interface BookRepository {
  get(id: string): Promise<BookProject | null>;
  list(): Promise<BookProject[]>;
  save(book: BookProject): Promise<void>;
  delete(id: string): Promise<void>;
}
