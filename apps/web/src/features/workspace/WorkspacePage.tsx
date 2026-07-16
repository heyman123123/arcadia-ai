/**
 * WorkspacePage - 工作区主页面
 *
 * 三栏布局:左侧 Sidebar(灵魂大本营/知识库) + 中间 Main(进度 + 章节 + 编辑器 + 日志) + 右侧 HUD(激活上下文 + 导演干预)
 */

import { useState } from 'react';
import { Sparkles, Database, RefreshCw, ArrowLeft, Sliders } from 'lucide-react';
import type { BookProject } from '@arcadia/shared';
import { useBooksStore, useDialogStore, useNewBookStore, usePipelineStore, useSettingsStore, useWorkspaceStore } from '../../stores';
import { Tabs, type TabItem, Tag } from '../../components';
import { WorkflowProgress } from './WorkflowProgress';
import { ChapterNavigator } from './ChapterNavigator';
import { ChapterEditor } from './ChapterEditor';
import { AgentStatusBoard } from './AgentStatusBoard';
import { LogTerminal } from './LogTerminal';
import { SoulBasePanel, type SoulBaseHandlers } from '../soul-base';
import { KnowledgeBasePanel, KbEntryDialog, type KbHandlers } from '../knowledge-base';
import { ActiveContextCard, SteeringPanel } from '../steering';

export interface WorkspaceHandlers {
  onRunNext: () => void;
  onPause: () => void;
  onApplySteering: () => void;
  onRewriteFromHere: () => void;
  onLog: (agent: string, text: string, type?: 'info' | 'warn' | 'success' | 'critique') => void;
  onOpenExport: () => void;
  onOpenAddChar: () => void;
  onAddCharacter: (form: { name: string; role: string; description: string; skillInput: string }) => void;
  onDeleteCharacter: (name: string) => void;
  onGenerateSkill: (name: string) => void;
  onSaveWorldview: (v: string) => void;
  onSavePrompt: (v: string) => void;
  onAddKb: () => void;
  onEditKb: (id: string) => void;
  onDeleteKb: (id: string) => void;
  onSaveKb: (form: { title: string; category: 'worldview' | 'characters' | 'timeline'; content: string }) => void;
  onAcceptLore: () => void;
  onDismissLore: () => void;
  onChangeChapter: (idx: number) => void;
}

interface Props {
  book: BookProject;
  handlers: WorkspaceHandlers;
}

type WorkspaceTab = 'soul' | 'kb';

