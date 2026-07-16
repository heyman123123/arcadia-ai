/**
 * Book Controller
 *
 * 处理 /api/books/* 端点
 */

import type { Request, Response } from 'express';
import { bookInitService } from '../services/book-init.service';
import { loreService } from '../services/lore.service';
import { elementService } from '../services/element.service';
import { sendOk } from '../lib/response';

export const bookController = {
  async generateInit(req: Request, res: Response) {
    const data = await bookInitService.execute(req.validated as never, req.id);
    sendOk(res, data);
  },

  async suggestKbEntry(req: Request, res: Response) {
    const data = await loreService.suggest(req.validated as never, req.id);
    sendOk(res, data);
  },

  async generateElement(req: Request, res: Response) {
    const data = await elementService.generate(req.validated as never, req.id);
    sendOk(res, data);
  },
};
