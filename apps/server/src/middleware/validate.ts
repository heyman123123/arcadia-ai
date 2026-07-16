/**
 * Zod 入参校验 middleware 工厂
 *
 * 用法:
 *   router.post('/foo', validate(myZodSchema), controller.handler);
 *
 * 校验失败抛 ValidationError(被 error-handler 转 400)。
 * 校验成功把解析后的值挂在 req.validated 上,controller 直接用。
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { ValidationError } from '../infrastructure/errors';

declare global {
  namespace Express {
    interface Request {
      validated?: unknown;
    }
  }
}

export function validate<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.flatten()));
    }
    req.validated = result.data as z.infer<S>;
    next();
  };
}
