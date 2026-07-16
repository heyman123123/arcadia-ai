/**
 * Card - 通用卡片容器
 */

import { cn } from '../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

export function Card({ children, className, padded = true, onClick, interactive }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        padded && 'p-4',
        interactive && 'cursor-pointer hover:border-[#D4B996] transition-all',
        className,
      )}
    >
      {children}
    </div>
  );
}
