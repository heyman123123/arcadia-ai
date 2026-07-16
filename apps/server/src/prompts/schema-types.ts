/**
 * JSON Schema 类型(本地版,替代之前从 @google/genai 引入的 Schema)
 *
 * 实际上就是 JSON Schema 7 草案 + Gemini 扩展,这里只声明我们用到的子集。
 * 真实传给 AI 时,会被序列化成 JSON 注入 system message,让模型按此结构输出。
 */

export type SchemaType =
  | 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean';

export interface SchemaProperty {
  type: SchemaType;
  description?: string;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export interface Schema {
  type: SchemaType;
  description?: string;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  required?: string[];
  enum?: string[];
}

/**
 * 替代 @google/genai 的 Type 枚举,这里用字符串联合即可。
 * 老代码里 `Type.OBJECT` 改成字符串字面量 'object' 即可。
 */
export const Type = {
  OBJECT: 'object' as const,
  ARRAY: 'array' as const,
  STRING: 'string' as const,
  INTEGER: 'integer' as const,
  NUMBER: 'number' as const,
  BOOLEAN: 'boolean' as const,
};
