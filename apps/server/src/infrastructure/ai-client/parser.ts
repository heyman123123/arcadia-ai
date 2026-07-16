/**
 * AI 响应 JSON 解析器
 *
 * AI 返回的 text 字段经常会被它自己包上 ```json ... ``` 围栏,
 * 偶尔也会返回非严格 JSON(单引号、注释等),需要一个稳健的解析函数。
 */

import { logger } from '../logger';

export function parseRobustJson<T = unknown>(text: string | undefined | null): T {
  if (!text) return {} as T;

  let cleaned = text.trim();

  // 去掉 markdown 围栏
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    logger.warn('JSON parse failed, attempting regex extraction', {
      error: (error as Error).message,
    });
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch (innerError) {
        throw new Error(
          `JSON parsing failed: ${(innerError as Error).message}. Extracted: ${match[1].slice(0, 200)}…`,
        );
      }
    }
    throw error;
  }
}
