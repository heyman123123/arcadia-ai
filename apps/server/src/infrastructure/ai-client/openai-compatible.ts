/**
 * OpenAI 兼容 Provider(同时支持 OpenAI 官方和 MiniMax)
 *
 * 两者都用 OpenAI Node SDK,差异仅 baseURL / model / apiKey。
 * 这里把"生成 JSON"用 system message 强制 + 在 prompt 里附带 schema 描述,而不是用
 * response_format(因为 MiniMax 等部分兼容服务不保证支持 response_format: json_object)。
 */

import OpenAI from 'openai';
import type { ProviderClient, GenerateOptions, ProviderConfig } from './types';
import { parseRobustJson } from './parser';
import { logger } from '../logger';

export class OpenAICompatibleClient implements ProviderClient {
  public readonly name: ProviderConfig['name'];
  public readonly model: string;
  private client: OpenAI;
  private label: string;

  constructor(cfg: ProviderConfig, label?: string) {
    this.name = cfg.name;
    this.model = cfg.model;
    this.label = label ?? cfg.name;
    this.client = new OpenAI({
      apiKey: cfg.apiKey,
      baseURL: cfg.baseUrl,
    });
    logger.info(`[AI:${this.label}] client init`, { baseURL: cfg.baseUrl, model: cfg.model });
  }

  async generate<T = unknown>(opts: GenerateOptions): Promise<T> {
    logger.info(`[AI:${this.label}:${opts.agent}] generating`, { model: this.model, promptLength: opts.prompt.length }, opts.requestId);

    // 把 schema 简要描述注入 system,模型按 JSON 输出
    const systemHint = opts.schema
      ? `You must output a single JSON object that matches this JSON Schema: ${JSON.stringify(opts.schema)}. Output ONLY the JSON, no prose, no markdown fences.`
      : 'Output ONLY the JSON, no prose, no markdown fences.';

    let response;
    try {
      response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemHint },
            { role: 'user', content: opts.prompt },
          ],
          temperature: 0.7,
        }
      );
    } catch (err: any) {
      // 标准化错误信息
      const status = err?.status ?? err?.response?.status ?? 'unknown';
      const message = err?.message ?? 'AI request failed';
      console.log(response,"message>>>")
      throw new Error(`[AI:${this.label}] HTTP ${status} ${message}`);
    }

    const text = response.choices?.[0]?.message?.content ?? '';
    return parseRobustJson<T>(text);
  }
}
