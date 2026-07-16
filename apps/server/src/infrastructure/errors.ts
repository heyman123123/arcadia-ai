/**
 * 统一错误类型
 *
 * Service / Controller 抛 AppError,被 error-handler middleware 捕获
 * 并序列化为标准 JSON 错误响应。
 */

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** 400 - 入参缺失/格式错 */
export class ValidationError extends AppError {
  constructor(details?: unknown, message = 'Validation failed') {
    super(400, 'validation_error', message, details);
  }
}

/** 404 - 资源不存在 */
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'not_found', message);
  }
}

/** 502 - 上游(Gemini)失败 */
export class UpstreamError extends AppError {
  constructor(message: string, details?: unknown) {
    super(502, 'upstream_error', message, details);
  }
}

/** 500 - 兜底 */
export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, 'internal_error', message, details);
  }
}
