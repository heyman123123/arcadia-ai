# Arcadia AI 架构重构设计文档

> 适用版本: 当前仓库 `main` HEAD
> 文档定位: 一次到位的整体重构蓝图,不是增量改造。
> 读者: 项目 owner / 后续接手开发者 / 代码 review 者。

---

## 0. TL;DR(60 秒看完)

把"前后端都塞在两个单文件里"的状态,拆成下面这套结构:

```
arcadia-ai/
├── apps/
│   ├── web/                    # React 前端(单一职责:UI)
│   └── server/                 # Express 后端(单一职责:API + 业务编排)
├── packages/
│   └── shared/                 # 前后端共享的 TS 类型/常量/契约
├── docs/                       # 你正在读的这套文档
├── package.json                # workspace 根
└── ...
```

**前端** 三层抽离:`features/`(业务) → `components/`(通用组件) → `layouts/`(布局壳)。状态管理从散落的 `useState` 升级到按 feature 域拆分的 `Zustand` store。

**后端** 经典 MVC + 一点 Service 层的混搭:

```
routes/    →  Controller/  →  Service/  →  Repository/  →  Model
                              │
                              └─→  PromptTemplate/  →  GeminiClient
```

**关键决策**(在 §8 展开):
- ✅ 用 `pnpm` workspace(替代根 `package.json` 装所有依赖的现状)
- ✅ 用 `Zustand` 做前端状态(不引 Redux Toolkit,过度设计)
- ✅ prompt 模板、JSON Schema、fallback 全部外置成文件,代码里只调用
- ✅ Repository 层先做内存版,留好 DB 接口(本期不强制上数据库)

---

## 1. 现状痛点分析

### 1.1 量化指标

| 维度 | 现状 | 问题 |
| --- | --- | --- |
| `src/App.tsx` | 2586 行单文件 | 单文件含 ~9 个状态域、~20 个 handler、~5 块 JSX 视图 |
| `server.ts` | 918 行单文件 | 5 个路由、5 套 prompt 模板、5 套 JSON Schema、5 套 fallback 全内联 |
| 前端 state 数量 | 9 个 useState 在一个组件 | 任何 setState 都会触发整树重渲染评估 |
| 后端依赖 | Gemini 模型名硬编码 5 处 | 改模型/换供应商要全文搜索 |
| 类型共享 | 无 | 后端返回的字段前端直接 `any` 接收 |
| 错误处理 | 4 处 try/catch + 静默 fallback | 没有统一错误响应格式 |

### 1.2 真实业务能力清单(从代码反推)

| 业务能力 | 前端入口 | 后端端点 |
| --- | --- | --- |
| 书籍初始化(世界观/角色/大纲/KB) | `handleCreateBook` → `NewBookDialog` | `POST /api/books/generate-init` |
| 多阶段流水线(规划→撰写→评审) | `runNextPipelineStage` | `POST /api/agent/run-pipeline-step` |
| 滚动大纲(写完一章后重排后续) | `triggerRollingOutline` | `POST /api/agent/roll-outline` |
| Lore 抽取(章节 → KB 条目) | `triggerLoreExtraction` | `POST /api/books/suggest-kb-entry` |
| 元素生成(角色技能/规则) | `handleGenerateAISkill` | `POST /api/books/generate-element` |
| 书架管理(CRUD) | 全前端 + localStorage | 无后端(本期也没有) |
| 风格过滤器 | `styleFilters` 状态 | 透传到 prompt 的约束条件 |

> 这 5 个端点 + 1 个"本地书架",就是后端真正要服务的能力面。其他都是状态/UI。

### 1.3 重构的"不要做什么"

为了避免无限蔓延,**本期不重做**:
- ❌ 不引入数据库(留 Repository 接口,先用内存)
- ❌ 不做用户系统/登录/鉴权
- ❌ 不重写 Gemini 调用逻辑(只外置)
- ❌ 不重做 demo 数据(`INITIAL_BOOKS` 仍作为 seed)
- ❌ 不换技术栈(React/Vite/Tailwind/Express/Gemini 全保留)

---

## 2. 目标架构总览

### 2.1 仓库结构(单仓多包)

