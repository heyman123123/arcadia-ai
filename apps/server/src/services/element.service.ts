/**
 * Element Service
 *
 * 生成元素:角色技能 / 世界观规则 / 魔法咒语 等。
 */

import type { GenerateElementRequest, GenerateElementResponse } from '@arcadia/shared';
import { runElementGeneratePrompt } from '../prompts/element-generate';
import { logger } from '../infrastructure/logger';

export const elementService = {
  async generate(
    input: GenerateElementRequest,
    requestId?: string,
  ): Promise<GenerateElementResponse> {
    logger.info(`[Element] generating type=${input.type}`, { title: input.title }, requestId);
    return runElementGeneratePrompt(input, requestId);
  },
};
