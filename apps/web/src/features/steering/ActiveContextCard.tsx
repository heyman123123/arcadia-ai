/**
 * Active Context Card - 本章激活的上下文(角色技能 + 知识库规则)
 */

import { BookMarked } from 'lucide-react';
import type { BookProject } from '@arcadia/shared';
import { Card } from '../../components';
import { formatSkill } from '../../lib/format';

interface Props {
  book: BookProject;
  activeHighlights: string[];
}

export function ActiveContextCard({ book, activeHighlights }: Props) {
  return (
    <Card className="space-y-3">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
        <BookMarked className="w-3.5 h-3.5 text-[#788E76]" />
        本章激活上下文与契约规则
      </h4>
      <p className="text-[10px] text-gray-400 leading-normal">
        独立检索上下文引擎在开始时已为您从知识库中锁定并注入了以下条目，确保逻辑高度连贯：
      </p>

      <div className="space-y-3">
        {/* Active Character Skills */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#788E76] font-bold block">激活的角色技能</span>
          <div className="space-y-1">
            {book.characters.slice(0, 2).map((char, cIdx) => (
              <div key={cIdx} className="bg-[#FDFBF7] p-2 rounded-lg border border-gray-100 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-700">{char.name}</span>
                <div className="flex flex-wrap gap-1">
                  {char.skills?.map((sk, skIdx) => {
                    const label = formatSkill(sk);
                    const firstToken = label.split(/[\s(]/)[0] || label;
                    const isActive =
                      activeHighlights.length === 0 ||
                      activeHighlights.some(
                        (h) =>
                          h.toLowerCase().includes(char.name.split(' ')[0].toLowerCase()) ||
                          h.toLowerCase().includes(firstToken.toLowerCase()),
                      );
                    return (
                      <span
                        key={skIdx}
                        className={`text-[9px] px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-[#788E76]/10 text-[#4A5A48] border border-[#788E76]/20 font-semibold'
                            : 'bg-gray-50 text-gray-300 border border-gray-100'
                        }`}
                      >
                        {firstToken} {isActive ? '● 活跃' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* World rules */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-[#BC9F77] font-bold block">调用的世界观规则 (来自知识库)</span>
          <div className="space-y-1">
            {book.knowledgeBase.map((kb, kbIdx) => (
              <div key={kbIdx} className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#7C6138]">{kb.title}</span>
                  <span className="text-[8px] bg-amber-50 text-[#BC9F77] px-1 rounded">100% 匹配</span>
                </div>
                <p className="text-[10px] text-gray-500 italic line-clamp-2 leading-relaxed">{kb.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
