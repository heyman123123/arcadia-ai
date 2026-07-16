/**
 * Prompt 加载器与执行器
 *
 * 设计目标:
 *   - prompt 文本放 .md 文件(非技术 PM 也能改)
 *   - JSON Schema 放 .ts(强类型 + 复用 Type 枚举)
 *   - 每个 prompts/{name}/index.ts 调用 runPrompt() 统一调度
 *
 * 行为:调 AI 失败会直接 throw,由 Service / Controller 决定如何处理。
 *       本版本不提供 fallback(项目要求无 mock)。
 *
 * AI 客户端:多 provider 管理,详见 ../infrastructure/ai-client/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Schema } from './schema-types';
import { aiManager } from '../infrastructure/ai-client';
import { logger } from '../infrastructure/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 读 system.md 并做 {{var}} 占位符替换 */
export function loadSystemPrompt(dir: string, vars: Record<string, string>): string {
  const mdPath = path.resolve(__dirname, dir, 'system.md');
  const raw = fs.readFileSync(mdPath, 'utf-8');
  return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`Prompt ${dir} is missing variable: ${key}`);
    }
    return vars[key];
  });
}

export interface PromptModule<TInput extends object, TOutput> {
  /** 模块名(用于日志) */
  name: string;
  /** 把入参转成"提示词变量"对象 */
  buildVars: (input: TInput) => Record<string, string>;
  /** 响应 JSON Schema(注入到 system message 让模型输出匹配 JSON) */
  schema: Schema;
}

/**
 * 执行一个 prompt 模块:
 *   1. buildVars 渲染 system.md
 *   2. 调 aiManager.generate()(内部按 provider 顺序 + 失败降级)
 *   3. 失败 → 直接 throw(由上层处理)
 */
export async function runPrompt<TInput extends object, TOutput>(
  dir: string,
  module: PromptModule<TInput, TOutput>,
  input: TInput,
  requestId?: string,
): Promise<TOutput> {
  const vars = module.buildVars(input);
  const prompt = loadSystemPrompt(dir, vars);
  const result = await aiManager.generate<TOutput>({
    agent: module.name,
    prompt,
    schema: module.schema,
    requestId,
  });
  return result;
}
