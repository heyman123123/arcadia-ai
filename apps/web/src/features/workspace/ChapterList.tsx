/**
 * ChapterList - 主区域左侧的章节目录列表
 *
 * 设计目标:
 *   - 一眼看到全书 N 章的进度分布
 *   - 当前章节高亮
 *   - 点击切换,自动重置流水线 idle
 *   - 状态徽标:pending / planning / drafting / reviewing / completed
 */

import { Check, Loader2, CircleDashed, FileText, Sparkles, Download } from 'lucide-react';
import type { BookProject, Chapter, ChapterStatus } from '@arcadia/shared';
import { cn } from '../../lib/cn';

interface Props {
  book: BookProject;
  onChangeChapter: (idx: number) => void;
  onOpenExport: () => void;
}

const STATUS_META: Record<
  ChapterStatus,
  { label: string; icon: React.ReactNode; tone: string; ring: string; dot: string }
> = {
  pending: {
    label: '待创作',
    icon: <CircleDashed className="w-3 h-3" />,
    tone: 'text-gray-400 bg-gray-50 border-gray-200',
    ring: 'ring-gray-200',
    dot: 'bg-gray-300',
  },
  planning: {
    label: '规划中',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    tone: 'text-[#788E76] bg-[#788E76]/10 border-[#788E76]/30',
    ring: 'ring-[#788E76]/40',
    dot: 'bg-[#788E76]',
  },
  drafting: {
    label: '撰写中',
    icon: <Sparkles className="w-3 h-3" />,
    tone: 'text-amber-700 bg-amber-50 border-amber-300',
    ring: 'ring-amber-300',
    dot: 'bg-amber-500',
  },
  reviewing: {
    label: '评审中',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    tone: 'text-purple-700 bg-purple-50 border-purple-300',
    ring: 'ring-purple-300',
    dot: 'bg-purple-500',
  },
  completed: {
    label: '已完成',
    icon: <Check className="w-3 h-3" />,
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    ring: 'ring-emerald-300',
    dot: 'bg-emerald-500',
  },
};

function ChapterRow({
  chapter,
  index,
  isCurrent,
  onClick,
}: {
  chapter: Chapter;
  index: number;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const meta = STATUS_META[chapter.status];
  const wordCount = chapter.content?.length || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left px-3 py-2.5 rounded-lg border transition-all',
        isCurrent
          ? 'bg-white border-[#788E76]/40 shadow-sm ring-1 ring-[#788E76]/20'
          : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200',
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* 序号圆点 */}
        <div
          className={cn(
            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border',
            isCurrent
              ? 'bg-[#788E76] text-white border-[#788E76]'
              : 'bg-white text-gray-500 border-gray-200 group-hover:border-[#788E76]/40',
          )}
        >
          {chapter.number}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={cn(
                'text-[12px] font-bold leading-snug line-clamp-2',
                isCurrent ? 'text-[#2C2C2C]' : 'text-gray-700',
              )}
              title={chapter.title}
            >
              {chapter.title || `第 ${chapter.number} 章`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border',
                meta.tone,
              )}
            >
              {meta.icon}
              {meta.label}
            </span>
            <span className="text-[9px] text-gray-400 font-mono">{wordCount} 字</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function ChapterList({ book, onChangeChapter, onOpenExport }: Props) {
  const total = book.chapters.length;
  const done = book.chapters.filter((c) => c.status === 'completed').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <aside className="w-60 shrink-0 border-r border-[#F0EBE3] bg-[#FAF9F6] flex flex-col">
      {/* 顶部:书籍标题 + 总进度 + 导出 */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-[#BC9F77] font-bold uppercase tracking-wider">
            <FileText className="w-3 h-3" />
            章节目录
          </div>
          <button
            onClick={onOpenExport}
            className="text-[10px] text-[#788E76] hover:text-[#4A5A48] hover:bg-[#788E76]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
            title="全书精装排版导出"
          >
            <Download className="w-3 h-3" />
            导出
          </button>
        </div>
        <div className="text-[11px] text-gray-500 leading-snug line-clamp-1" title={book.title}>
          《{book.title}》
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>全书进度</span>
            <span className="font-mono font-bold text-[#788E76]">
              {done} / {total} · {pct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#788E76] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 章节列表 */}
      <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
        {book.chapters.map((ch, idx) => (
          <ChapterRow
            key={idx}
            chapter={ch}
            index={idx}
            isCurrent={idx === book.currentChapterIndex}
            onClick={() => onChangeChapter(idx)}
          />
        ))}
        {total === 0 && (
          <div className="text-center text-[10px] text-gray-400 py-6 italic">尚无章节</div>
        )}
      </div>
    </aside>
  );
}
