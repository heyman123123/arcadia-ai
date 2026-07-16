/**
 * Server 全局配置
 *
 * env 是从 process.env 解析出来的(见 infrastructure/env.ts),
 * 这里再组合一些由 env 派生的常量(路径、URL 等)。
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './infrastructure/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 是否生产模式 */
export const isProd = env.NODE_ENV === 'production';

/** HTTP 端口 */
export const PORT = env.PORT;

/** Web 前端包根目录(apps/web) */
export const WEB_ROOT = path.resolve(__dirname, '../../../apps/web');

/** Web 静态产物目录(apps/web/dist,仅 prod 模式用) */
export const WEB_DIST = path.resolve(WEB_ROOT, 'dist');

/** Prompts 根目录(apps/server/src/prompts) */
export const PROMPTS_DIR = path.resolve(__dirname, 'prompts');

/** SQLite 数据库文件路径(apps/server/data/arcadia.db) */
export const SQLITE_PATH = path.resolve(__dirname, '../data/arcadia.db');

/** 存储后端选择:'sqlite' | 'memory' */
export const STORAGE_BACKEND: 'sqlite' | 'memory' =
  (env.STORAGE as 'sqlite' | 'memory') ?? 'sqlite';

/** CORS 允许的源(开发期是 vite 端口) */
export const CORS_ORIGINS = [
  `http://localhost:${env.VITE_PORT}`,
  `http://127.0.0.1:${env.VITE_PORT}`,
  env.APP_URL,
].filter((x): x is string => Boolean(x));
