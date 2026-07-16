/**
 * settingsStore - 用户偏好(持久化)
 *
 *   - styleFilters:文风精修层开关
 *   - autoAcceptLore:Lore 智能体抽取后是否自动入知识库
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_STYLE_FILTERS, type StyleFilters } from '@arcadia/shared';

interface SettingsState {
  styleFilters: StyleFilters;
  autoAcceptLore: boolean;

  setStyleFilter: <K extends keyof StyleFilters>(key: K, value: StyleFilters[K]) => void;
  setAutoAcceptLore: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      styleFilters: DEFAULT_STYLE_FILTERS,
      autoAcceptLore: true,

      setStyleFilter: (key, value) =>
        set((state) => ({ styleFilters: { ...state.styleFilters, [key]: value } })),

      setAutoAcceptLore: (v) => set({ autoAcceptLore: v }),
    }),
    {
      name: 'arcadia_settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
