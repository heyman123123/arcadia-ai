/**
 * ChapterNavigator - 章节下拉切换
 */

import { RefreshCw, FileText } from 'lucide-react';
import type { BookProject } from '@arcadia/shared';
import { usePipelineStore } from '../../stores';
import { Button } from '../../components';

interface Props {
  book: BookProject;
  onChangeChapter: (idx: number) => void;
  onOpenExport: () => void;
}

export function ChapterNavigator({ book, onChangeChapter, onOpenExport }: Props) {
  const isRolling = usePipelineStore((s) => s.isRollingOutline);
  const current = book.chapters[book.currentChapterIndex];

  return (
    <div className="h-10 px-6 border-b border-gray-50 bg-[#FAF9F6] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-1 text-xs">
        <span className="text-gray-400">当前章节:</span>
        <select
          value={book.currentChapterIndex}
          onChange={(e) => onChangeChapter(parseInt(e.target.value))}
          className="font-bold text-[#4A5A48] bg-transparent border-none outline-none cursor-pointer"
        >
          {book.chapters.map((ch, idx) => (
            <option key={idx} value={idx}>
              第 {ch.number} 章：{ch.title} ({ch.status === 'completed' ? '已完成' : '待创作'})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {isRolling && (
          <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> 大纲智子滚动推演中...
          </span>
        )}
        <span className="text-gray-400">
          字数评估: <strong className="text-gray-600 font-mono">{current?.content?.length || 0}</strong> 字
        </span>
        <div className="h-4 w-px bg-gray-200"></div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenExport}
          icon={<FileText className="w-3.5 h-3.5" />}
          className="bg-[#788E76]/10 text-[#788E76] hover:bg-[#788E76]/25 border border-[#788E76]/20"
        >
          全书精装排版导出
        </Button>
      </div>
    </div>
  );
}
