/**
 * Export Book Dialog - 全书精装排版导出
 */

import { useEffect } from 'react';
import { BookOpen, Check } from 'lucide-react';
import type { BookProject } from '@arcadia/shared';
import { useDialogStore } from '../../stores';
import { Dialog, Button } from '../../components';
import { formatSkill, normalizeSkills } from '../../lib/format';

interface Props {
  book: BookProject;
}

export function ExportBookDialog({ book }: Props) {
  const isOpen = useDialogStore((s) => s.isExportOpen);
  const close = useDialogStore((s) => s.closeExport);
  const copied = useDialogStore((s) => s.exportCopied);
  const setCopied = useDialogStore((s) => s.setExportCopied);

  useEffect(() => {
    if (!isOpen) return;
    // 重置 copied 状态(避免上次的提示滞留)
    setCopied(false);
  }, [isOpen, setCopied]);

  const onCopy = () => {
    let doc = `# ${book.title}\n\n`;
    doc += `**流派风格**: ${book.genre}\n`;
    doc += `**创作时间**: ${book.createdAt}\n\n`;
    doc += `## 独立世界观大本营\n${book.worldview}\n\n`;
    doc += `## 核心人设契约\n`;
    book.characters.forEach((c) => {
      const skills = normalizeSkills(c.skills);
      doc += `### ${c.name} (${c.role})\n* 描述: ${c.description}\n* 专属特技/技能: ${skills.join(', ') || '暂无'}\n\n`;
    });
    doc += `## 正式章节内容\n\n`;
    book.chapters
      .filter((ch) => ch.status === 'completed')
      .forEach((ch) => {
        doc += `### 第 ${ch.number} 章: ${ch.title}\n\n${ch.content}\n\n---\n\n`;
      });

    navigator.clipboard
      .writeText(doc)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => alert('复制失败，请手动选择复制。'));
  };

  const completed = book.chapters.filter((ch) => ch.status === 'completed');
  const totalChars = completed.reduce((sum, ch) => sum + (ch.content?.length || 0), 0);

  return (
    <Dialog isOpen={isOpen} onClose={close} size="xl" title="全书精装排版与排版预览">
      <div className="flex-1 flex overflow-hidden -mx-6 -mb-6 mt-2">
        {/* 左侧:书皮 mockup */}
        <div className="w-80 border-r border-[#F0EBE3] bg-white p-6 flex flex-col justify-between select-none shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <div className="aspect-[3/4] w-full rounded-lg bg-gradient-to-br from-[#EAE6DF] via-[#F4F1EA] to-[#E5E0D7] border border-[#DDD8CE] shadow-lg p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-2 border border-[#BC9F77]/30 rounded"></div>
              <div className="absolute inset-2.5 border border-[#BC9F77]/10 rounded"></div>
              <div className="text-center space-y-2 pt-8 relative z-10">
                <span className="text-[10px] font-bold text-[#BC9F77] tracking-widest uppercase block">
                  精装独家珍藏
                </span>
                <h1 className="text-xl font-bold font-serif text-[#4A5A48] tracking-tight leading-snug px-2">
                  {book.title}
                </h1>
                <div className="w-8 h-px bg-[#BC9F77] mx-auto my-3"></div>
                <p className="text-[10px] text-gray-500 font-serif italic px-4 line-clamp-3">“ {book.brief} ”</p>
              </div>
              <div className="text-center relative z-10 space-y-1">
                <span className="text-[10px] font-bold text-[#788E76] bg-[#788E76]/10 px-2 py-0.5 rounded-full font-serif">
                  {book.genre}
                </span>
                <p className="text-[9px] text-[#BC9F77] font-mono tracking-widest uppercase pt-1">ARCADIA PRESS</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">书籍基本规格</span>
              <div className="bg-[#FAF9F6] border border-[#F0EBE3] rounded-xl p-3 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">完成字数:</span>
                  <span className="font-bold font-mono text-gray-800">{totalChars} 字</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已成章节:</span>
                  <span className="font-bold text-gray-800">{completed.length} 章</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">设定总数:</span>
                  <span className="font-bold text-gray-800">{book.knowledgeBase.length} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">文风倾向:</span>
                  <span className="font-bold text-[#788E76] truncate max-w-[120px]">{book.genre}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-400">一书一数据库，让AI创作呈现极致纯净。</p>
        </div>

        {/* 右侧:章节内容 */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scroll bg-white">
          <div className="max-w-xl mx-auto space-y-12">
            <div className="text-center space-y-3 pb-8 border-b border-[#F0EBE3]">
              <span className="text-xs text-[#BC9F77] tracking-widest uppercase font-serif">PREFACE / 世界序言</span>
              <h2 className="text-3xl font-bold font-serif text-[#2C2C2C]">{book.title}</h2>
              <p className="text-xs text-gray-400 font-mono">创世契约书 · 独立知识图谱底层</p>
              <div className="text-left text-xs text-gray-600 leading-relaxed italic bg-[#FAF9F6] border border-dashed border-gray-200 p-4 rounded-xl mt-4">
                <strong>世界法则:</strong> {book.worldview}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#4A5A48] uppercase tracking-wider font-serif border-l-2 border-[#788E76] pl-2">
                契约主角小传
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {book.characters.map((char, index) => (
                  <div key={index} className="bg-[#FAF9F6] border border-[#F0EBE3] rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800">{char.name}</span>
                      <span className="text-[9px] bg-[#788E76]/10 text-[#788E76] px-1.5 py-0.5 rounded-full font-medium">
                        {char.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{char.description}</p>
                    {char.skills && char.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-200/50">
                        {char.skills.map((s, idx) => {
                          const label = formatSkill(s);
                          return (
                            <span
                              key={idx}
                              className="text-[8px] bg-[#788E76]/10 text-[#4A5A48] px-1.5 py-0.5 rounded leading-none"
                            >
                              ⚡ {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-12">
              <h3 className="text-sm font-bold text-[#4A5A48] uppercase tracking-wider font-serif border-l-2 border-[#788E76] pl-2">
                已提交正式章卷
              </h3>
              {completed.map((ch) => (
                <div key={ch.number} className="space-y-4 pb-8 border-b border-gray-100 last:border-none">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#BC9F77] font-serif uppercase tracking-widest block">
                      第 {ch.number} 章
                    </span>
                    <h4 className="text-xl font-bold font-serif text-gray-800">{ch.title}</h4>
                  </div>
                  <div className="text-[10px] text-gray-400 italic bg-gray-50 p-2 rounded border border-gray-100">
                    本章核心剧情：{ch.summary}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed font-serif whitespace-pre-wrap first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-[#788E76] pt-1">
                    {ch.content}
                  </p>
                </div>
              ))}

              {completed.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-xs italic">
                  暂无已完成的章节。请前往工作室完成章节创作质量初评并正式归档！
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
        <Button variant="primary" onClick={onCopy} icon={copied ? <Check className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}>
          {copied ? '已成功复制全书 MD' : '一键复制全书 Markdown'}
        </Button>
        <Button variant="secondary" onClick={close}>
          关闭
        </Button>
      </div>
    </Dialog>
  );
}