export function WorkspacePage({ book, handlers }: Props) {
  const [tab, setTab] = useState<WorkspaceTab>('soul');
  const autoAcceptLore = useSettingsStore((s) => s.autoAcceptLore);
  const suggestedLore = usePipelineStore((s) => s.suggestedLore);
  const activeHighlights = usePipelineStore((s) => s.activeHighlights);
  const isInitializing = useBooksStore((s) => book.isInitializing);
  const initLogs = useNewBookStore((s) => s.initLogs);
  const setActiveBook = useWorkspaceStore((s) => s.setActiveBook);

  const tabs: TabItem<WorkspaceTab>[] = [
    { key: 'soul', label: '灵魂大本营', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'kb', label: `专属知识库 (${book.knowledgeBase.length})`, icon: <Database className="w-3.5 h-3.5" /> },
  ];

  const onTabChange = (key: WorkspaceTab) => setTab(key);

  const soulHandlers: SoulBaseHandlers = {
    onSaveWorldview: handlers.onSaveWorldview,
    onSavePrompt: handlers.onSavePrompt,
    onAddCharacter: handlers.onOpenAddChar,
    onDeleteCharacter: handlers.onDeleteCharacter,
    onGenerateSkill: handlers.onGenerateSkill,
    onLog: (msg) => handlers.onLog('系统', msg, 'success'),
  };

  const kbHandlers: KbHandlers = {
    onAddEntry: handlers.onAddKb,
    onEditEntry: (entry) => handlers.onEditKb(entry.id),
    onDeleteEntry: handlers.onDeleteKb,
    onAcceptLore: handlers.onAcceptLore,
    onDismissLore: handlers.onDismissLore,
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* === LEFT SIDEBAR === */}
      <aside className="w-80 border-r border-[#F0EBE3] flex flex-col bg-[#FAF9F6] shrink-0">
        <Tabs items={tabs} value={tab} onChange={onTabChange} accent={tab === 'soul' ? 'sage' : 'amber'} />
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-6">
          {tab === 'soul' ? (
            <SoulBasePanel book={book} handlers={soulHandlers} />
          ) : (
            <div className="space-y-4">
              <KnowledgeBasePanel
                book={book}
                autoAcceptLore={autoAcceptLore}
                suggestedLore={suggestedLore}
                handlers={kbHandlers}
              />
              <div className="p-4 border-t border-[#F0EBE3] bg-white text-[11px] text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>独立知识库健康度:</span>
                  <span className="text-emerald-600 font-bold">100% (极佳)</span>
                </div>
                <p className="text-[10px] leading-relaxed">系统将在您提交一章时,自动运行 Lore 智能体提炼新事件并存入此知识库,保持后续创作始终不跑偏。</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* === MAIN CENTER === */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {/* 初始化中提示 */}
        {isInitializing && (
          <div className="mx-6 mt-6 p-5 bg-gradient-to-r from-[#FAF6EE] to-[#FAF9F6] border-2 border-[#D4B996]/30 rounded-2xl shadow-[0_4px_20px_rgba(212,185,150,0.1)] space-y-4 animate-soft-pulse shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7C6138] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D4B996] animate-spin" />
                <span>智子并修筑基中 (Multi-Agent Warmup)</span>
              </span>
              <span className="text-[10px] bg-[#D4B996]/15 text-[#7A613E] border border-[#D4B996]/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                正在建立一书一独立知识库...
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              大纲智子、人设智子、世界观大师正在后台协力为您的小说<strong>《{book.title}》</strong>进行多智能体概念建构。在此期间,您可以点击左侧的"灵魂大本营"与"专属知识库"了解各面板功能。筑基成功后,主大纲与关键人设档案将会自动填实。
            </p>
            <div className="space-y-1.5">
              <span className="text-[9px] text-[#BC9F77] font-bold uppercase tracking-wider block">智子协同推演实时日志 (Live Stream):</span>
              <div className="h-28 bg-gray-900 rounded-xl p-3.5 overflow-y-auto font-mono text-[10px] text-emerald-400 border border-gray-800 space-y-1 shadow-inner custom-scroll">
                {initLogs.map((log, lIdx) => (
                  <div key={lIdx} className="flex gap-2 items-start text-[#10B981]">
                    <span className="text-[#10B981] font-bold shrink-0">▸</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="text-[9px] text-gray-500 animate-pulse pt-1">⚡ 契约法则汇聚中,精雕细琢每一丝背景细节...</div>
              </div>
            </div>
          </div>
        )}

        <WorkflowProgress
          chapterStatus={book.chapters[book.currentChapterIndex]?.status ?? 'pending'}
          onRunNext={handlers.onRunNext}
          onPause={handlers.onPause}
        />
        <ChapterNavigator
          book={book}
          onChangeChapter={handlers.onChangeChapter}
          onOpenExport={handlers.onOpenExport}
        />
        <ChapterEditor book={book} />
        <AgentStatusBoard />
        <LogTerminal />
      </main>

      {/* === RIGHT HUD === */}
      <aside className="w-80 border-l border-[#F0EBE3] flex flex-col bg-[#FAF9F6] overflow-y-auto custom-scroll p-4 space-y-4 shrink-0">
        {/* 顶部:回书架 + 切换视图按钮 */}
        <div className="flex items-center justify-between gap-2 -mb-2">
          <button
            onClick={() => setActiveBook(null)}
            className="text-[11px] text-gray-500 hover:text-[#788E76] flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> 返回书架
          </button>
          <Tag tone="sage" size="sm" className="font-mono">UI v2.0</Tag>
        </div>

        <ActiveContextCard book={book} activeHighlights={activeHighlights} />

        {book.chapters[book.currentChapterIndex]?.status === 'reviewing' || book.chapters[book.currentChapterIndex]?.status === 'completed' ? (
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-xs text-gray-500 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-gray-300" />
            本章已完成,等待人类导演决定下一步
          </div>
        ) : null}

        <SteeringPanel onApply={handlers.onApplySteering} onRewriteFromHere={handlers.onRewriteFromHere} />
      </aside>

      {/* === KB Entry Dialog(全局挂载) === */}
      <KbEntryDialog onSubmit={handlers.onSaveKb} />
    </div>
  );
}
