/**
 * 角色 / 人设 领域类型
 */

/** 角色定位(主角 / 配角 / 反派 等) */
export type CharacterRole = '主角' | '重要配角' | '反派' | '背景人物' | string;

/** 单个角色(也称"人设大本营条目") */
export interface Character {
  name: string;
  /** 角色定位标签,如 "女主角 / 光之祭司" */
  role: string;
  /** 外貌、身世、性格、执念 等 */
  description: string;
  /** 专属技能 / 战斗招式 / 魔法(字符串数组) */
  skills: string[];
}
