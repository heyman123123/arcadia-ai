/**
 * 环境变量读取 + 校验
 *
 * 启动时把所有 env var 集中读一次,后续代码从 env 拿。
 * 缺关键变量时直接 throw(由 index.ts 顶层捕获,打印清晰错误)。
 *
 * 开发期缺 GEMINI_API_KEY:用 'dev-placeholder' 启动,服务会起,
 * 但所有 Gemini 调用会失败 → 走 prompt 模块的 fallback(这是设计好的)。
 * 这样前端可以无 key 测试 UI 流程。
 */

import { z } from 'zod';
import { config as loadDotenv } from 'dotenv';

// 加载 .env(开发期在根目录的 .env;生产由部署平台注入)
loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().optional(),
  // Vite dev server 配置
  VITE_PORT: z.coerce.number().int().positive().default(5173),

  // === 存储后端 ===
  STORAGE: z.enum(['sqlite', 'memory']).default('sqlite'),

  // === AI Provider(OpenAI 兼容协议) ===
  // 留空 = 不启用
  AI_PROVIDER: z.enum(['openai', 'minimax', 'auto']).default('auto'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  MINIMAX_API_KEY: z.string().default(''),
  MINIMAX_BASE_URL: z.string().default('https://api.minimaxi.com/v1'),
  MINIMAX_MODEL: z.string().default('MiniMax-M2'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // 用 console.error 而不是 logger,因为 logger 还没初始化
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// 启动时友好提示:开发模式 + 占位 key → 后端能起但 AI 调用都会失败
if (!env.OPENAI_API_KEY && !env.MINIMAX_API_KEY && env.NODE_ENV === 'development') {
  console.warn(
    '⚠️  Neither OPENAI_API_KEY nor MINIMAX_API_KEY is set. All AI calls will fail. Set one in .env to enable AI features.',
  );
}

export type Env = typeof env;
