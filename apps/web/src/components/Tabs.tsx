/**
 * Tabs - 标签页
 */

import { cn } from '../lib/cn';

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  /** 强调色(用于活动 tab),默认 sage */
  accent?: 'sage' | 'amber';
}

export function Tabs<T extends string>({ items, value, onChange, className, accent = 'sage' }: TabsProps<T>) {
  const activeClass = accent === 'sage'
    ? 'bg-[#788E76]/10 text-[#4A5A48]'
    : 'bg-[#D4B996]/10 text-[#7C6138]';

  return (
    <div className={cn('flex border-b border-gray-100 bg-white p-2', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5',
            value === item.key ? activeClass : 'text-gray-400 hover:text-gray-700',
          )}
        >
          {item.icon}
          {item.label}
          {item.badge !== undefined && (
            <span className="text-[9px] text-gray-400">({item.badge})</span>
          )}
        </button>
      ))}
    </div>
  );
}
