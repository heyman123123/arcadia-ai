/**
 * /api/agent/* API 客户端
 */

import { API_ROUTES } from '@arcadia/shared';
import type {
  PipelineStepRequest,
  PipelineStepResponse,
  RollOutlineRequest,
  RollOutlineResponse,
} from '@arcadia/shared';
import { request } from './client';

export const agentApi = {
  runPipelineStep: (req: PipelineStepRequest) =>
    request<PipelineStepResponse>(API_ROUTES.agent.runPipelineStep, { body: req }),

  rollOutline: (req: RollOutlineRequest) =>
    request<RollOutlineResponse>(API_ROUTES.agent.rollOutline, { body: req }),
};
