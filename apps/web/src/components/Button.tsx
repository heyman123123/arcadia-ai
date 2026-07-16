/**
 * Button - 通用按钮
 *
 * 变体:
 *   - primary: 主操作(深绿 sage)
 *   - secondary: 次要(白底浅边框)
 *   - ghost: 无背景,只文字/图标
 *   - danger: 危险操作(红色)
 *
 * size: sm / md
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-[#788E76] text-white hover:bg-[#687C66] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
  danger: 'text-red-500 hover:bg-red-50 hover:text-red-700',
};

const SIZE: Record<Size, string> = {
  sm: 'text-[11px] px-2.5 py-1',
  md: 'text-xs px-3.5 py-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
