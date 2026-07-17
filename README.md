# Arcadia AI

> 多智能体协同小说创作工作台 — 林间静谧的灵感书房。
> 一书一独立知识库,人类导演随时以"断点干预 / 从此处重写"掌控小说主线。

## ✨ 核心特性

- **多智能体流水线**:规划(Planner) → 撰写(Draftsmith) → 审校(Editor) 三阶段自动跑,每章都跑过 LLM 循环
- **一书一知识库**:每本书维护独立的 worldview / characters / timeline 条目,自动从章节正文抽取 Lore
- **滚动大纲**:写完一章后自动重排后续章节,长篇不崩图
- **导演干预**:任意时刻插入 steering prompt,智能体下次跑会自动融合
- **OpenAI 兼容 AI**:支持 OpenAI 官方 + MiniMax(中国),自动降级,任意一个 key 都能用
- **SQLite 持久化**:后端数据落盘,前端书架走 localStorage

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│                          浏览器(React 19)                      │
│  features/  components/  layouts/  stores/  api/              │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP /api/*
┌───────────────────────────▼─────────────────────────────────┐
│                       Express Server                         │
│  routes/ → controllers/ → services/ → {repositories, prompts} │
│                            ↓                                  │
│  infrastructure/  ├ ai-client/ (OpenAI 兼容, OpenAI + MiniMax)  │
│                  ├ sqlite   (better-sqlite3)                │
│                  └ logger / errors / request-id             │
└───────────────────────────┬─────────────────────────────────┘
                            │ OpenAI-compatible API
                ┌───────────┴──────────┐
                │  OpenAI / MiniMax   │
                └──────────────────────┘
```

Monorepo 布局(参见 `docs/architecture/refactor-design.md`):

```
arcadia-ai/
├── apps/
│   ├── web/                  # React 19 + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── App.tsx           # 根组件(handler 集中)
│   │   │   ├── api/              # 后端调用层
│   │   │   ├── components/       # 通用 UI(8 个原子组件)
│   │   │   ├── features/         # 业务模块(8 个)
│   │   │   ├── lib/              # cn() 等小工具
│   │   │   ├── stores/           # Zustand 状态(8 个 store)
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── server/               # Express + TypeScript
│       ├── src/
│       │   ├── index.ts          # 入口
│       │   ├── app.ts            # Express app 工厂
│       │   ├── config.ts         # 路径/端口
│       │   ├── env.ts(zod 校验)   # 写在 infrastructure/
│       │   ├── routes/           # 路由
│       │   ├── controllers/      # 控制器(参数校验 + 响应)
│       │   ├── services/         # 业务编排
│       │   ├── repositories/     # 数据访问(SQLite + 内存实现)
│       │   ├── prompts/          # 8 个 prompt 模块(system.md + schema.ts + index.ts)
│       │   ├── infrastructure/  # ai-client / sqlite / logger / errors / middleware
│       │   └── middleware/
│       └── data/arcadia.db   # SQLite 文件(运行时生成)
│
├── packages/
│   └── shared/               # 前后端共享 types / api contracts
│
├── docs/architecture/        # 架构设计文档
└── pnpm-workspace.yaml
```

## 🚀 快速开始

### 1. 准备环境

- Node.js **20+**(推荐 22 LTS)
- pnpm **9+**(推荐 10+):`npm i -g pnpm`
- 一个 AI provider 的 API key(OpenAI 或 MiniMax 二选一)

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置 `.env`

```bash
cp .env.example .env
# 编辑 .env,填入你的 key
```

最少填一个:

```bash
# 走 OpenAI 官方
OPENAI_API_KEY=sk-xxx

# 或走 MiniMax(中国,OpenAI 协议兼容)
MINIMAX_API_KEY=your_minimax_key
```

> 详细的 provider 切换、模型名修改、storage 切换,见 `.env` 注释。

### 4. 启动 dev

```bash
pnpm dev
```

- 前端: <http://localhost:5173>(Vite 代理 → 3000)
- 后端: <http://localhost:3000>
- 健康检查: <http://localhost:3000/api/health>  ← 看 db / ai 状态

### 5. 构建生产

```bash
pnpm build          # web + server 都 build
pnpm --filter @arcadia/web preview   # 预览前端
pnpm --filter @arcadia/server start # 跑后端生产 build
```

## ⚙️ 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 后端 HTTP 端口 |
| `VITE_PORT` | `5173` | Vite dev 端口 |
| `STORAGE` | `sqlite` | `sqlite` 落盘 / `memory` 内存(测试用) |
| `AI_PROVIDER` | `auto` | `auto` 优先 MiniMax / `openai` 强制 / `minimax` 强制 |
| `OPENAI_API_KEY` | _空_ | OpenAI 官方 key(留空 = 不启用) |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI 模型名 |
| `MINIMAX_API_KEY` | _空_ | MiniMax key(留空 = 不启用) |
| `MINIMAX_MODEL` | `MiniMax-M2` | MiniMax 模型名(`M2.7` / `M3` 也行) |

**Provider 自动降级**:`AI_PROVIDER=auto` 时,按顺序尝试所有配了 key 的 provider,
任一成功就返回,全部失败才抛错。

## 🗄️ 持久化

后端默认用 SQLite,文件路径 `apps/server/data/arcadia.db`(首次启动自动创建)。

- 数据表 `books`:存 BookProject(整段 JSON),附加 `title`/`genre` 索引列方便搜索
- WAL 模式 + 索引 `updated_at DESC`,list 性能足够个人使用
- 切回内存模式: `STORAGE=memory pnpm dev`(进程重启数据丢)
- 健康检查端点 `GET /api/health` 报告 `db.count` 和 `backend`

### Schema 迁移

SQL schema 变更走**版本化迁移**(`apps/server/src/infrastructure/db/migrations/`)。

- 启动期自动跑所有 pending migration(`migrator.up()`,事务执行,失败回滚)
- 每条 migration 一个 `.sql` 文件,命名 `NNN_snake_name.sql`,按数字升序跑
- 已 applied 的记录在 `schema_migrations` 表(version + checksum),改老文件会触发 WARN 提醒
- 改 `BookProject` 字段**不需要** SQL 迁移(数据存 JSON,自动容纳);加新表/新列/新索引才需要新 `.sql`
- 详细规则 & 写作指南见 [`apps/server/src/infrastructure/db/README.md`](apps/server/src/infrastructure/db/README.md)
- 测试:`pnpm --filter @arcadia/server test:migrator`(5 个场景:全新 / 幂等 / 升级 / 错误 SQL / 改老文件)

## 🤖 AI 客户端

`infrastructure/ai-client/` 抽象了 AI 调用:

- `OpenAICompatibleClient`:一个类,既支持 OpenAI 官方,也支持所有 OpenAI 协议兼容服务(MiniMax / DeepSeek / 月之暗面 等),通过 `baseURL` + `model` 切换
- `AIManager`:管理多个 provider,按 `AI_PROVIDER` 决定顺序,失败自动降级下一个
- JSON 解析:用 `parseRobustJson` 处理 ```json``` 围栏和非严格 JSON

要加新 provider(比如 Anthropic)只要扩展 `OpenAICompatibleClient` 或写个新 client,
`AIManager` 不动。

## 📜 Prompt 架构

每个 AI agent 是一个 prompt 模块,统一在 `apps/server/src/prompts/`:

```
prompts/
├── book-init/
│   ├── system.md     ← 提示词(可由非技术 PM 改)
│   ├── schema.ts     ← JSON Schema(注入 system 让 LLM 按此结构输出)
│   └── index.ts       ← buildVars + runPrompt
├── planner/  drafter/  reviewer/  refiner/
├── rolling-outline/  lore-extract/  element-generate/
```

修改文案只动 `system.md`,不影响代码;改输出格式只动 `schema.ts`。
阶段 0 重构时已规定:**不提供 fallback mock**,失败直接 throw,由前端 catch 展示。

## 🔌 API 端点

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 + db / ai 状态 |
| POST | `/api/books/generate-init` | 初始化一本书(世界观/角色/大纲/知识库) |
| POST | `/api/agent/run-pipeline-step` | 跑流水线单阶段(`planning`/`drafting`/`reviewing`) |
| POST | `/api/agent/roll-outline` | 滚动大纲(基于已写章节重排后续) |
| POST | `/api/books/suggest-kb-entry` | 从章节正文抽取 Lore 建议 |
| POST | `/api/books/generate-element` | 生成元素(技能/规则/咒语) |

所有响应统一信封:`{ data, requestId }`,错误:`{ error: { code, message, details?, requestId } }`。

## 🛠️ 开发命令

```bash
# 跑全部(前端 + 后端,热重载)
pnpm dev

# 单跑一个
pnpm dev:web
pnpm dev:server

# 类型检查
pnpm -r lint              # 全部包
pnpm --filter @arcadia/web lint
pnpm --filter @arcadia/server lint

# 构建
pnpm build                # 全部
pnpm --filter @arcadia/web build

# 清理
pnpm -r clean             # 删 dist / node_modules

# 迁移系统测试
pnpm --filter @arcadia/server test:migrator
```

## 🧭 调试

- 后端日志:每条带 `requestId`,前端报错能 grep 到
- `curl http://localhost:3000/api/health` 看 db / ai 状态
- 改 prompt 后热重载:server 跑 `tsx watch` 会自动重载
- sqlite 调试:`sqlite3 apps/server/data/arcadia.db` 或 `node apps/server/node_modules/.bin/better-sqlite3` (无 CLI 的话)

## 📚 架构设计

参见 [`docs/architecture/refactor-design.md`](docs/architecture/refactor-design.md)。

## 🗝️ 协议

MIT
