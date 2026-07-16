/**
 * Repository 工厂
 *
 * 根据 STORAGE env 选择实现:
 *   - 'sqlite'(默认):使用 better-sqlite3,数据落盘到 apps/server/data/arcadia.db
 *   - 'memory':纯内存,进程重启数据丢失(主要用于测试)
 */

import { InMemoryBookRepository } from './in-memory-book.repository';
import { SqliteBookRepository } from './sqlite-book.repository';
import type { BookRepository } from './book.repository';
import { STORAGE_BACKEND, SQLITE_PATH } from '../config';
import { logger } from '../infrastructure/logger';

let _bookRepository: BookRepository | null = null;

export function getBookRepository(): BookRepository {
  if (!_bookRepository) {
    if (STORAGE_BACKEND === 'sqlite') {
      logger.info(`[RepoFactory] using SQLite at ${SQLITE_PATH}`);
      _bookRepository = new SqliteBookRepository(SQLITE_PATH);
    } else {
      logger.info('[RepoFactory] using InMemory (data will not persist)');
      _bookRepository = new InMemoryBookRepository();
    }
  }
  return _bookRepository;
}

/** 测试用:重置单例(例如切 storage 后重连) */
export function _resetBookRepositoryForTest(): void {
  if (_bookRepository && 'close' in _bookRepository) {
    (_bookRepository as { close?: () => void }).close?.();
  }
  _bookRepository = null;
}

export type { BookRepository };
export { SqliteBookRepository } from './sqlite-book.repository';
export { InMemoryBookRepository } from './in-memory-book.repository';
