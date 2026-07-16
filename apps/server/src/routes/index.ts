/**
 * 总装:把所有 routes 挂到 Express app
 */

import { Router } from 'express';
import { bookRouter } from './book.routes';
import { agentRouter } from './agent.routes';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/books', bookRouter);
apiRouter.use('/agent', agentRouter);
