/**
 * Lore Suggestion Card - 自动抽取的 lore 建议
 */

import { Sparkles, X, Check } from 'lucide-react';
import type { KBCategory, LoreSuggestion } from '@arcadia/shared';
import { Card, Tag, Button } from '../../components';

const CATEGORY_LABEL: Record<KBCategory, string> = {
  worldview: '世界设定',
  characters: '人设变迁',
  timeline: '事件发展',
};

const CATEGORY_TONE: Record<KBCategory, 'amber' | 'rose' | 'blue'> = {
  worldview: 'amber',
  characters: 'rose',
  timeline: 'blue',
};

interface Props {
  suggestion: LoreSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function LoreSuggestionCard({ suggestion, onAccept, onDismiss }: Props) {
  return (
    <Card className="border-2 border-[#D4B996] bg-[#FAF5EC] space-y-3 shadow-md animate-soft-pulse">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#7C6138] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#D4B996]" />
          Lore 设定自动同步建议
        </span>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-[#D4B996]/20">
        <div className="flex items-center gap-1">
          <Tag tone={CATEGORY_TONE[suggestion.category]} size="sm">
            {CATEGORY_LABEL[suggestion.category]}
          </Tag>
          <span className="text-xs font-bold text-gray-800">{suggestion.title}</span>
        </div>
        <p className="text-[11px] text-gray-600 leading-normal italic">“ {suggestion.content} ”</p>
      </div>

      <div className="text-[10px] text-gray-400">
        <strong>原因:</strong> {suggestion.reason}
      </div>

      <Button
        onClick={onAccept}
        variant="primary"
        className="w-full bg-[#D4B996] text-[#5D4A31] hover:opacity-90 py-1.5"
        icon={<Check className="w-3.5 h-3.5" />}
      >
        接受并更新至一书一知识库
      </Button>
    </Card>
  );
}
