/**
 * AI Provider 配置
 */

export type ProviderName = 'openai' | 'minimax';

export interface ProviderConfig {
  name: ProviderName;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface GenerateOptions {
  /** 业务名(用于日志) */
  agent: string;
  /** 完整提示词(已替换占位符) */
  prompt: string;
  /** Gemini-style response schema;我们转成 instructions 注入 prompt,不走 response_format(部分兼容服务不支持) */
  schema?: unknown;
  requestId?: string;
}

export interface ProviderClient {
  name: ProviderName;
  model: string;
  generate<T = unknown>(opts: GenerateOptions): Promise<T>;
}
