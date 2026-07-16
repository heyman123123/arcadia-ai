/**
 * steeringStore - 导演干预面板的输入
 *
 * 切章节时重置
 */

import { create } from 'zustand';

interface SteeringState {
  input: string;
  lastApplied: string;

  setInput: (v: string) => void;
  apply: (text: string) => void;
  reset: () => void;
}

export const useSteeringStore = create<SteeringState>((set) => ({
  input: '',
  lastApplied: '',

  setInput: (v) => set({ input: v }),
  apply: (text) => set({ lastApplied: text }),
  reset: () => set({ input: '', lastApplied: '' }),
}));
