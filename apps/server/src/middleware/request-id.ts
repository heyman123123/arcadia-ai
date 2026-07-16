/**
 * Request ID middleware
 *
 * 给每个请求分配一个 ID,挂在 req.id 上,
 * 后续 logger 输出会自动带上,方便串接日志。
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // 优先用上游(网关/CDN)传过来的 X-Request-Id,便于分布式追踪
  const incoming = req.header('x-request-id');
  req.id = incoming && incoming.length < 100 ? incoming : `req_${randomUUID().slice(0, 8)}`;
  res.setHeader('X-Request-Id', req.id);
  next();
}
