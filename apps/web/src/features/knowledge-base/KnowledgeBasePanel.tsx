/**
 * Knowledge Base Panel - 一书一独立知识库
 */

import { useMemo, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { BookProject, KBCategory, KBEntry } from '@arcadia/shared';
import { Button, Card, EmptyState, Tag } from '../../components';
import { KbEntryCard } from './KbEntryCard';
import { LoreSuggestionCard } from './LoreSuggestionCard';
import type { LoreSuggestion } from '@arcadia/shared';

type KbFilter = 'all' | KBCategory;

const FILTERS: Array<{ key: KbFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'worldview', label: '世界观' },
  { key: 'characters', label: '人际/档案' },
  { key: 'timeline', label: '剧情时间线' },
];

export interface KbHandlers {
  onAddEntry: () => void;
  onEditEntry: (entry: KBEntry) => void;
  onDeleteEntry: (id: string) => void;
  onAcceptLore: (suggestion: LoreSuggestion) => void;
  onDismissLore: () => void;
}

interface Props {
  book: BookProject;
  autoAcceptLore: boolean;
  suggestedLore: LoreSuggestion | null;
  handlers: KbHandlers;
}

export function KnowledgeBasePanel({ book, autoAcceptLore, suggestedLore, handlers }: Props) {
  const [filter, setFilter] = useState<KbFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return book.knowledgeBase;
    return book.knowledgeBase.filter((kb) => kb.category === filter);
  }, [book.knowledgeBase, filter]);

  return (
    <>
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h4 className="text-xs font-bold text-gray-700">一书一独立知识库</h4>
          <p className="text-[10px] text-gray-400">规避大模型幻觉与人设崩塌的核心组件</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handlers.onAddEntry}
          icon={<Plus className="w-3 h-3" />}
          className="bg-[#D4B996] text-white"
        >
          新设
        </Button>
      </div>

      {/* Auto-archive toggle */}
      <Card className="bg-[#FAF9F6] border-[#F0EBE3] space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#4A5A48] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D4B996]" />
            一书一设定自演进 (Evolving Lore)
          </span>
          <Tag tone={autoAcceptLore ? 'emerald' : 'gray'} size="sm">
            {autoAcceptLore ? '自动归档' : '人工确认'}
          </Tag>
        </div>
        <p className="text-[9px] text-gray-400 leading-normal">
          随着各章不断撰写，智能体会自动分析正文内容并将演进事实渐进式地自动归档、同步至独立知识库。
        </p>
      </Card>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              filter === btn.key
                ? 'bg-[#D4B996] text-white'
                : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* KB cards */}
      <div className="space-y-3 pt-2">
        {filtered.map((kb) => (
          <KbEntryCard
            key={kb.id}
            entry={kb}
            onEdit={() => handlers.onEditEntry(kb)}
            onDelete={() => handlers.onDeleteEntry(kb.id)}
          />
        ))}

        {filtered.length === 0 && (
          <EmptyState title="暂无相关知识库条目" description="点击右上「新设」开始构建一书一知识库" />
        )}
      </div>

      {/* Lore suggestion (Lore Master agent) */}
      {suggestedLore && (
        <LoreSuggestionCard
          suggestion={suggestedLore}
          onAccept={() => handlers.onAcceptLore(suggestedLore)}
          onDismiss={handlers.onDismissLore}
        />
      )}
    </>
  );
}
