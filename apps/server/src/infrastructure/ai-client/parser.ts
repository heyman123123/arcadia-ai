/**
 * AI 响应 JSON 解析器
 *
 * AI 返回的 text 字段经常会被它自己包上 ```json ... ``` 围栏,
 * 偶尔也会返回非严格 JSON(内嵌裸双引号、半截JSON、markdown)，做多层清洗兼容。
 */

import { logger } from '../logger';

/**
 * 步骤1：提取第一个完整成对 {} / [] 块，规避正则贪婪截断问题
 */
function extractFullJsonBlock(raw: string): string {
  const firstObj = raw.indexOf('{');
  const firstArr = raw.indexOf('[');
  let startIdx = -1;
  let type: 'obj' | 'arr' = 'obj';

  if (firstObj === -1 && firstArr === -1) return raw;
  if (firstObj === -1) {
    startIdx = firstArr;
    type = 'arr';
  } else if (firstArr === -1) {
    startIdx = firstObj;
  } else {
    startIdx = Math.min(firstObj, firstArr);
    type = firstObj < firstArr ? 'obj' : 'arr';
  }

  let openCount = 0;
  let endIndex = -1;
  for (let i = startIdx; i < raw.length; i++) {
    const c = raw[i];
    if (c === '{' || c === '[') openCount++;
    if ((type === 'obj' && c === '}') || (type === 'arr' && c === ']')) {
      openCount--;
      if (openCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) return raw.slice(startIdx);
  return raw.slice(startIdx, endIndex + 1);
}

/**
 * 步骤2：清洗字符串内部未转义的裸双引号 " → \"
 */
function sanitizeInnerQuotes(jsonStr: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (const char of jsonStr) {
    if (isEscaped) {
      result += char;
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      if (!inString) {
        // 外层键/字符串起始引号，直接保留
        result += char;
        inString = true;
      } else {
        // 判断是否是真正的字符串闭合（下一位是 , : } ] 空格换行）
        const next = jsonStr[result.length + 1] ?? '';
        const isRealClose = [',', ':', '}', ']', ' ', '\n', '\r'].includes(next);
        if (isRealClose) {
          result += char;
          inString = false;
        } else {
          // 字符串内部裸引号，自动转义
          result += '\\"';
        }
      }
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * 步骤3：兜底补全缺失的 } / ]
 */
function fixUnclosedBrackets(jsonStr: string): string {
  let brace = 0, bracket = 0;
  for (const c of jsonStr) {
    if (c === '{') brace++;
    if (c === '}') brace--;
    if (c === '[') bracket++;
    if (c === ']') bracket--;
  }
  let fixed = jsonStr;
  fixed += '}'.repeat(Math.max(0, brace));
  fixed += ']'.repeat(Math.max(0, bracket));
  return fixed;
}

export function parseRobustJson<T = unknown>(text: string | undefined | null): T {
  if (!text) return {} as T;

  let cleaned = text.trim();

  // 1. 移除 markdown ```json 围栏
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  // 第一层原生尝试
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    logger.warn('JSON parse failed, attempting regex extraction', {});
  }

  // 2. 提取完整 JSON 块（解决简单正则半截截取）
  const jsonBlock = extractFullJsonBlock(cleaned);
  if (!jsonBlock) throw new Error('No JSON block found in AI output');

  // 3. 清洗内嵌裸双引号
  let sanitized = sanitizeInnerQuotes(jsonBlock);
  // 4. 补全残缺括号兜底
  sanitized = fixUnclosedBrackets(sanitized);

  // 二次解析
  try {
    return JSON.parse(sanitized) as T;
  } catch (innerErr) {
    const snippet = sanitized.slice(0, 300);
    throw new Error(
      `JSON parsing failed: ${(innerErr as Error).message}. Extracted: ${snippet}…`,
    );
  }
}
