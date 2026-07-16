/**
 * AI Manager - 多 Provider 管理 + 降级
 *
 * 行为:
 *   1. 根据 env 构造 providers 列表(已配置的才启用)
 *   2. AI_PROVIDER=auto:按"minimax → openai"顺序选第一个
 *   3. AI_PROVIDER=openai/minimax:强制指定
 *   4. generate 时按顺序尝试,失败自动降级下一个 provider
 *   5. 全部失败抛最后那个错误
 */

import type { ProviderClient, ProviderConfig, ProviderName, GenerateOptions } from './types';
import { OpenAICompatibleClient } from './openai-compatible';
import { env } from '../env';
import { logger } from '../logger';

class AIManager {
  private providers: ProviderClient[] = [];

  /** 懒加载:首次访问时构造 */
  private getProviders(): ProviderClient[] {
    if (this.providers.length > 0) return this.providers;
    const candidates: ProviderConfig[] = [];

    // OpenAI
    if (env.OPENAI_API_KEY) {
      candidates.push({
        name: 'openai',
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL,
        model: env.OPENAI_MODEL,
      });
    }
    // MiniMax
    if (env.MINIMAX_API_KEY) {
      candidates.push({
        name: 'minimax',
        apiKey: env.MINIMAX_API_KEY,
        baseUrl: env.MINIMAX_BASE_URL,
        model: env.MINIMAX_MODEL,
      });
    }

    // 排序
    const order: ProviderName[] =
      env.AI_PROVIDER === 'openai' ? ['openai', 'minimax']
      : env.AI_PROVIDER === 'minimax' ? ['minimax', 'openai']
      : ['minimax', 'openai']; // auto

    candidates.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

    this.providers = candidates.map((c) => new OpenAICompatibleClient(c));
    if (this.providers.length === 0) {
      logger.warn('[AIManager] no AI provider configured (set OPENAI_API_KEY or MINIMAX_API_KEY)');
    } else {
      logger.info(
        `[AIManager] providers active: ${this.providers.map((p) => `${p.name}(${p.model})`).join(', ')}`,
      );
    }
    return this.providers;
  }

  async generate<T = unknown>(opts: GenerateOptions): Promise<T> {
    const providers = this.getProviders();
    if (providers.length === 0) {
      throw new Error(
        'No AI provider configured. Set OPENAI_API_KEY or MINIMAX_API_KEY in .env',
      );
    }

    let lastErr: unknown = null;
    for (const provider of providers) {
      try {
        return await provider.generate<T>(opts);
      } catch (err) {
        logger.warn(
          `[AIManager] ${provider.name} failed, trying next provider`,
          { error: (err as Error).message, agent: opts.agent },
          opts.requestId,
        );
        lastErr = err;
      }
    }
    // 全部失败
    throw lastErr instanceof Error ? lastErr : new Error('All AI providers failed');
  }

  /** 测试/调试:列出已配置 providers */
  listProviders(): Array<{ name: ProviderName; model: string }> {
    return this.getProviders().map((p) => ({ name: p.name, model: p.model }));
  }
}

export const aiManager = new AIManager();
