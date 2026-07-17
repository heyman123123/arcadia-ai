# DB Migration Guide

SQLite schema 迁移规则,适用于 `apps/server/src/infrastructure/db/migrations/` 下的 `.sql` 文件。

## 什么时候需要写 migration

**需要写**(改 SQLite 表结构):
- 加新表
- 给已有表加列(反规范化、索引列等)
- 加新索引
- 建/删 trigger / view

**不需要写**(改领域模型就够了):
- 在 `@arcadia/shared` 里给 `BookProject` 加字段 → 数据存进 `books.data` JSON 列,自动容纳
- 改前端 store / UI 状态

判断口诀:**改 JSON 字段内容不算改 schema;改 SQL 表结构才算。**

## 文件命名

```
migrations/
  001_init.sql              ← 已有
  002_add_chapter_index.sql ← 新加的
  003_*.sql
```

格式:`NNN_snake_name.sql`,`NNN` 是三位递增整数。runner 按数字升序跑。

## 文件内容

每条 migration 就是一段 SQL(可多条 statement,用 `;` 分隔),`runner` 会在一个事务里执行。失败 → 回滚,DB 保持上次成功之后的状态。

文件头部建议加注释说明这次改了什么 / 为什么改:

```sql
-- 002: add chapter index
-- 给 books.data 里的 chapters 数组建一个独立的 chapter_count 列,
-- 方便做"全库章节总数"统计,不用每次 list 都解 JSON。
-- Authored: 2026-07-18

ALTER TABLE books ADD COLUMN chapter_count INTEGER NOT NULL DEFAULT 0;
```

## 启动时自动跑

`SqliteBookRepository` 构造时调 `runMigrations()`,扫描 `migrations/` 目录,只跑还没 applied 的。幂等,重跑没事。

`schema_migrations` 表(自动创建)记每条 applied 迁移的 `version / name / applied_at / checksum`。如果发现磁盘上的 SQL checksum 跟 DB 记录的对不上(说明有人改了老文件),会打 WARN 提醒 —— 不阻塞启动,只是日志提示。

## 生产构建

`pnpm --filter @arcadia/server build` 会自动跑 `scripts/copy-assets.mjs` 把 `migrations/*.sql` 拷到 `dist/`。`tsc` 本身不复制非 TS 资产,需要这一步。

## 不要做的事

- ❌ **改已经 applied 的 migration 文件**。即使只是改注释也不行(会触发 checksum 不匹配警告)。要改就加新文件。
- ❌ **删老 migration 文件**。即使业务表都不用了,留着(或者用 `DROP TABLE` 写新 migration),别从目录里 rm。
- ❌ **写 down migration**。这个系统是 forward-only 的。要回滚,手动从备份恢复 DB。

## 调试

- 查当前已应用的迁移:`SELECT * FROM schema_migrations;`
- 强制重跑:删对应行(慎用,改老文件可能导致数据不一致)
- 全新开始:删 `apps/server/data/arcadia.db` 文件
