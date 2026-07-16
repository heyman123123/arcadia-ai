/**
 * EmptyState - 空状态
 */

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-12 text-center space-y-2">
      {icon && <div className="mx-auto w-10 h-10 text-gray-300 flex items-center justify-center">{icon}</div>}
      <p className="text-sm text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
