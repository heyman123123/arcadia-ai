/**
 * 全局错误处理 middleware
 *
 * - 识别 AppError → 用其 status/code 响应
 * - 其他 Error → 500
 * - Promise rejection(throw 在 async route 里)也走这里
 *   (依赖 express 5 或手动 wrap;这里我们用 express 5 的特性)
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, InternalError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.id;
  const error = err instanceof AppError ? err : new InternalError(
    err instanceof Error ? err.message : 'Unknown error',
    err instanceof Error ? { stack: err.stack } : undefined,
  );

  // 记录错误(4xx warn,5xx error)
  if (error.status >= 500) {
    logger.error(`[${error.code}] ${error.message}`, { details: error.details }, requestId);
  } else {
    logger.warn(`[${error.code}] ${error.message}`, { details: error.details }, requestId);
  }

  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      requestId,
    },
  });
}

/** 404 fallback(放在所有 routes 之后) */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      requestId: req.id,
    },
  });
}