```
arcadia-ai/
├── apps/
│   ├── web/                       # React + Vite
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx            # 极简:只做路由 + layout 装配
│   │   │   ├── layouts/           # 框架级壳
│   │   │   ├── features/          # 业务模块(核心)
│   │   │   ├── components/        # 通用 UI 原子/分子
│   │   │   ├── stores/            # Zustand store
│   │   │   ├── api/               # 后端调用层
│   │   │   └── styles/            # 全局样式
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── server/                    # Express + TS
│       ├── src/
│       │   ├── index.ts           # 入口:startServer()
│       │   ├── app.ts             # Express app 构造(不监听端口)
│       │   ├── routes/            # 路由声明
│       │   ├── controllers/       # 参数校验 + 响应封装
│       │   ├── services/          # 业务编排
│       │   ├── repositories/      # 数据访问(内存实现)
│       │   ├── models/            # 领域类型
│       │   ├── prompts/           # 模板 + Schema + fallback
│       │   ├── infrastructure/    # Gemini 客户端 / 配置 / logger
│       │   ├── middleware/        # error handler / request id
│       │   └── vite/              # dev 模式 Vite 装配
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                    # 跨端共享
│       └── src/
│           ├── types/             # Book / Chapter / Character / KBEntry ...
│           ├── api/               # 路由路径常量 + 请求/响应 DTO
│           └── constants/         # 风格过滤器枚举等
│
├── docs/
│   └── architecture/
│       └── refactor-design.md     # 你正在读的这个文件
│
├── package.json                   # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### 2.2 分层职责边界(最重要的一张表)

| 层 | 知道什么 | 不知道什么 | 入参 | 出参 |
| --- | --- | --- | --- | --- |
| `routes/` | URL 路径 → Controller | 业务怎么实现 | HTTP Request | Controller 返回值 |
| `controllers/` | 校验参数、转换格式、调 Service、写日志 | prompt 怎么写、怎么调 Gemini | 校验后的 DTO | 标准化 JSON 响应 |
| `services/` | 业务编排、调用 prompt + Gemini、决定 fallback | HTTP 是什么、Express 是什么 | 领域对象 | 领域对象 |
| `repositories/` | 怎么存/取数据 | 业务是什么、为什么这么存 | 领域对象 + id | 领域对象 |
| `prompts/` | prompt 字符串、JSON Schema、fallback 默认值 | 怎么被调用、Gemini 是什么 | 模板变量 | 拼好的 prompt + schema + fallback |
| `infrastructure/` | Gemini 怎么调、环境变量怎么读 | 业务是什么 | 配置 + 原始 prompt | 解析后的 JSON |

**依赖方向(单向,严禁反向):**
```
routes → controllers → services → { repositories, prompts }
                              ↓
                        infrastructure
```

---

## 3. 后端 MVC 详细设计

> 命名说明:经典 MVC 的"Model"在本项目拆成 **Model(类型定义)** + **Repository(数据访问)** + **Service(业务编排)**。Controller 保留 MVC 原义。这是 Node 圈对 MVC 的常见演进。

### 3.1 目录与文件清单

```
apps/server/src/
├── index.ts                          # 启动入口
├── app.ts                            # createApp():构造 Express app
├── config.ts                         # 环境变量解析(带 schema)
├── infrastructure/
│   ├── gemini/
│   │   ├── client.ts                 # 单例 GoogleGenAI
│   │   └── parser.ts                 # parseRobustJson (原逻辑迁入)
│   ├── logger.ts                     # 简易 console wrapper
│   └── env.ts                        # process.env 读取 + 校验
│
├── middleware/
│   ├── error-handler.ts              # 统一异常 → JSON 响应
│   ├── request-id.ts                 # 给每个请求分配 X-Request-Id
│   └── validate.ts                   # zod 入参校验中间件工厂
│
├── models/                           # 领域类型(纯类型/常量,无逻辑)
│   ├── book.ts                       # BookProject / Chapter / Scene
│   ├── character.ts                  # Character
│   ├── knowledge-base.ts             # KBEntry
│   ├── pipeline.ts                   # PipelineStage / StyleFilters
│   └── index.ts                      # barrel export
│
├── prompts/                          # 纯文本模板 + JSON Schema + fallback
│   ├── book-init/
│   │   ├── system.ts                 # system 提示词
│   │   ├── schema.ts                 # responseSchema
│   │   ├── fallback.ts               # 失败时本地默认返回
│   │   └── index.ts                  # export { prompt, schema, fallback }
│   ├── planner/                      # run-pipeline-step 'planning'
│   ├── drafter/                      # run-pipeline-step 'drafting'
│   ├── reviewer/                     # run-pipeline-step 'reviewing'
│   ├── refiner/                      # run-pipeline-step 'reviewing' 第二轮
│   ├── rolling-outline/              # roll-outline
│   ├── lore-extract/                 # suggest-kb-entry
│   └── element-generate/             # generate-element
│
├── repositories/                     # 数据访问(本期内存版)
│   ├── book.repository.ts            # interface BookRepository
│   ├── book.memory.repository.ts     # 内存实现,留好以后接 DB
│   └── index.ts                      # 工厂方法 getBookRepository()
│
├── services/
│   ├── book-init.service.ts          # 初始化一本书
│   ├── pipeline.service.ts           # 多阶段流水线编排
│   ├── outline.service.ts            # 滚动大纲
│   ├── lore.service.ts               # Lore 抽取
│   └── element.service.ts            # 元素生成
│
├── controllers/
│   ├── book.controller.ts            # /api/books/*
│   ├── agent.controller.ts           # /api/agent/*
│   └── health.controller.ts          # /api/health
│
├── routes/
│   ├── index.ts                      # 总装
│   ├── book.routes.ts                # /api/books/*
│   └── agent.routes.ts               # /api/agent/*
│
└── vite/
    ├── dev.ts                        # dev 模式 Vite middleware 装配
    └── prod.ts                       # prod 模式静态资源装配
