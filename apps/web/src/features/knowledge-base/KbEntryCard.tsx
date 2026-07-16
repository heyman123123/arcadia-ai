/**
 * KB Entry Card - 单条知识库条目
 */

import { Edit3, Trash2 } from 'lucide-react';
import type { KBEntry, KBCategory } from '@arcadia/shared';
import { Card, Tag } from '../../components';

const CATEGORY_LABEL: Record<KBCategory, string> = {
  worldview: '世界设定',
  characters: '人际契约',
  timeline: '发生大事',
};

const CATEGORY_TONE: Record<KBCategory, 'sage' | 'amber' | 'blue'> = {
  worldview: 'sage',
  characters: 'amber',
  timeline: 'blue',
};

interface Props {
  entry: KBEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function KbEntryCard({ entry, onEdit, onDelete }: Props) {
  return (
    <Card className="space-y-1.5 relative group">
      <div className="absolute top-2 right-2 flex gap-1.5 bg-white/95 backdrop-blur-xs px-1.5 py-1 rounded-lg border border-gray-100 shadow-xs opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-[#788E76] hover:bg-[#788E76]/10 p-1 rounded-md transition-colors"
          title="编辑"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"
          title="删除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-1.5 pb-1 pr-14">
        <Tag tone={CATEGORY_TONE[entry.category]}>{CATEGORY_LABEL[entry.category]}</Tag>
        <span className="text-xs font-bold text-gray-800 tracking-tight">{entry.title}</span>
      </div>
      <p className="text-[11px] text-gray-600 leading-relaxed italic bg-[#FDFBF7] p-2 rounded border border-dashed border-gray-50">
        {entry.content}
      </p>
    </Card>
  );
}
