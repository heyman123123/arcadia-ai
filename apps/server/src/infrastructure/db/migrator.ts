/**
 * SQLite schema migration runner
 *
 * 思路(golang-migrate 简化版):
 *   - migrations 目录里放 NNN_name.sql 文件,文件名前缀 NNN 是版本号(整数)
 *   - 启动时建一个 schema_migrations 表(version PK, applied_at, name, checksum)
 *   - 扫描目录,按版本号排序,把还没 applied 的都跑一遍
 *   - 每条 migration 在一个事务里执行;失败 → 抛错 + 回滚,数据库保持上次成功状态
 *   - 幂等:再跑一次只会跳过已经 applied 的,不会重复执行
 *
 * 不做 down migration。前进单向。改动一旦 ship,只能再加新文件,不能改老文件。
 *
 * 适用场景:加新表/新索引/反规范化列
 * 不适用:修改 @arcadia/shared 里 BookProject 字段 → 那种改 JSON `data` 列,
 *   不需要 SQL 迁移,也不需要这条 runner 参与。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';
import { logger } from '../logger';

export interface MigrationFile {
  /** 数字版本号(从文件名前缀解析) */
  version: number;
  /** 人类可读的名字(去掉前缀的文件名) */
  name: string;
  /** 文件绝对路径 */
  path: string;
  /** 文件内容 */
  sql: string;
}

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: number;
  checksum: string;
}

export interface MigrationResult {
  applied: Array<{ version: number; name: string }>;
  skipped: number;
}

/**
 * 扫描 migrations 目录,按版本号升序返回所有 .sql 文件
 */
export function loadMigrations(dir: string): MigrationFile[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`[migrator] migrations dir not found: ${dir}`);
  }
  const entries = fs.readdirSync(dir).filter((f) => f.endsWith('.sql'));
  const files: MigrationFile[] = [];
  for (const file of entries) {
    const match = /^(\d+)[_-](.+)\.sql$/.exec(file);
    if (!match) {
      throw new Error(
        `[migrator] bad migration filename: ${file} (expected NNN_name.sql)`,
      );
    }
    const version = Number.parseInt(match[1], 10);
    if (!Number.isInteger(version) || version <= 0) {
      throw new Error(`[migrator] bad migration version: ${file}`);
    }
    const name = match[2];
    const fullPath = path.join(dir, file);
    const sql = fs.readFileSync(fullPath, 'utf-8');
    files.push({ version, name, path: fullPath, sql });
  }
  files.sort((a, b) => a.version - b.version);
  return files;
}

/**
 * 算出当前 DB 记录的 applied versions(初始化空表后返回空集)
 */
function readAppliedVersions(db: Database.Database): Map<number, MigrationRecord> {
  ensureMigrationsTable(db);
  const rows = db
    .prepare('SELECT version, name, applied_at, checksum FROM schema_migrations')
    .all() as MigrationRecord[];
  const map = new Map<number, MigrationRecord>();
  for (const r of rows) map.set(r.version, r);
  return map;
}

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT    NOT NULL,
      applied_at INTEGER NOT NULL,
      checksum   TEXT    NOT NULL
    );
  `);
}

function computeChecksum(sql: string): string {
  return crypto.createHash('sha256').update(sql, 'utf-8').digest('hex');
}

/**
 * 跑所有 pending migrations
 *
 * @throws 任何一条 migration 失败 → 抛 AppError,DB 状态保持上一条成功之后
 */
export function runMigrations(
  db: Database.Database,
  migrationsDir: string,
): MigrationResult {
  const all = loadMigrations(migrationsDir);
  const applied = readAppliedVersions(db);

  // 防御:磁盘上的 migration 如果比 DB 已 applied 的版本低 → 通常意味着有人改老文件
  // 不致命,但记录警告
  for (const m of all) {
    const recorded = applied.get(m.version);
    if (!recorded) continue;
    const currentChecksum = computeChecksum(m.sql);
    if (recorded.checksum !== currentChecksum) {
      logger.warn(
        `[migrator] migration ${pad(m.version)} ${m.name} changed after being applied (recorded=${recorded.checksum.slice(0, 8)}, now=${currentChecksum.slice(0, 8)}). Forward-only: this is informational only.`,
      );
    }
  }

  const result: MigrationResult = { applied: [], skipped: 0 };

  for (const m of all) {
    if (applied.has(m.version)) {
      result.skipped += 1;
      continue;
    }
    applyOne(db, m);
    result.applied.push({ version: m.version, name: m.name });
    logger.info(`[migrator] applied ${pad(m.version)} ${m.name}`);
  }

  if (result.applied.length > 0) {
    logger.info(
      `[migrator] done. applied=${result.applied.length} skipped=${result.skipped}`,
    );
  } else if (result.skipped > 0) {
    logger.debug(`[migrator] schema up-to-date (${result.skipped} applied)`);
  }

  return result;
}

function applyOne(db: Database.Database, m: MigrationFile): void {
  const checksum = computeChecksum(m.sql);
  // better-sqlite3 的 transaction 包一层即可自动 begin/commit/rollback
  const tx = db.transaction((sql: string) => {
    db.exec(sql);
  });
  try {
    tx(m.sql);
  } catch (e) {
    throw new Error(
      `[migrator] failed to apply ${pad(m.version)} ${m.name}: ${(e as Error).message}`,
    );
  }
  db.prepare(
    'INSERT INTO schema_migrations (version, name, applied_at, checksum) VALUES (?, ?, ?, ?)',
  ).run(m.version, m.name, Date.now(), checksum);
}

function pad(n: number): string {
  return n.toString().padStart(3, '0');
}

/** 测试用:取已 applied 列表(返回方便测试) */
export function listApplied(db: Database.Database): MigrationRecord[] {
  return Array.from(readAppliedVersions(db).values()).sort(
    (a, b) => a.version - b.version,
  );
}
