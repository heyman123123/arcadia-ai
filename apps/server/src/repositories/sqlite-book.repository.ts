/**
 * SQLite 版 BookRepository
 *
 * Schema:
 *   books 表
 *     - id         TEXT PRIMARY KEY
 *     - title      TEXT
 *     - genre      TEXT
 *     - data       TEXT  -- 完整 BookProject 的 JSON 序列化
 *     - updated_at INTEGER  -- Unix ms
 *
 * 设计取舍:
 *   - 用单表 + JSON 字段,避免过早规范化(BookProject 嵌套深、关联多)
 *   - 同时维护 title/genre 两个独立列,方便 list 排序和搜索,不用每次都解 JSON
 *   - updated_at 用 INTEGER(ms),SQLite 没有原生 timestamp,用毫秒最方便
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import type { BookProject } from '@arcadia/shared';
import { logger } from '../infrastructure/logger';
import type { BookRepository } from './book.repository';

export class SqliteBookRepository implements BookRepository {
  private db: Database.Database;
  private stmtInsert: Database.Statement;
  private stmtUpdate: Database.Statement;
  private stmtGet: Database.Statement;
  private stmtList: Database.Statement;
  private stmtDelete: Database.Statement;

  constructor(dbPath: string) {
    // 确保父目录存在
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // 性能 + 并发读
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id         TEXT PRIMARY KEY,
        title      TEXT NOT NULL,
        genre      TEXT NOT NULL,
        data       TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at DESC);
    `);

    this.stmtInsert = this.db.prepare(
      `INSERT INTO books (id, title, genre, data, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, genre=excluded.genre, data=excluded.data, updated_at=excluded.updated_at`,
    );
    this.stmtUpdate = this.db.prepare(
      `UPDATE books SET title=?, genre=?, data=?, updated_at=? WHERE id=?`,
    );
    this.stmtGet = this.db.prepare(`SELECT data FROM books WHERE id = ?`);
    this.stmtList = this.db.prepare(
      `SELECT data FROM books ORDER BY updated_at DESC`,
    );
    this.stmtDelete = this.db.prepare(`DELETE FROM books WHERE id = ?`);

    logger.info(`[SqliteBookRepository] opened ${dbPath}`);
  }

  async get(id: string): Promise<BookProject | null> {
    const row = this.stmtGet.get(id) as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data) as BookProject;
    } catch (e) {
      logger.error(`[SqliteBookRepository] parse failed for ${id}`, { error: (e as Error).message });
      return null;
    }
  }

  async list(): Promise<BookProject[]> {
    const rows = this.stmtList.all() as Array<{ data: string }>;
    return rows
      .map((r) => {
        try {
          return JSON.parse(r.data) as BookProject;
        } catch {
          return null;
        }
      })
      .filter((b): b is BookProject => b !== null);
  }

  async save(book: BookProject): Promise<void> {
    const now = Date.now();
    const data = JSON.stringify(book);
    this.stmtInsert.run(book.id, book.title, book.genre, data, now);
  }

  async delete(id: string): Promise<void> {
    this.stmtDelete.run(id);
  }

  /** 关闭连接(测试用) */
  close(): void {
    this.db.close();
  }
}
