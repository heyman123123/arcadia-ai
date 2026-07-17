-- 001: init
-- 初始 schema:创建 books 表 + 按 updated_at 倒序的索引
-- 设计说明:
--   - books 表存书籍,完整 BookProject JSON 序列化进 data 列
--   - title/genre 单独拉出来做 list 排序/搜索,不用每次都解 JSON
--   - updated_at 用 INTEGER 存毫秒,SQLite 没有原生 timestamp
--   - id 是 nanoid 字符串(由前端生成)
-- Authored: 2026-07-17

CREATE TABLE books (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  genre      TEXT NOT NULL,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_books_updated_at ON books(updated_at DESC);
