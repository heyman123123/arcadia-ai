/**
 * 通用 fetch 封装
 *
 * 行为约定:
 *   1. POST JSON,带 Content-Type
 *   2. 解包后端 { data, requestId } 信封
 *   3. 4xx/5xx 抛 ApiError,error.code/message 来自后端 error 信封
 *   4. 网络错误抛 ApiError('network_error')
 *   5. 所有路径请求本地后端 http://localhost:3000
 */

import { API_ROUTES, type ApiError as ApiErrorBody, type ApiSuccess } from '@arcadia/shared';

const BASE_URL = 'http://localhost:3002';

// 重新声明类型(shared 里没有 details 字段,本地扩展)
type ErrorBody = ApiErrorBody['error'] & { details?: unknown };

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, requestId?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: opts.method ?? 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  if (opts.signal) init.signal = opts.signal;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, init);
  } catch (e) {
    throw new ApiError(0, 'network_error', (e as Error).message || 'Network request failed');
  }

  // 204 / 空 body
  if (res.status === 204) return undefined as T;

  // 尝试 parse JSON
  let body: ApiSuccess<T> | ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    // 非 JSON 响应
    if (!res.ok) {
      throw new ApiError(res.status, 'invalid_response', `HTTP ${res.status}`);
    }
    return undefined as T;
  }

  if (!res.ok) {
    const err = body && 'error' in body ? (body.error as ErrorBody) : null;
    throw new ApiError(
      res.status,
      err?.code || 'http_error',
      err?.message || `HTTP ${res.status}`,
      err?.requestId,
      err?.details,
    );
  }

  // 成功:解包 { data, requestId }
  if (body && 'data' in body) return body.data as T;
  // 兜底:直接返回 body
  return body as T;
}

/** 拿到当前请求的 requestId(给后端日志对应用) */
export async function getLastRequestId(): Promise<string | undefined> {
  return undefined; // 简单版:不解 requestId 出来,需要时可改 client 返回 ApiSuccess<T>
}

export { API_ROUTES, request };
export type { RequestOptions };
