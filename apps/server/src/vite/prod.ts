/**
 * Prod 模式静态资源装配
 *
 * 把 apps/web/dist 作为 Express 静态目录,
 * SPA 路由 fallback 到 dist/index.html。
 */

import path from 'path';
import express from 'express';
import type { Express, Request, Response } from 'express';
import { WEB_DIST } from '../config';

export function attachStaticProd(app: Express): void {
  app.use(express.static(WEB_DIST));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(WEB_DIST, 'index.html'));
  });
}
