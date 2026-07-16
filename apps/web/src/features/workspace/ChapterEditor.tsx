/**
 * ChapterEditor - 富文本写作画布
 *
 * 包含:章节标题 + 剧情线索 + 分镜规划 + 正文 textarea
 */

import { useEffect, useRef } from 'react';
import { Check, Layers } from 'lucide-react';
import type { BookProject } from '@arcadia/shared';
import { useBooksStore } from '../../stores';
import { Tag } from '../../components';

interface Props {
  book: BookProject;
}

export function ChapterEditor({ book }: Props) {
  const updateActiveChapter = useBooksStore((s) => s.updateActiveChapter);
  const current = book.chapters[book.currentChapterIndex];
  const endRef = useRef<HTMLDivElement>(null);

  if (!current) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scroll bg-white relative">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#BC9F77] font-serif italic">
            {book.title} / 第 {current.number} 章
          </span>
          {current.status === 'completed' && (
            <Tag tone="emerald" size="sm" className="flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> 正式完成
            </Tag>
          )}
        </div>

        <input
          type="text"
          value={current.title || ''}
          onChange={(e) => updateActiveChapter(book.id, book.currentChapterIndex, { title: e.target.value })}
          className="text-2xl md:text-3xl font-bold font-serif text-[#2C2C2C] outline-none border-b border-transparent hover:border-gray-200 focus:border-[#788E76] pb-1 w-full"
          placeholder="输入本章标题..."
        />

        <div className="bg-[#FAF9F6] border-l-4 border-[#D4B996] p-3 rounded-r-lg space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">章节剧情线索 (大纲智能体精雕)</span>
          <p className="text-xs text-gray-600 leading-relaxed">{current.summary || '暂无剧情线索。'}</p>
        </div>

        {/* Scenes board */}
        {current.scenes && current.scenes.length > 0 && (
          <div className="bg-[#F5F7F5] border border-[#788E76]/15 rounded-xl p-4 space-y-3 shadow-xs">
            <span className="text-[10px] text-[#4A5A48] font-bold uppercase tracking-wider block flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-[#788E76]" /> 本章分镜场景策划 (Sequence Plan)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {current.scenes.map((scene, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white p-3 rounded-lg border border-[#788E76]/10 space-y-1.5 shadow-xs hover:shadow-md hover:border-[#788E76]/35 transition-all duration-300"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 font-serif leading-tight">{scene.title}</span>
                    <Tag
                      tone={scene.conflictLevel === 'high' ? 'rose' : scene.conflictLevel === 'medium' ? 'amber' : 'emerald'}
                      size="sm"
                      className="font-bold"
                    >
                      {scene.conflictLevel === 'high' ? '强冲突' : scene.conflictLevel === 'medium' ? '中冲突' : '缓节奏'}
                    </Tag>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-sans">{scene.summary}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[9px] text-gray-400 font-mono">
                    <span className="truncate">人物: {scene.characters?.join(', ') || '全体'}</span>
                    <span className="shrink-0 font-bold text-[#BC9F77]">{scene.targetWordCount} 字</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content editor */}
        <div className="pt-2 min-h-[300px]">
          <textarea
            value={current.content || ''}
            onChange={(e) => updateActiveChapter(book.id, book.currentChapterIndex, { content: e.target.value })}
            className="w-full min-h-[350px] editor-font text-gray-700 leading-relaxed outline-none resize-none border-none bg-transparent"
            placeholder="这里是作家的圣地，静待灵感编织。您可以直接在此打字输入，或在上方开启智能体后台创作流..."
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
