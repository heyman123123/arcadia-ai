/**
 * pipelineStore - 多智能体流水线运行时状态
 *
 * 关键点:
 *   - 切书/切章节时要重置(从 setActiveBook 触发)
 *   - 不持久化(运行态)
 */

import { create } from 'zustand';
import type { LoreSuggestion, PipelineLog, PipelineStage } from '@arcadia/shared';

interface PipelineState {
  currentStage: PipelineStage;
  isRunning: boolean;
  isRollingOutline: boolean;
  logs: PipelineLog[];
  activeHighlights: string[];

  // Lore 抽取(审校阶段完成后触发)
  suggestedLore: LoreSuggestion | null;
  isExtractingLore: boolean;

  // --- actions ---
  setStage: (s: PipelineStage) => void;
  setRunning: (r: boolean) => void;
  setRollingOutline: (r: boolean) => void;
  appendLog: (agent: string, text: string, type?: PipelineLog['type']) => void;
  clearLogs: () => void;
  setActiveHighlights: (h: string[]) => void;

  setSuggestedLore: (l: LoreSuggestion | null) => void;
  setExtractingLore: (e: boolean) => void;

  /** 切书/重置时调用 */
  resetForNewChapter: () => void;
}

const INITIAL: Pick<PipelineState, 'currentStage' | 'isRunning' | 'isRollingOutline' | 'logs' | 'activeHighlights' | 'suggestedLore' | 'isExtractingLore'> = {
  currentStage: 'idle',
  isRunning: false,
  isRollingOutline: false,
  logs: [],
  activeHighlights: [],
  suggestedLore: null,
  isExtractingLore: false,
};

export const usePipelineStore = create<PipelineState>((set) => ({
  ...INITIAL,

  setStage: (s) => set({ currentStage: s }),
  setRunning: (r) => set({ isRunning: r }),
  setRollingOutline: (r) => set({ isRollingOutline: r }),
  appendLog: (agent, text, type = 'info') =>
    set((s) => ({ logs: [...s.logs, { agent, text, type }] })),
  clearLogs: () => set({ logs: [] }),
  setActiveHighlights: (h) => set({ activeHighlights: h }),

  setSuggestedLore: (l) => set({ suggestedLore: l }),
  setExtractingLore: (e) => set({ isExtractingLore: e }),

  resetForNewChapter: () => set({ ...INITIAL }),
}));
