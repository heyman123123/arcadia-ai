/**
 * 单本书卡片
 */

import { Trash2, BookOpen, Database, ChevronRight } from 'lucide-react';
import type { BookProject } from '@arcadia/shared';
import { Tag } from '../../components';

interface BookCardProps {
  book: BookProject;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function BookCard({ book, onOpen, onDelete }: BookCardProps) {
  const completed = book.chapters.filter((c) => c.status === 'completed').length;
  const total = book.chapters.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      onClick={onOpen}
      className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between hover:border-[#D4B996] hover:shadow-[0_8px_24px_rgba(212,185,150,0.06)] transition-all cursor-pointer relative"
    >
      <button
        onClick={onDelete}
        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-gray-100 bg-white shadow-xs z-10"
        title="删除书籍"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag tone="sage">{book.genre}</Tag>
          <span className="text-[10px] text-gray-400 font-mono">{book.createdAt}</span>
        </div>
        <div>
          <h4 className="text-xl font-bold text-[#2C2C2C] font-serif group-hover:text-[#788E76] transition-colors">
            {book.title}
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-2 italic">“ {book.brief} ”</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-gray-300" />
            {completed} / {total} 章节已完成
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-gray-300" />
            {book.knowledgeBase.length} 专属设定
          </span>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#788E76] h-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>创作进度: {pct}%</span>
          <span className="text-[#BC9F77] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
            进入写作室 <ChevronRight className="w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
