/**
 * Server 入口
 *
 * 启动流程:
 *   1. env 加载(已在 import 时执行,失败会 process.exit)
 *   2. createApp() 构造 Express
 *   3. listen PORT
 *   4. 注册优雅关闭(SIGTERM/SIGINT)
 */

import { createApp } from './app';
import { PORT, isProd } from './config';
import { logger } from './infrastructure/logger';

async function main() {
  const app = await createApp();

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[Server] Arcadia AI server running at http://localhost:${PORT}`, {
      mode: isProd ? 'production' : 'development',
    });
  });

  // 优雅关闭
  const shutdown = (signal: string) => {
    logger.info(`[Server] received ${signal}, shutting down gracefully`);
    server.close((err) => {
      if (err) {
        logger.error('[Server] error during shutdown', { error: err.message });
        process.exit(1);
      }
      process.exit(0);
    });
    // 兜底:10 秒强制退出
    setTimeout(() => {
      logger.error('[Server] forced exit after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('[Server] fatal startup error', { error: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
