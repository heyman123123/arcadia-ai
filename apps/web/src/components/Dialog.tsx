/**
 * Dialog - 通用模态框
 *
 * 用法:
 *   <Dialog isOpen={x} onClose={...} title="...">
 *     <DialogContent>...</DialogContent>
 *   </Dialog>
 */

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 关闭按钮 disabled(用于初始化期间防误关) */
  disableClose?: boolean;
}

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Dialog({ isOpen, onClose, title, children, size = 'md', disableClose }: DialogProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#2C2C2C]/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-2xl border border-gray-100 ${SIZE[size]} w-full p-6 shadow-2xl space-y-4`}
      >
        {title && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-[#4A5A48] font-serif">{title}</h3>
            <button
              onClick={onClose}
              disabled={disableClose}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
