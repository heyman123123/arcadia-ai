/**
 * 多智能体流水线 相关类型
 *
 * - PipelineStage:前端 UI 上的"当前阶段"状态机
 * - ChapterStatus:章节字段,见 types/book.ts
 * - StyleFilters:文风精修层开关(去 AI 味 / Show Don't Tell 等)
 * - PipelineLog:实时日志条目
 */

/**
 * 前端 UI 上追踪的"当前流水线阶段"
 *
 * 与 ChapterStatus 的区别:
 *   - ChapterStatus 是持久化在章节里的状态
 *   - PipelineStage 是前端运行时状态机,带 'idle' 和 'review_done' 两个暂态
 */
export type PipelineStage =
  | 'idle'         // 尚未开始本章
  | 'planning'     // 规划智子运行中
  | 'drafting'     // 撰写智子运行中
  | 'reviewing'    // 审校智子运行中
  | 'review_done'; // 审校完毕,本章已完成

/** 单条流水线日志类型 */
export type LogType = 'info' | 'warn' | 'success' | 'critique';

/** 单条流水线日志 */
export interface PipelineLog {
  agent: string;
  text: string;
  type: LogType;
}

/** 文风精修层开关(去 AI 味 & 文风约束) */
export interface StyleFilters {
  noCliches: boolean;     // 屏蔽高频 AI 俗套词
  showDontTell: boolean;  // Show, Don't Tell(白描细节)
  slowPacing: boolean;    // 林间治愈留白(慢节奏渲染)
  keepMystery: boolean;   // 摒弃市面网文低俗套路
}

/** 默认开启全部文风精修层(对标原 App.tsx 默认值) */
export const DEFAULT_STYLE_FILTERS: StyleFilters = {
  noCliches: true,
  showDontTell: true,
  slowPacing: true,
  keepMystery: false,
};
