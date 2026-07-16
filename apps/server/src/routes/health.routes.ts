/**
 * /api/health 路由(独立文件,方便探针/k8s 用)
 */

import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/', healthController.ping);
