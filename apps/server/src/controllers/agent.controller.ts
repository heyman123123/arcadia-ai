/**
 * Agent Controller
 *
 * 处理 /api/agent/* 端点
 */

import type { Request, Response } from 'express';
import { pipelineService } from '../services/pipeline.service';
import { outlineService } from '../services/outline.service';
import { sendOk } from '../lib/response';

export const agentController = {
  async runPipelineStep(req: Request, res: Response) {
    const data = await pipelineService.runStage(req.validated as never, req.id);
    sendOk(res, data);
  },

  async rollOutline(req: Request, res: Response) {
    const data = await outlineService.roll(req.validated as never, req.id);
    sendOk(res, data);
  },
};