```

### 3.2 端点 → 三层映射表(从原 5 个端点展开)

| 旧端点 | 新 Route | Controller 方法 | Service 方法 | 涉及 Prompt |
| --- | --- | --- | --- | --- |
| `POST /api/books/generate-init` | `POST /api/books/generate-init` | `bookController.generateInit` | `bookInitService.execute` | `prompts/book-init` |
| `POST /api/agent/run-pipeline-step` | `POST /api/agent/run-pipeline-step` | `agentController.runPipelineStep` | `pipelineService.runStage(stage)` 内部分发 | `prompts/{planner,drafter,reviewer,refiner}` |
| `POST /api/agent/roll-outline` | `POST /api/agent/roll-outline` | `agentController.rollOutline` | `outlineService.roll` | `prompts/rolling-outline` |
| `POST /api/books/suggest-kb-entry` | `POST /api/books/suggest-kb-entry` | `bookController.suggestKbEntry` | `loreService.suggest` | `prompts/lore-extract` |
| `POST /api/books/generate-element` | `POST /api/books/generate-element` | `bookController.generateElement` | `elementService.generate` | `prompts/element-generate` |

### 3.3 一次完整请求的生命周期

以 `POST /api/agent/run-pipeline-step` 为例:

```
HTTP POST /api/agent/run-pipeline-step
   │
   ▼
middleware/request-id        → 给 req 注入 id
   │
   ▼
routes/agent.routes.ts       → router.post('/', validate(schema), agentController.runPipelineStep)
   │
   ▼
controllers/agent.controller.ts
   │ ① zod 校验入参(已通过 validate 中间件完成)
   │ ② 从 req.body 抽 DTO
   │ ③ 调 service
   │ ④ res.json(标准响应)
   ▼
services/pipeline.service.ts
   │ ① 解析 stage 字段
   │ ② 选对应 prompt 模块 → 拼出 prompt + schema
   │ ③ 调 infrastructure/gemini/client.generateContent(...)
   │ ④ 用 infrastructure/gemini/parser 解析
   │ ⑤ 失败 → 走对应 prompt 模块的 fallback
   │ ⑥ 调 repositories 持久化(如需)
   │ ⑦ return 领域对象
   ▼
controllers/agent.controller.ts
   │ 包成 { data, requestId } 响应
   ▼
HTTP 200 OK
```

错误冒泡路径:任何一层 throw → `middleware/error-handler` 兜底 → 统一 JSON 错误。

### 3.4 Controller 的关键模板

```ts
// apps/server/src/controllers/agent.controller.ts(节选)
import type { Request, Response } from 'express';
import { runPipelineStepSchema } from '@arcadia/shared';
import { pipelineService } from '../services/pipeline.service';

export const agentController = {
  async runPipelineStep(req: Request, res: Response) {
    const dto = req.body; // 已由 validate 中间件校验过
    const data = await pipelineService.runStage(dto);
    res.json({ data, requestId: req.id });
  },

  async rollOutline(req: Request, res: Response) {
    const dto = req.body;
    const data = await outlineService.roll(dto);
    res.json({ data, requestId: req.id });
  },
};
```

### 3.5 Service 的关键模板

```ts
// apps/server/src/services/pipeline.service.ts(节选)
import { geminiClient } from '../infrastructure/gemini/client';
import { parseRobustJson } from '../infrastructure/gemini/parser';
import { prompts } from '../prompts';

type Stage = 'planning' | 'drafting' | 'reviewing';

const STAGE_HANDLER: Record<Stage, (dto: any) => Promise<any>> = {
  planning:  runPlannerStage,
  drafting:  runDrafterStage,
  reviewing: runReviewerStage, // 内部分两轮:critique + refine
};

