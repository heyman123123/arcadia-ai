/**
 * TextField - 通用输入框
 *
 * 两种 variant:text(单行) / textarea(多行)
 */

import type { ChangeEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';

interface BaseProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

interface InputProps extends BaseProps {
  variant?: 'input';
  type?: 'text' | 'password' | 'email';
}

interface TextareaProps extends BaseProps {
  variant: 'textarea';
  rows?: number;
}

type TextFieldProps = InputProps | TextareaProps;

const FIELD_CLASS =
  'w-full text-xs p-2 bg-[#FAF9F6] border border-gray-200 rounded-lg outline-none focus:border-[#788E76] resize-none';

export function TextField(props: TextFieldProps) {
  const { label, value, onChange, placeholder, className, required, disabled } = props;

  const onInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value);

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {props.variant === 'textarea' ? (
        <textarea
          value={value}
          onChange={onInput}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={props.rows ?? 4}
          className={FIELD_CLASS}
        />
      ) : (
        <input
          value={value}
          onChange={onInput}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          type={props.type ?? 'text'}
          className={FIELD_CLASS}
        />
      )}
    </div>
  );
}

/** 简易 Label + 文本(只读展示) */
export function LabeledText({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</div>
      <div>{children}</div>
    </div>
  );
}
