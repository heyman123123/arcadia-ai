/**
 * Migrator 端到端冒烟测试
 *
 * 覆盖:
 *   1. 全新 DB → 应用所有 migrations → schema 正确
 *   2. 重跑 → 幂等(applied=0, skipped=N)
 *   3. 模拟升级(写一条 002_add_chapter_index.sql 到临时目录)→ 只跑新增那条
 *   4. 故意写一条语法错的 migration → 抛错 + DB 状态保持上一条成功之后
 *   5. checksum 改动检测:改老文件 → WARN 但不阻塞
 *
 * 跑法:`pnpm --filter @arcadia/server test:migrator`
 *       (本脚本会创建临时 DB + 临时 migrations 目录,跑完清理)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import {
  runMigrations,
  listApplied,
} from '../src/infrastructure/db/migrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'arcadia-mig-test-'));
const dbPath = path.join(tmpRoot, 'test.db');
const migrationsDir = path.join(tmpRoot, 'migrations');

function log(label: string, ok: boolean, detail = ''): void {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
}

function assert(cond: boolean, label: string, detail = ''): void {
  log(label, cond, detail);
}

function freshDb(): Database.Database {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  return new Database(dbPath);
}

function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name: string } | undefined;
  return Boolean(row);
}

function tableColumns(db: Database.Database, name: string): string[] {
  // PRAGMA 不能用 prepared,直接 exec
  return (db.prepare(`PRAGMA table_info(${name})`).all() as Array<{ name: string }>).map(
    (r) => r.name,
  );
}

console.log(`\n== test root: ${tmpRoot} ==\n`);

// ============================================================
// Test 1: fresh DB
// ============================================================
{
  // 把真实 migrations 目录拷到临时位置(隔离)
  const realMigrations = path.join(__dirname, '../src/infrastructure/db/migrations');
  fs.cpSync(realMigrations, migrationsDir, { recursive: true });

  const db = freshDb();
  const result = runMigrations(db, migrationsDir);

  assert(result.applied.length === 1, 'T1 fresh DB: applies exactly 001', `applied=${result.applied.length}`);
  assert(result.applied[0]?.name === 'init', 'T1 fresh DB: applied migration is "init"');
  assert(tableExists(db, 'books'), 'T1 fresh DB: books table created');
  assert(tableExists(db, 'schema_migrations'), 'T1 fresh DB: schema_migrations table created');
  const cols = tableColumns(db, 'books');
  for (const c of ['id', 'title', 'genre', 'data', 'updated_at']) {
    assert(cols.includes(c), `T1 fresh DB: books.${c} exists`);
  }
  const idx = db
    .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_books_updated_at'")
    .get();
  assert(Boolean(idx), 'T1 fresh DB: idx_books_updated_at created');
  db.close();
}

// ============================================================
// Test 2: idempotent re-run
// ============================================================
{
  const db = new Database(dbPath);
  const result = runMigrations(db, migrationsDir);
  assert(result.applied.length === 0, 'T2 re-run: nothing new applied');
  assert(result.skipped === 1, 'T2 re-run: skipped count is 1');
  const applied = listApplied(db);
  assert(applied.length === 1, 'T2 re-run: schema_migrations still has 1 record');
  db.close();
}

// ============================================================
// Test 3: simulated upgrade — add 002 migration
// ============================================================
{
  const db = new Database(dbPath);

  // 添加 002 migration(模拟未来加新列)
  fs.writeFileSync(
    path.join(migrationsDir, '002_add_chapter_count.sql'),
    `-- 002: add chapter count\nALTER TABLE books ADD COLUMN chapter_count INTEGER NOT NULL DEFAULT 0;\n`,
  );

  const result = runMigrations(db, migrationsDir);
  assert(result.applied.length === 1, 'T3 upgrade: applies exactly 002');
  assert(result.applied[0]?.name === 'add_chapter_count', 'T3 upgrade: applied migration is "add_chapter_count"');
  assert(result.skipped === 1, 'T3 upgrade: skipped count is 1 (001 already applied)');
  const cols = tableColumns(db, 'books');
  assert(cols.includes('chapter_count'), 'T3 upgrade: books.chapter_count added');
  db.close();
}

// ============================================================
// Test 4: bad migration fails loudly and rolls back
// ============================================================
{
  const db = new Database(dbPath);
  fs.writeFileSync(
    path.join(migrationsDir, '003_bad.sql'),
    `-- 003: bad\nTHIS IS NOT VALID SQL;\n`,
  );

  let threw = false;
  try {
    runMigrations(db, migrationsDir);
  } catch {
    threw = true;
  }
  assert(threw, 'T4 bad migration: throws');

  // schema_migrations 应该只到 002(003 没被记进去)
  const applied = listApplied(db);
  assert(applied.length === 2, 'T4 bad migration: schema_migrations still at 2 (003 not recorded)');
  assert(!applied.some((r) => r.name === 'bad'), 'T4 bad migration: 003 not in schema_migrations');

  // 003 文件留着,下次启动还会重试
  db.close();
}

// ============================================================
// Test 5: mutating an old migration triggers a WARN (not a throw)
// ============================================================
{
  // 先把 003_bad 拿掉,避免它干扰本次断言
  fs.rmSync(path.join(migrationsDir, '003_bad.sql'), { force: true });

  const db = new Database(dbPath);
  // 把 002 改成不一样的 SQL(改 checksum,但不动 applied 行)
  const before = fs.readFileSync(path.join(migrationsDir, '002_add_chapter_count.sql'), 'utf-8');
  fs.writeFileSync(
    path.join(migrationsDir, '002_add_chapter_count.sql'),
    before + '\n-- sneaky extra comment to change checksum\n',
  );

  // 不应抛错,只是 WARN
  let threw = false;
  try {
    runMigrations(db, migrationsDir);
  } catch {
    threw = true;
  }
  assert(!threw, 'T5 mutated old migration: does NOT throw');
  const applied = listApplied(db);
  assert(applied.length === 2, 'T5 mutated old migration: applied count unchanged');
  db.close();
}

// 清理
fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(`\n== cleanup done ==\n`);

if (process.exitCode === 1) {
  console.log('💥 some assertions failed');
  process.exit(1);
}
console.log('🎉 all migrator tests passed');