export const pipelineService = {
  async runStage(dto: { stage: Stage; /* ... */ }) {
    const handler = STAGE_HANDLER[dto.stage];
    if (!handler) throw new AppError(400, 'invalid_stage');

    const promptModule = prompts.pipeline[dto.stage];
    try {
      const raw = await geminiClient.generate(promptModule.build(dto));
      return parseRobustJson(raw);
    } catch (err) {
      // 走 fallback(原代码的"本地备用推演引擎"集中在这里)
      if (!promptModule.fallback) throw err;
      return promptModule.fallback(dto);
    }
  },
};
```

### 3.6 Prompt 模块的关键模板

```ts
// apps/server/src/prompts/book-init/index.ts
import { buildSystemPrompt } from './system';
import { responseSchema } from './schema';
import { fallback } from './fallback';

export const bookInitPrompt = {
  build: (input: { title: string; genre: string; brief: string }) => ({
    model: 'gemini-3.5-flash',
    contents: buildSystemPrompt(input),
    config: { responseMimeType: 'application/json', responseSchema },
  }),
  fallback: (input: { title: string }) => fallback(input),
};
```

**好处**: prompt 改文案不需要动 Service,Service 改流程不需要动 prompt,fallback 默认值集中可见,JSON Schema 集中管理。

### 3.7 错误处理与响应规范

**响应信封**(成功):
```json
{ "data": { /* 业务对象 */ }, "requestId": "req_xxx" }
```

**响应信封**(失败):
```json
{ "error": { "code": "invalid_stage", "message": "...", "requestId": "req_xxx" } }
```

**实现**:
- `infrastructure/logger.ts` 输出 `[{time}] {level} {requestId} {message}`
- `middleware/error-handler.ts` 识别 `AppError`(带 status + code),其他归 500
- `AppError` 类定义在 `infrastructure/errors.ts`

### 3.8 配置与环境变量

`config.ts` 用 zod 解析 `process.env`,启动时就失败,而不是跑到一半才报:

```ts
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  GEMINI_API_KEY: z.string().min(1),
  APP_URL: z.string().url().optional(),
});
```

### 3.9 Repository 接口预留(本期不接 DB)

```ts
// apps/server/src/repositories/book.repository.ts
export interface BookRepository {
  get(id: string): Promise<BookProject | null>;
  list(): Promise<BookProject[]>;
  save(book: BookProject): Promise<void>;
  delete(id: string): Promise<void>;
}
```

内存实现用 `Map<string, BookProject>`。Service 只依赖接口,以后换 SQLite/Postgres/Prisma 都不动 Service。

> 本期**不**做:把 `INITIAL_BOOKS` 持久化进 Repository,书架管理仍是前端 + localStorage 主导。后端不接书架,后端只服务"AI 生成能力"。

---

## 4. 前端分层详细设计

### 4.1 目录与文件清单

```
apps/web/src/
├── main.tsx
├── App.tsx                           # 只剩 30~50 行:Router + Layout 装配
├── layouts/
│   ├── AppShell.layout.tsx           # 整体壳:Header + Outlet
│   ├── Workspace.layout.tsx          # 工作区三栏:LeftAside + Main + RightAside
│   └── ModalShell.layout.tsx         # 通用 Modal 容器(可选)
│
├── features/                         # 业务模块(核心)
│   ├── bookshelf/                    # 书架视图(无 activeBook)
│   │   ├── BookshelfPage.tsx
│   │   ├── BookCard.tsx
│   │   ├── BookshelfEmpty.tsx
│   │   ├── useBookSearch.ts
│   │   └── index.ts
│   │
│   ├── workspace/                    # 工作区视图(activeBook)
│   │   ├── WorkspacePage.tsx
│   │   ├── WorkflowProgress.tsx      # 顶部规划→撰写→评审→完成 进度条
│   │   ├── ChapterNavigator.tsx      # 章节下拉切换
│   │   ├── ChapterEditor.tsx         # 标题+剧情线索+分镜+正文
│   │   ├── PipelineController.tsx    # 开始/暂停按钮 + 状态三宫格
│   │   ├── AgentLogTerminal.tsx      # 实时日志
│   │   └── index.ts
│   │
│   ├── book-init/                    # 新建书籍 + AI 初始化
│   │   ├── NewBookDialog.tsx
│   │   ├── InitStreamLogs.tsx
│   │   └── index.ts
│   │
│   ├── soul-base/                    # 左侧"灵魂大本营" Tab
│   │   ├── SoulBasePanel.tsx
│   │   ├── WorldviewSection.tsx
│   │   ├── CharacterSection.tsx
│   │   ├── CharacterCard.tsx
│   │   ├── WritingPromptSection.tsx
│   │   ├── StyleFiltersSection.tsx
│   │   └── index.ts
│   │
│   ├── knowledge-base/               # 左侧"专属知识库" Tab
│   │   ├── KnowledgeBasePanel.tsx
│   │   ├── KbCategoryFilter.tsx
│   │   ├── KbEntryCard.tsx
│   │   ├── KbEntryDialog.tsx         # 新建/编辑
│   │   ├── LoreSuggestionCard.tsx
│   │   └── index.ts
│   │
│   ├── steering/                     # 右侧"导演干预"面板
│   │   ├── SteeringPanel.tsx
│   │   ├── ActiveContextCard.tsx     # 激活的角色技能/世界观规则
│   │   └── index.ts
│   │
│   ├── characters/                   # 角色管理(新增/删除/AI 生技能)
│   │   ├── AddCharacterDialog.tsx
│   │   ├── useAiSkill.ts
│   │   └── index.ts
│   │
│   └── export/                       # 全书精装导出
│       ├── ExportBookDialog.tsx
│       ├── BookCoverMockup.tsx
│       ├── ExportPreviewPage.tsx
│       ├── useExportMarkdown.ts
│       └── index.ts
│
├── components/                       # 通用 UI(无业务含义,可被任意 feature 复用)
│   ├── Button/
│   ├── Dialog/
│   ├── TextField/
│   ├── Select/
│   ├── Checkbox/
│   ├── Tabs/
│   ├── Tag/
│   ├── Card/
│   ├── EmptyState/
│   ├── SparkleIcon/
│   └── index.ts                      # barrel export
│
├── stores/                           # Zustand(按业务域拆分)
│   ├── books.store.ts                # 书籍集合 + 持久化
│   ├── active-book.store.ts          # activeBookId + 派生 activeBook
│   ├── pipeline.store.ts             # currentStage / isRunning / logs
│   ├── kb-dialog.store.ts            # 知识库弹窗状态
│   ├── new-book.store.ts             # 新建弹窗状态
│   ├── export.store.ts
│   ├── character-dialog.store.ts
│   ├── steering.store.ts
│   └── index.ts
│
├── api/                              # 后端调用层(纯函数,不依赖 React)
│   ├── client.ts                     # fetch 封装 + 错误处理
│   ├── book.api.ts                   # generateInit, suggestKbEntry, generateElement
│   ├── agent.api.ts                  # runPipelineStep, rollOutline
│   ├── types.ts                      # 与 @arcadia/shared 对齐
│   └── index.ts
│
├── lib/                              # 前端纯工具
│   ├── classnames.ts                 # cn()
│   ├── debounce.ts
│   └── date.ts
│
├── constants/
│   ├── writing-prompts.ts            # 原 WRITING_PROMPT_PRESETS
│   └── initial-books.ts              # 原 INITIAL_BOOKS(seed,只在 store 启动时用)
│
├── styles/
│   ├── index.css                     # tailwind + 全局
│   └── tokens.css                    # CSS 变量(色板/间距)
│
└── vite-env.d.ts
```

### 4.2 三层职责边界

| 层 | 知道什么 | 不知道什么 | 例子 |
| --- | --- | --- | --- |
| `features/` | 业务规则、状态、API 调用、用户场景 | 其他 feature 的内部细节(只通过 store/api 沟通) | `WorkspacePage` 不知道 `SoulBasePanel` 长啥样 |
| `components/` | 通用 UI、props 契约 | 任何业务、任何 store、任何 API | `<Dialog>` 不知道是"新建书"还是"编辑 KB" |
| `layouts/` | 页面骨架、模块如何摆放 | 具体业务逻辑 | `Workspace.layout` 不知道 pipeline 怎么跑 |

**调用方向**:
```
features/  →  components/  ✓
features/  →  features/    ✗ (必须通过 store 或 api)
components/  →  features/  ✗
layouts/  →  features/    ✓ (作为容器)
```

feature 之间的依赖通过 `stores/` 或 `api/`。**严禁 feature 之间直接 import 内部组件**,只允许 import `index.ts` 暴露的公共面。

### 4.3 App.tsx 重构后的样子(目标)

```tsx
// apps/web/src/App.tsx
import { AppShell } from './layouts/AppShell.layout';
import { BookshelfPage } from './features/bookshelf';
import { WorkspacePage } from './features/workspace';
import { useActiveBookStore } from './stores';

