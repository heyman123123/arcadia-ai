/**
 * 统一响应辅助函数
 *
 * 所有成功响应都包成 { data, requestId } 信封。
 * 错误响应统一在 error-handler middleware 里包。
 */

import type { Response } from 'express';

export function sendOk<T>(res: Response, data: T, requestId?: string) {
  res.json({ data, requestId: res.req.id ?? requestId });
}
