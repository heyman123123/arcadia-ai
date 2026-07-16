/**
 * workspaceStore - 工作区视图状态
 *
 * 跨章节切换时仍保留(用户切回书架再回来不会丢):
 *   - 当前激活的书籍 id
 *   - 灵魂大本营 vs 知识库 标签页
 *   - 书架搜索词
 *   - 知识库分类筛选
 *
 * 不持久化(下次启动从 books 选一本新的)
 */

import { create } from 'zustand';
import type { KBCategory } from '@arcadia/shared';

export type KbFilter = 'all' | KBCategory;
export type WorkspaceTab = 'soul' | 'kb';

interface WorkspaceState {
  activeBookId: string | null;
  activeTab: WorkspaceTab;
  searchQuery: string;
  kbFilter: KbFilter;

  setActiveBook: (id: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setSearchQuery: (q: string) => void;
  setKbFilter: (f: KbFilter) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeBookId: null,
  activeTab: 'soul',
  searchQuery: '',
  kbFilter: 'all',

  setActiveBook: (id) => set({ activeBookId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setKbFilter: (f) => set({ kbFilter: f }),
}));
