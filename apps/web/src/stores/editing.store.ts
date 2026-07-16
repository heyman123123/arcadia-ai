/**
 * editingStore - 灵魂大本营的"行内编辑"状态
 *
 *   - 编辑世界观/写作提示词的临时文本
 *   - 切书时同步刷新(由 App.tsx 的 useEffect 触发)
 */

import { create } from 'zustand';

interface EditingState {
  // 世界观
  isEditingWorldview: boolean;
  worldviewDraft: string;
  // 写作提示词
  isEditingPrompt: boolean;
  promptDraft: string;

  setEditingWorldview: (v: boolean) => void;
  setWorldviewDraft: (v: string) => void;
  setEditingPrompt: (v: boolean) => void;
  setPromptDraft: (v: string) => void;
}

export const useEditingStore = create<EditingState>((set) => ({
  isEditingWorldview: false,
  worldviewDraft: '',
  isEditingPrompt: false,
  promptDraft: '',

  setEditingWorldview: (v) => set({ isEditingWorldview: v }),
  setWorldviewDraft: (v) => set({ worldviewDraft: v }),
  setEditingPrompt: (v) => set({ isEditingPrompt: v }),
  setPromptDraft: (v) => set({ promptDraft: v }),
}));
