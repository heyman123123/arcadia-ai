/**
 * 简易 logger
 *
 * 格式: `[ISO 时间] LEVEL [requestId] message + 字段`
 * 比裸 console.log 多一个 requestId 字段,方便在日志里串请求。
 */

type Level = 'info' | 'warn' | 'error' | 'debug';

const LEVEL_COLOR: Record<Level, string> = {
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  debug: '\x1b[90m',  // gray
};
const RESET = '\x1b[0m';

function format(level: Level, requestId: string | undefined, message: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const tag = requestId ? `[${requestId}]` : '';
  const metaStr = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${ts} ${LEVEL_COLOR[level]}${level.toUpperCase().padEnd(5)}${RESET} ${tag} ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>, requestId?: string) {
    console.log(format('info', requestId, message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>, requestId?: string) {
    console.warn(format('warn', requestId, message, meta));
  },
  error(message: string, meta?: Record<string, unknown>, requestId?: string) {
    console.error(format('error', requestId, message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>, requestId?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(format('debug', requestId, message, meta));
    }
  },
};
