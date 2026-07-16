/**
 * Tag - 徽章
 *
 * 3 种语义色:sage / amber / blue
 */

import { cn } from '../lib/cn';

type Tone = 'sage' | 'amber' | 'blue' | 'gray' | 'rose' | 'emerald';

const TONE: Record<Tone, string> = {
  sage: 'bg-[#E2ECE0] text-[#3D563A] border-[#788E76]/30',
  amber: 'bg-[#F3EFE9] text-[#7A613E] border-[#D4B996]/30',
  blue: 'bg-[#E3F2FD] text-[#0D47A1] border-[#90CAF9]',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
};

interface TagProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}

export function Tag({ tone = 'gray', children, className, size = 'sm', title }: TagProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-block font-semibold rounded-full border',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