export default function App() {
  const activeBookId = useActiveBookStore(s => s.activeBookId);

  return (
    <AppShell>
      {activeBookId ? <WorkspacePage /> : <BookshelfPage />}
      {/* 全局 Dialog 挂这里,通过 store 触发 */}
      <GlobalDialogs />
    </AppShell>
  );
}
```

### 4.4 状态管理拆分方案(Zustand)

**为什么选 Zustand:**
- 9 个 useState 是因为状态没有组织;Zustand 按域拆分,每个 store 独立订阅
- API 极简(对比 Redux 省 80% 模板)
- 天然支持 selector 精确订阅(避免不必要重渲染)
- TS 友好

**store 拆分原则**:一个 store = 一个业务域,不要做成一个大 store。每个 store 暴露 selector 模式。

**示例** —— `pipeline.store.ts`:

```ts
import { create } from 'zustand';

type Stage = 'idle' | 'planning' | 'drafting' | 'reviewing' | 'review_done';

interface PipelineState {
  currentStage: Stage;
  isRunning: boolean;
  isRollingOutline: boolean;
  logs: PipelineLog[];
  activeHighlights: string[];
  suggestedLore: LoreSuggestion | null;
  isExtractingLore: boolean;

  runNextStage: () => Promise<void>;
  pause: () => void;
  applySteering: (input: string) => void;
  rewriteFromHere: () => void;
  // ... 其他 actions
}
```

**持久化**:`books.store.ts` 用 Zustand `persist` 中间件,自动写 localStorage(替代现在手写的 `useEffect` 同步)。

### 4.5 API 调用层(纯函数)

```ts
// apps/web/src/api/agent.api.ts
import { apiClient } from './client';
import type { PipelineRequest, PipelineResponse } from './types';

