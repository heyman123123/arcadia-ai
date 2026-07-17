/**
 * Express App 工厂
 *
 * createApp() 返回装配好 middleware/routes/error handler 的 Express 实例,
 * 不监听端口(便于测试和嵌入到不同入口)。
 *
 * dev 模式额外调 attachViteDev(prod 调 attachStaticProd)。
 */

import express from 'express';
import type { Express } from 'express';
import { requestIdMiddleware } from './middleware/request-id';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './routes';
import { isProd } from './config';
import { attachViteDev } from './vite/dev';
import { attachStaticProd } from './vite/prod';
import { getBookRepository } from './repositories';

export async function createApp(): Promise<Express> {
  const app = express();

  // 启动期就初始化 repository:跑 migrations、打开 DB 连接
  // 这样 schema 错误在启动期就抛,而不是等到第一个用户请求才挂
  // 内存后端不会有副作用,直接走 default 路径
  getBookRepository();

  // 基础 middleware
  app.use(express.json({ limit: '5mb' })); // 富文本可能较大
  app.use(requestIdMiddleware);

  // API 路由
  app.use('/api', apiRouter);

  // 前端装配
  if (isProd) {
    attachStaticProd(app);
  } else {
    await attachViteDev(app);
  }

  // 错误处理(必须放最后)
  app.use('/api', notFoundHandler); // /api/* 404 走 JSON
  app.use(errorHandler);

  return app;
}
