/**
 * Dev 模式 Vite 装配
 *
 * 把 Vite 作为 Express 的 middleware 跑(不监听端口),
 * 处理 HMR + 静态资源 + 前端 SPA fallback。
 */

import { createServer as createViteServer } from 'vite';
import type { Express, Request, Response, NextFunction } from 'express';
import { WEB_ROOT } from '../config';

export async function attachViteDev(app: Express): Promise<void> {
  const vite = await createViteServer({
    root: WEB_ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  // SPA fallback:非 /api 的 GET 请求返回 index.html(让 Vite 注入 HMR + 解析 main.tsx)
  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    // API 路由不走这里
    if (req.originalUrl.startsWith('/api/')) return next();

    const url = req.originalUrl;
    try {
      const template = await vite.transformIndexHtml(
        url,
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arcadia AI - Collaborative Novel Workspace</title>
  </head>
  <body class="bg-[#FDFBF7]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      );
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
