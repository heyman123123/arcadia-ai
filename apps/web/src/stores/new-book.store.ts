/**
 * newBookStore - 新建书籍的弹窗 + 表单 + 初始化进度
 *
 * 临时态:关闭弹窗后清空表单(避免下次打开时残留上次的输入)
 */

import { create } from 'zustand';

export interface NewBookForm {
  title: string;
  genre: string;
  brief: string;
  template: string; // 'none' | writing prompt preset name
  customPrompt: string;
}

const EMPTY_FORM: NewBookForm = {
  title: '',
  genre: '奇幻冒险',
  brief: '',
  template: 'none',
  customPrompt: '',
};

interface NewBookState {
  isOpen: boolean;
  form: NewBookForm;
  isInitializing: boolean;
  initLogs: string[];

  open: () => void;
  close: () => void;
  updateField: <K extends keyof NewBookForm>(key: K, value: NewBookForm[K]) => void;
  resetForm: () => void;

  startInit: (logs: string[]) => void;
  appendLog: (log: string) => void;
  finishInit: () => void;
}

export const useNewBookStore = create<NewBookState>((set) => ({
  isOpen: false,
  form: EMPTY_FORM,
  isInitializing: false,
  initLogs: [],

  open: () => set({ isOpen: true, form: EMPTY_FORM, isInitializing: false, initLogs: [] }),
  close: () => set({ isOpen: false }),
  updateField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
  resetForm: () => set({ form: EMPTY_FORM }),

  startInit: (logs) => set({ isInitializing: true, initLogs: logs }),
  appendLog: (log) => set((s) => ({ initLogs: [...s.initLogs, log] })),
  finishInit: () => set({ isInitializing: false }),
}));
