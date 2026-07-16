/**
 * Health Controller
 *
 * 简单的存活检查端点 + 持久化/AI 状态探测
 */

import type { Request, Response } from 'express';
import { getBookRepository } from '../repositories';
import { aiManager } from '../infrastructure/ai-client';
import { STORAGE_BACKEND, SQLITE_PATH } from '../config';

export const healthController = {
  async ping(_req: Request, res: Response) {
    // 验证 sqlite 通路
    let dbStatus: { backend: string; path: string; count: number; error?: string } = {
      backend: STORAGE_BACKEND,
      path: STORAGE_BACKEND === 'sqlite' ? SQLITE_PATH : '(in-memory)',
      count: 0,
    };
    try {
      const repo = getBookRepository();
      const list = await repo.list();
      dbStatus.count = list.length;
    } catch (e) {
      dbStatus.error = (e as Error).message;
    }

    res.json({
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        db: dbStatus,
        ai: {
          providers: aiManager.listProviders(),
        },
      },
      requestId: _req.id,
    });
  },
};
