/**
 * Select - 通用下拉
 */

import type { ChangeEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function Select({ label, value, onChange, options, placeholder, className, disabled }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full text-xs p-2 bg-[#FAF9F6] border border-gray-200 rounded-lg outline-none focus:border-[#788E76] cursor-pointer',
          className,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
