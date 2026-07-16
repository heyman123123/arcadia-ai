/**
 * /api/agent/* 路由
 */

import { Router } from 'express';
import { validate } from '../middleware/validate';
import { agentController } from '../controllers/agent.controller';
import { pipelineStepSchema, rollOutlineSchema } from '../schemas';

export const agentRouter = Router();

agentRouter.post('/run-pipeline-step', validate(pipelineStepSchema), agentController.runPipelineStep);
agentRouter.post('/roll-outline', validate(rollOutlineSchema), agentController.rollOutline);