export const agentApi = {
  runPipelineStep: (req: PipelineRequest) =>
    apiClient.post<PipelineResponse>('/api/agent/run-pipeline-step', req),

  rollOutline: (req: RollOutlineRequest) =>
    apiClient.post<RollOutlineResponse>('/api/agent/roll-outline', req),
};
```

**好处**: 组件不直接写 fetch 路径,以后改 baseURL/加 auth/加 trace id 只改 `client.ts`。

### 4.6 通用组件库(原子级别)

把现有 JSX 里高频出现的样式/逻辑抽成:
- `<Dialog>` 统一 4 个 Modal 的打开关闭/背景遮罩
- `<TextField>` / `<TextArea>` / `<Select>` 统一输入框样式
- `<Button>` 统一 `wood-button` / 主按钮 / 危险按钮变体
- `<Tabs>` 统一"灵魂大本营/知识库"切换
- `<Tag>` 统一 `role`/`genre` 彩色徽章
- `<EmptyState>` 统一空数据/空搜索结果

> **原则**: 抽离的边界是"这个组件有没有业务词汇"。有业务词汇(如 `BookCard`、`KbEntryCard`)放 features;没有(如 `Button`、`Dialog`)放 components。

### 4.7 路由(本期可选项)

短期不强求 react-router,因为目前只有 2 个视图(activeBookId 二元态),可以在 `App.tsx` 用 if/else 切。
长期(可选):引入 `react-router-dom`,加 `/book/:id` 路由,可分享 URL。

---

## 5. 共享层 `packages/shared`

把后端返回的字段类型、前后端都用到的常量、API 路径都放到共享包,避免 `any` 满天飞。

```ts
// packages/shared/src/types/book.ts
export type BookStatus = 'pending' | 'planning' | 'drafting' | 'reviewing' | 'completed';

export interface Scene { /* ... */ }
export interface Chapter { /* ... */ }
export interface Character { /* ... */ }
export interface KBEntry { /* ... */ }
export interface BookProject { /* ... */ }

// packages/shared/src/api/routes.ts
export const API_ROUTES = {
  book: {
    generateInit: '/api/books/generate-init',
    suggestKbEntry: '/api/books/suggest-kb-entry',
    generateElement: '/api/books/generate-element',
  },
  agent: {
    runPipelineStep: '/api/agent/run-pipeline-step',
    rollOutline: '/api/agent/roll-outline',
  },
} as const;

