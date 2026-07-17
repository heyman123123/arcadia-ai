/**
 * SQLite 版 BookRepository
 *
 * Schema 由 infrastructure/db/migrations/ 下的 .sql 文件管理
 * 启动时调 migrator 把所有 pending 迁移跑完,再准备 statement。
 *
 * 数据布局:
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
 *   - 改 BookProject 字段不需要 SQL 迁移(只改 data JSON);改表结构才需要新 .sql
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import type { BookProject } from '@arcadia/shared';
import { logger } from '../infrastructure/logger';
import { runMigrations } from '../infrastructure/db/migrator';
import type { BookRepository } from './book.repository';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // 跑所有 pending schema 迁移(幂等;重跑不会重复执行)
    const migrationsDir = path.join(__dirname, '../infrastructure/db/migrations');
    const result = runMigrations(this.db, migrationsDir);
    if (result.applied.length > 0) {
      logger.info(
        `[SqliteBookRepository] applied ${result.applied.length} migration(s): ${result.applied.map((a) => a.name).join(', ')}`,
      );
    }

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
