/**
 * dialogStore - 各种弹窗/对话框的开关与表单
 *
 * 集中管理 3 个对话框:KB 编辑 / 角色新增 / 精装导出
 */

import { create } from 'zustand';
import type { KBCategory } from '@arcadia/shared';

export interface KbForm {
  title: string;
  category: KBCategory;
  content: string;
}

export interface CharForm {
  name: string;
  role: string;
  description: string;
  skillInput: string;
}

interface DialogState {
  // KB Dialog
  isAddKbOpen: boolean;
  editingKbId: string | null;
  kbForm: KbForm;

  // Character Dialog
  isAddCharOpen: boolean;
  charForm: CharForm;

  // Export Dialog
  isExportOpen: boolean;
  exportCopied: boolean;

  // --- actions ---
  openKbDialog: (editId?: string) => void;
  closeKbDialog: () => void;
  setKbForm: (form: Partial<KbForm>) => void;

  openCharDialog: () => void;
  closeCharDialog: () => void;
  setCharForm: (form: Partial<CharForm>) => void;

  openExport: () => void;
  closeExport: () => void;
  setExportCopied: (v: boolean) => void;
}

const EMPTY_KB: KbForm = { title: '', category: 'worldview', content: '' };
const EMPTY_CHAR: CharForm = { name: '', role: '配角', description: '', skillInput: '' };

export const useDialogStore = create<DialogState>((set) => ({
  isAddKbOpen: false,
  editingKbId: null,
  kbForm: EMPTY_KB,

  isAddCharOpen: false,
  charForm: EMPTY_CHAR,

  isExportOpen: false,
  exportCopied: false,

  openKbDialog: (editId) =>
    set({ isAddKbOpen: true, editingKbId: editId ?? null, kbForm: EMPTY_KB }),
  closeKbDialog: () => set({ isAddKbOpen: false, editingKbId: null }),
  setKbForm: (form) => set((s) => ({ kbForm: { ...s.kbForm, ...form } })),

  openCharDialog: () => set({ isAddCharOpen: true, charForm: EMPTY_CHAR }),
  closeCharDialog: () => set({ isAddCharOpen: false }),
  setCharForm: (form) => set((s) => ({ charForm: { ...s.charForm, ...form } })),

  openExport: () => set({ isExportOpen: true, exportCopied: false }),
  closeExport: () => set({ isExportOpen: false }),
  setExportCopied: (v) => set({ exportCopied: v }),
}));