// packages/shared/src/index.ts
export * from './types';
export * from './api';
export * from './constants';
```

---

## 6. 关键设计原则(写代码时反复对照)

1. **依赖方向单向**: 后端 routes→controllers→services→{repos,prompts}→infra;前端 layouts→features→components;features 互不依赖。
2. **每个文件单一职责**: 一个文件问"我负责什么"答得出,且只答一件事。`pipeline.service.ts` 只管流水线,不管 KB。
3. **类型契约前置**: Controller 入参用 zod 校验,DTO 用 `@arcadia/shared` 类型,严禁 `any`。
4. **Prompt/Schema/Fallback 三件套同目录**: 改一个 prompt 时不会漏改 schema 或 fallback。
5. **错误透传**: Service 抛 `AppError(status, code)`,Controller 不 try/catch,统一走 error-handler middleware。
6. **样式就近**: 业务特有样式放 features 内,通用样式(色板/排版)放 `styles/tokens.css`。
7. **不要过早抽象**: 第一版不做成插件化,不做成可配置。**先把目录结构立起来**,跑通一样,再考虑扩展。
8. **环境变量集中**: 只有 `config.ts` 读 `process.env`,其他文件通过 import config 拿。

---

## 7. 实施路径(分阶段,每阶段可独立验证)

> 阶段之间**不依赖合并主干**:每阶段完成都跑得起来。

### 阶段 0: 准备工作(0.5 天)
- [ ] 切换到 `pnpm` workspace
- [ ] 创建 `apps/web`、`apps/server`、`packages/shared` 三个包
- [ ] 移动现有 `src/` → `apps/web/src/`,`server.ts` → `apps/server/src/`
- [ ] 调整根 `package.json` 为 workspace 根,只放 scripts
- [ ] 验证 `pnpm dev` 仍能跑通原功能

### 阶段 1: 共享层抽出(0.5 天)
- [ ] 把 `BookProject / Chapter / Character / KBEntry / Scene / StyleFilters` 抽到 `packages/shared`
- [ ] 把 `WRITING_PROMPT_PRESETS` 抽到 `packages/shared`
- [ ] 把 `INITIAL_BOOKS` 留前端 `constants/`,作为 seed
- [ ] 前后端各自 package.json 加 `@arcadia/shared` workspace 依赖
- [ ] 验证类型 import 跑通

### 阶段 2: 后端 MVC 拆分(2 天)
- [ ] 建 `config.ts` + `infrastructure/{gemini,logger,env,errors}`
- [ ] 建 `models/` 五个文件
- [ ] 建 `prompts/{book-init,planner,drafter,reviewer,refiner,rolling-outline,lore-extract,element-generate}`,每个目录含 `system.ts + schema.ts + fallback.ts + index.ts`
- [ ] 建 `repositories/`,含接口 + 内存实现 + 工厂
- [ ] 建 `services/` 五个 service
- [ ] 建 `controllers/` 三个 controller
- [ ] 建 `routes/` 两个 routes 文件
- [ ] 建 `middleware/{error-handler, request-id, validate}`
- [ ] 重写 `app.ts` 和 `index.ts`
- [ ] 单独 `apps/server/package.json` 加 dev 脚本(`tsx watch`)
- [ ] dev 模式用 `vite` 中间件(从 `vite/dev.ts` 装配)
- [ ] 用 curl/Postman 5 个端点全跑一遍,确认行为一致
- [ ] 跑 `tsc --noEmit`,0 报错

### 阶段 3: 前端 API 层 + Store 拆分(1 天)
- [ ] 建 `api/{client.ts, book.api.ts, agent.api.ts, types.ts}`
- [ ] 把 `App.tsx` 里所有 `fetch('/api/...')` 替换成 `bookApi.xxx` / `agentApi.xxx`
- [ ] 引入 `zustand`,建 8 个 store
- [ ] 把 `App.tsx` 里的 9 个 useState 逐步迁到对应 store
- [ ] 用 `persist` 中间件接管 localStorage
- [ ] 验证书架仍能加载、初始化仍能跑、流水线仍能跑

### 阶段 4: 前端 Layout/Components/Features 三层抽离(2 天)
- [ ] 抽 `layouts/AppShell` + `Workspace.layout`(左右中三栏壳)
- [ ] 抽 `components/`(Button / Dialog / TextField / Select / Tabs / Tag / Card / EmptyState)
- [ ] 拆 `features/bookshelf`
- [ ] 拆 `features/workspace`
- [ ] 拆 `features/soul-base`
- [ ] 拆 `features/knowledge-base`
- [ ] 拆 `features/steering`
- [ ] 拆 `features/book-init` / `characters` / `export`
- [ ] `App.tsx` 收缩到 < 50 行
- [ ] 跑 `pnpm build` 出包,跑 `pnpm preview` 验证生产可用

### 阶段 5: 收尾(0.5 天)
- [ ] 文档:补 `README.md` 工作区结构说明 + 开发命令
- [ ] 补 `apps/server/README.md`(API 列表、prompt 模块说明)
- [ ] 补 `apps/web/README.md`(目录约定、命名约定)
- [ ] 跑一遍完整流程:建书 → 跑流水线 → 写一章 → 滚动大纲 → 抽取 Lore → 精装导出

**总计:6.5 个工作日**(1 人)。

---

## 8. 关键决策与待你拍板事项

下面这些是**有真实分歧**的决策,我在文档里给了推荐项,但需要你确认:

### 决策 A:workspace 工具选 `pnpm` 还是保留 npm?
- **推荐 pnpm**:workspace 支持更原生,节省磁盘,速度快
- 备选:npm 7+ 也支持 workspace,但体验差一些

### 决策 B:状态管理用 Zustand 还是保留 useState + Context?
- **推荐 Zustand**:9 个 useState 揉一起是当前最大问题之一,Context 性能不够好
- 备选:用 React 19 的 `use()` + Server Components(但本项目后端是独立 Express,不太适合)
- 保守:Jotai(原子化,API 更轻)

### 决策 C:prompt 模板用什么格式?
- **推荐:TypeScript 字符串模板**(现状直接升级,无需引入新依赖)
- 备选:Mustache/Handlebars(适合非技术 PM 改 prompt,但增加依赖)
- 备选:每个 prompt 单独 `.md` 文件 + 运行时读(配置友好,但失去 TS 类型)

### 决策 D:验证库用 zod 还是 yup?
- **推荐 zod**:TS 类型推导一流,生态最广
- 备选:valibot(更轻,但生态小)

### 决策 E:是否引入 react-router?
- **推荐暂不引入**:目前只有 2 个视图,App.tsx 简单 if/else 即可
- 引入的时机:需要 URL 可分享 / 浏览器前进后退时

### 决策 F:前端构建是否拆成 `apps/web`(单页)和 Vite 库模式?
- **推荐保持 Vite SPA**:改动最小
- 备选:把通用 components/ 单独打成内部 npm 包(更彻底,但本项目规模不到)

### 决策 G:`INITIAL_BOOKS` seed 数据如何处理?
- **推荐:继续放前端 constants/**,用 store persist 接管,首次启动加载
- 备选:把 seed 搬到后端,启动时通过 API 加载(更彻底,但后端要加 `GET /api/books/seed`)

### 决策 H:文档语言?
- 当前用**中文**(匹配对话语言)。代码注释和 commit message 推荐用英文,文件名用英文。

---

## 9. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 拆分过程引入 bug,流水线跑不通 | 中 | 高 | 阶段 2/3 完成后做端到端 curl + 浏览器跑一遍;保留原 `server.ts`/`App.tsx` 备份直到阶段 5 结束 |
| workspace 迁移 npm→pnpm 报错 | 低 | 中 | 阶段 0 单独验证,失败就回退 npm |
| Zustand persist 与现有 localStorage key 不兼容 | 低 | 低 | 用 `migrate` 选项做版本迁移,老数据自动转换 |
| prompt 拆分后,某条 prompt 行为与原版细微偏差 | 中 | 高 | 阶段 2 用快照测试/手动对比:同一入参,旧版与新版的 Gemini 返回 JSON 必须字段一致 |
| UI 抽组件过程改样式,视觉走样 | 中 | 中 | 先在原文件抽,纯移动不重构;视觉稳定后再优化 |

**回退策略**:任一阶段如果 1 天内搞不定,把 `git` 回滚到上一阶段 tag,文档里写明原因,继续讨论。

---

## 10. 验收标准(完成定义)

- [ ] `pnpm dev` 一条命令起前后端
- [ ] `pnpm build` 产出可部署的 `dist/` + 后端 `dist/`
- [ ] 5 个 AI 端点全部跑通,行为与重构前一致
- [ ] `App.tsx` < 100 行
- [ ] `server.ts`(原)被拆为 ≥ 20 个文件,每个文件 < 250 行
- [ ] `tsc --noEmit` 在前后端均 0 报错
- [ ] README 更新开发命令和目录约定
- [ ] 完整跑一遍"建书→写一章→滚动大纲→抽 Lore→导出精装"全链路

---

## 附录 A:关键文件骨架示例

完整骨架示例(选 3 个最有代表性的):
- `apps/server/src/services/pipeline.service.ts` ← 业务编排核心
- `apps/server/src/prompts/book-init/index.ts` ← prompt/Schema/Fallback 三件套
- `apps/web/src/stores/pipeline.store.ts` ← 前端状态核心

如需我把完整骨架代码也输出到 `docs/architecture/scaffolds/` 下,告诉我一声。

---

## 附录 B:为什么不用更"现代"的方案?

| 候选方案 | 不选的理由 |
| --- | --- |
| Next.js (App Router) | 重写前端,投入产出比低,本项目是单页应用不是营销站 |
| tRPC | 引入新概念(端到端类型),与 Express 风格不搭,改造成本大 |
| Drizzle / Prisma | 本期不接 DB,提前引入是过度设计 |
| Redux Toolkit | 对当前规模过度,Zustand 足够 |
| React Query | API 层目前是命令式调用,没有缓存/失效需求,引入也是过度设计 |
| 引入数据库 | 本期不需要,Repository 接口已留好,以后加成本极低 |

---

_文档版本 v1.0 · 维护人: Mavis(架构设计)+ 项目 owner(决策确认)_
