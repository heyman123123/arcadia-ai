/**
 * App - 根组件
 *
 * 阶段 4 后:
 *   - 业务逻辑(handlers)集中在这里
 *   - 状态/UI 完全由 features/* + components/* + stores/* 提供
 *   - 本文件只做 store 引用 + setter 适配 + handler + 装配
 */

import React, { useEffect, useRef } from 'react';
import {
  Book,
  Plus,
  Feather,
  Database,
  Activity,
  Play,
  Pause,
  Save,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Check,
  Clock,
  Send,
  RefreshCw,
  Layers,
  Trash2,
  BookOpen,
  Edit3,
  Sliders,
  Compass,
  UserPlus,
  BookMarked,
  X,
  FileText,
} from 'lucide-react';
import {
  WRITING_PROMPT_PRESETS,
  type Chapter,
  type ChapterStatus,
  type Character,
  type KBEntry,
  type BookProject,
  type KBCategory,
  type PipelineStage,
  type PipelineStepName,
  type LogType,
  type StyleFilters,
  type LoreSuggestion,
  type Scene,
} from '@arcadia/shared';
import {
  useBooksStore,
  useWorkspaceStore,
  useSettingsStore,
  useNewBookStore,
  usePipelineStore,
  useSteeringStore,
  useEditingStore,
  useDialogStore,
} from './stores';
import { normalizeBook, normalizeSkills } from './lib/format';
import { bookApi, agentApi, ApiError } from './api';
import { BookshelfPage } from './features/bookshelf';
import { WorkspacePage, type WorkspaceHandlers } from './features/workspace';
import { NewBookDialog } from './features/book-init';
import { AddCharacterDialog } from './features/characters';
import { ExportBookDialog } from './features/export';
import { Button, Tag, Dialog } from './components';

export default function App() {
  // ============ 状态订阅(细粒度 selector) ============
  const books = useBooksStore((s) => s.books);
  const activeBookId = useWorkspaceStore((s) => s.activeBookId);
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const kbFilter = useWorkspaceStore((s) => s.kbFilter);
  const isNewBookOpen = useNewBookStore((s) => s.isOpen);
  const newBookForm = useNewBookStore((s) => s.form);
  const isInitializing = useNewBookStore((s) => s.isInitializing);
  const initLogs = useNewBookStore((s) => s.initLogs);
  const isPipelineRunning = usePipelineStore((s) => s.isRunning);
  const currentStage = usePipelineStore((s) => s.currentStage);
  const pipelineLogs = usePipelineStore((s) => s.logs);
  const activeHighlights = usePipelineStore((s) => s.activeHighlights);
  const isRollingOutline = usePipelineStore((s) => s.isRollingOutline);
  const suggestedLore = usePipelineStore((s) => s.suggestedLore);
  const isExtractingLore = usePipelineStore((s) => s.isExtractingLore);
  const styleFilters = useSettingsStore((s) => s.styleFilters);
  const autoAcceptLore = useSettingsStore((s) => s.autoAcceptLore);
  const steeringInput = useSteeringStore((s) => s.input);
  const lastSteeringApplied = useSteeringStore((s) => s.lastApplied);
  const editingWorldview = useEditingStore((s) => s.isEditingWorldview);
  const worldviewText = useEditingStore((s) => s.worldviewDraft);
  const editingPrompt = useEditingStore((s) => s.isEditingPrompt);
  const promptText = useEditingStore((s) => s.promptDraft);
  const editingKbId = useDialogStore((s) => s.editingKbId);
  const kbForm = useDialogStore((s) => s.kbForm);
  const isAddKbOpen = useDialogStore((s) => s.isAddKbOpen);
  const isAddCharOpen = useDialogStore((s) => s.isAddCharOpen);
  const charForm = useDialogStore((s) => s.charForm);
  const isExportOpen = useDialogStore((s) => s.isExportOpen);
  const exportCopied = useDialogStore((s) => s.exportCopied);

  // --- 便捷 setter wrapper(让 handler 仍能像 useState 一样用) ---
  const setActiveTab = (tab: 'soul' | 'kb') => useWorkspaceStore.getState().setActiveTab(tab);
  const setSearchQuery = (q: string) => useWorkspaceStore.getState().setSearchQuery(q);
  const setKbFilter = (f: 'all' | KBCategory) => useWorkspaceStore.getState().setKbFilter(f);
  const setActiveBookId = (id: string | null) => useWorkspaceStore.getState().setActiveBook(id);

  const setIsNewBookOpen = (v: boolean) => (v ? useNewBookStore.getState().open() : useNewBookStore.getState().close());
  const closeNewBook = useNewBookStore.getState().close;
  const setNewBookForm = (input: any) => {
    const cur = useNewBookStore.getState().form;
    const patch = typeof input === 'function' ? input(cur) : input;
    Object.entries(patch).forEach(([k, v]) => useNewBookStore.getState().updateField(k as any, v));
  };

  const setCurrentStage = (s: PipelineStage) => usePipelineStore.getState().setStage(s);
  const setIsPipelineRunning = (r: boolean) => usePipelineStore.getState().setRunning(r);
  const setPipelineLogs = (_: unknown) => usePipelineStore.getState().clearLogs();
  const setActiveHighlights = (h: string[]) => usePipelineStore.getState().setActiveHighlights(h);
  const setSuggestedLore = (l: LoreSuggestion | null) => usePipelineStore.getState().setSuggestedLore(l);
  const setIsExtractingLore = (e: boolean) => usePipelineStore.getState().setExtractingLore(e);
  const setIsRollingOutline = (r: boolean) => usePipelineStore.getState().setRollingOutline(r);

  const setSteeringInput = (v: string) => useSteeringStore.getState().setInput(v);
  const setLastSteeringApplied = (text: string) => useSteeringStore.getState().apply(text);

  const setStyleFilters = (updater: (prev: StyleFilters) => StyleFilters) => {
    useSettingsStore.setState({ styleFilters: updater(useSettingsStore.getState().styleFilters) });
  };
  const setAutoAcceptLore = (v: boolean) => useSettingsStore.getState().setAutoAcceptLore(v);

  const setEditingWorldview = (v: boolean) => useEditingStore.getState().setEditingWorldview(v);
  const setWorldviewText = (v: string) => useEditingStore.getState().setWorldviewDraft(v);
  const setEditingPrompt = (v: boolean) => useEditingStore.getState().setEditingPrompt(v);
  const setPromptText = (v: string) => useEditingStore.getState().setPromptDraft(v);

  const setIsAddKbOpen = (v: boolean) =>
    v ? useDialogStore.getState().openKbDialog() : useDialogStore.getState().closeKbDialog();
  const setKbForm = (input: any) => {
    const cur = useDialogStore.getState().kbForm;
    const patch = typeof input === 'function' ? input(cur) : input;
    useDialogStore.getState().setKbForm(patch);
  };
  const setEditingKbId = (v: string | null) => useDialogStore.setState({ editingKbId: v });
  const setIsAddCharOpen = (v: boolean) =>
    v ? useDialogStore.getState().openCharDialog() : useDialogStore.getState().closeCharDialog();
  const setCharForm = (input: any) => {
    const cur = useDialogStore.getState().charForm;
    const patch = typeof input === 'function' ? input(cur) : input;
    useDialogStore.getState().setCharForm(patch);
  };
  const setIsExportOpen = (v: boolean) =>
    v ? useDialogStore.getState().openExport() : useDialogStore.getState().closeExport();
  const setExportCopied = (v: boolean) => useDialogStore.getState().setExportCopied(v);

  // Refs
  const pipelineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived
  const activeBook = activeBookId ? books.find((b) => b.id === activeBookId) ?? null : null;

  // ============ Effects ============
  // 切书时同步 worldview/prompt 草稿 + 重置 pipeline
  useEffect(() => {
    if (activeBook) {
      useEditingStore.getState().setWorldviewDraft(activeBook.worldview);
      useEditingStore.getState().setPromptDraft(activeBook.writingPrompt);
      usePipelineStore.getState().setSuggestedLore(null);
      usePipelineStore.getState().setRunning(false);
      usePipelineStore.getState().setStage('idle');
      usePipelineStore.getState().clearLogs();
      usePipelineStore.getState().setActiveHighlights([]);
      if (pipelineTimeoutRef.current) {
        clearTimeout(pipelineTimeoutRef.current);
        pipelineTimeoutRef.current = null;
      }
    }
  }, [activeBookId, activeBook]);

  // ============ Handlers ============
  const addPipelineLog = (agent: string, text: string, type: LogType = 'info') => {
    usePipelineStore.getState().appendLog(agent, text, type);
  };

  // 1. Initialize Book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookForm.title.trim()) return;

    const newId = `book-${Date.now()}`;
    let resolvedBrief = newBookForm.brief;
    if (newBookForm.template !== 'none') {
      const p = WRITING_PROMPT_PRESETS.find((x) => x.name === newBookForm.template);
      if (p) resolvedBrief += ` \n(风格偏好: ${p.name}. 提示词: ${p.prompt})`;
    }

    const skeleton: BookProject = {
      id: newId,
      title: newBookForm.title,
      genre: newBookForm.genre,
      brief: newBookForm.brief || '正在由 AI 智子组装精彩的小说概念...',
      worldview: '🌌 Arcadia 智子大军正在搭建浩瀚的世界观结构，确立核心法则...',
      characters: [
        { name: '世界观架构师 (Lead Architect)', role: '核心智子', description: '正在建构浩瀚宏大的世界观规则与以太微光平衡机理...', skills: ['架构推演 (Simulation)'] },
        { name: '人设描绘师 (Character Designer)', role: '核心智子', description: '正在精心撰写 3 个拥有独特招式与背景设定的关键角色档案...', skills: ['神魂灌注 (Infusion)'] },
        { name: '大纲规划师 (Lead Planner)', role: '核心智子', description: '正在编撰 5 个章节的主线剧情与伏笔大纲，准备呈递人类导演...', skills: ['线索织网 (Webbing)'] },
      ],
      writingPrompt: newBookForm.customPrompt || '正在由 AI 精心雕琢专属文笔提示词...',
      chapters: [
        { number: 1, title: '第一章 正在孕育中...', summary: 'AI 智子大军正在铺设本章的世界线索与剧情交织点。', content: '', status: 'planning' },
      ],
      knowledgeBase: [
        { id: `kb-temp-1-${Date.now()}`, category: 'worldview', title: '智能体筑基中', content: '核心世界观规则与人设契约正在从星尘中凝结。' },
      ],
      currentChapterIndex: 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      isInitializing: true,
    };

    useBooksStore.getState().createBook(skeleton);
    useNewBookStore.getState().close();
    useWorkspaceStore.getState().setActiveBook(newId);
    useNewBookStore.getState().resetForm();
    useNewBookStore.getState().startInit(['[系统] 正在初始化 Arcadia 森林创作室...', '[规划智能体] 正在收集用户灵感碎片...']);

    const titleVal = newBookForm.title;
    const genreVal = newBookForm.genre;
    const briefVal = newBookForm.brief;
    const customPromptVal = newBookForm.customPrompt;

    try {
      const aiBookData = await bookApi.generateInit({ title: titleVal, genre: genreVal, brief: resolvedBrief });
      useNewBookStore.getState().appendLog('[人设智能体] 已完成 3 位核心角色的技能设定与背景档案编制！');
      useNewBookStore.getState().appendLog('[世界观智能体] 已确立独立宏大规则体系与以太生态机制！');
      useNewBookStore.getState().appendLog('[大纲智能体] 5 章节主线故事大纲编撰成功，准备交付人类导演！');

      setTimeout(() => {
        useBooksStore.getState().updateBook(newId, (b) => ({
          ...b,
          brief: briefVal || '由 AI 辅助初始化的精彩故事。',
          worldview: aiBookData.worldview,
          characters: (aiBookData.characters as Character[]).map((c) => ({
            ...c,
            skills: normalizeSkills(c.skills),
          })),
          writingPrompt: aiBookData.writingPrompt || customPromptVal || '整体文笔清新治愈，风格优美。',
          chapters: aiBookData.outline.map((ch) => ({
            number: ch.number,
            title: ch.title,
            summary: ch.summary,
            content: '',
            status: 'pending' as ChapterStatus,
          })),
          knowledgeBase: aiBookData.initialKnowledgeBase.map((kb, idx) => ({
            id: `kb-ai-${idx}-${Date.now()}`,
            category: kb.category as KBCategory,
            title: kb.title,
            content: kb.content,
          })),
          isInitializing: false,
        }));
        useNewBookStore.getState().finishInit();
      }, 1500);
    } catch (err: any) {
      const msg = err instanceof ApiError ? `[${err.code}] ${err.message}` : err.message || '未知错误';
      useNewBookStore.getState().appendLog(`[错误] 书籍构建失败: ${msg}`);
      // 移除骨架书(不留下空壳)+ 关闭 modal
      useBooksStore.getState().deleteBook(newId);
      useWorkspaceStore.getState().setActiveBook(null);
      useNewBookStore.getState().finishInit();
      useNewBookStore.getState().close();
    }
  };

  // 2. RUN PIPELINE STAGE
  const runNextPipelineStage = async (forcedStage?: any) => {
    if (!activeBook) return;
    const currentChapter = activeBook.chapters[activeBook.currentChapterIndex];
    if (!currentChapter) return;

    const pipeline = usePipelineStore.getState();
    const booksStore = useBooksStore.getState();
    const steeringStore = useSteeringStore.getState();
    const settingsStore = useSettingsStore.getState();

    pipeline.setRunning(true);
    pipeline.setSuggestedLore(null);
    if (pipelineTimeoutRef.current) {
      clearTimeout(pipelineTimeoutRef.current);
      pipelineTimeoutRef.current = null;
    }

    const stageToEvaluate: string = typeof forcedStage === 'string' ? forcedStage : currentStage;
    let nextStage: PipelineStepName = 'planning';
    if (stageToEvaluate === 'idle' || stageToEvaluate === 'review_done') {
      nextStage = 'planning';
      pipeline.setStage('planning');
      pipeline.clearLogs();
      addPipelineLog('系统', `▶️ 启动 Chapter ${currentChapter.number}《${currentChapter.title}》协同创作流水线。`, 'info');
      addPipelineLog('规划智能体 (Lead Planner)', '🧠 正在读取书籍大本营、知识库，并分析人类导演当前的干预指令...', 'info');
    } else if (stageToEvaluate === 'planning') {
      nextStage = 'drafting';
      pipeline.setStage('drafting');
      addPipelineLog('写作智子 (Lead Draftsmith)', '✍️ 大纲调整完毕！正在根据世界观法则与导演指定文风，撰写初稿中...', 'info');
    } else if (stageToEvaluate === 'drafting') {
      nextStage = 'reviewing';
      pipeline.setStage('reviewing');
      addPipelineLog('质量评审智子 (Lead Editor)', '🔬 初稿完成！正在对章节的角色人设一致性、以太物理设定及文风贴合度进行质量审核...', 'info');
    }

    try {
      // 防御:即使 store 没清洗干净,发请求前再规整一次,避免 server zod 拒掉
      const safeBook = normalizeBook(activeBook);
      const result = await agentApi.runPipelineStep({
        title: safeBook.title,
        genre: safeBook.genre,
        worldview: safeBook.worldview,
        characters: safeBook.characters,
        writingPrompt: activeBook.writingPrompt,
        chapters: activeBook.chapters,
        currentChapterIndex: activeBook.currentChapterIndex,
        stage: nextStage,
        steeringPrompt: steeringStore.input,
        knowledgeBase: activeBook.knowledgeBase,
        currentDraftContent: currentChapter.content,
        styleFilters: settingsStore.styleFilters,
      });

      if (nextStage === 'planning') {
        const plan = result as any;
        addPipelineLog('规划智子 (Lead Planner)', `✅ 大纲微调已完成。结合导演指令，本章将主要凸显 [${plan.activeContextHighlights?.join(', ') || '核心角色与环境'}]。`, 'success');
        addPipelineLog('规划思路', plan.thoughtProcess || '平滑融入干预，不影响整体主线大纲。', 'info');
        pipeline.setActiveHighlights(plan.activeContextHighlights || []);
        booksStore.updateActiveChapter(activeBookId!, activeBook.currentChapterIndex, {
          title: plan.refinedTitle || currentChapter.title,
          summary: plan.refinedSummary || currentChapter.summary,
          status: 'planning',
          scenes: plan.scenes || [],
          activeContextHighlights: plan.activeContextHighlights || [],
        });
      } else if (nextStage === 'drafting') {
        const draft = result as any;
        addPipelineLog('写作智子 (Lead Draftsmith)', `📝 原始草稿撰写完毕（约 ${draft.content?.length || 0} 字）。已将特定剧情伏笔完美编织进段落中。`, 'success');
        booksStore.updateActiveChapter(activeBookId!, activeBook.currentChapterIndex, { content: draft.content || '', status: 'drafting' });
      } else if (nextStage === 'reviewing') {
        const review = result as any;
        addPipelineLog('质量评审智子 (Lead Editor)', `📊 质量初评：${review.score}分。${review.critique}`, 'critique');
        addPipelineLog('质量评审智子 (Lead Editor)', '✨ 抛光润色已完成。剧情逻辑和词藻调性已优化完毕！', 'success');
        booksStore.updateActiveChapter(activeBookId!, activeBook.currentChapterIndex, { content: review.polishedContent || '', status: 'completed' });
        pipeline.setStage('review_done');
        pipeline.setRunning(false);
        triggerLoreExtraction(review.polishedContent || '', currentChapter.title);
        triggerRollingOutline(review.polishedContent || '');
      }

      if (nextStage !== 'reviewing') {
        pipelineTimeoutRef.current = setTimeout(() => {
          if (usePipelineStore.getState().isRunning) runNextPipelineStage(nextStage);
        }, 3000);
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? `[${err.code}] ${err.message}` : err.message || '未知错误';
      addPipelineLog('系统', `⚠️ 智能体计算节点异常: ${msg}。进入人工干预紧急备份模式。`, 'warn');
      pipeline.setRunning(false);
      if (pipelineTimeoutRef.current) {
        clearTimeout(pipelineTimeoutRef.current);
        pipelineTimeoutRef.current = null;
      }
    }
  };

  const triggerRollingOutline = async (_completedText: string) => {
    if (!activeBook || !activeBookId) return;
    const pipeline = usePipelineStore.getState();
    const booksStore = useBooksStore.getState();
    pipeline.setRollingOutline(true);
    addPipelineLog('大纲智子 (Outline Agent)', '🧠 启动【长篇滚动大纲规划 (Rolling Outline)】...', 'info');
    addPipelineLog('大纲智子 (Outline Agent)', '⚖️ 正在深度剖析刚生成的章节正文，推演未完结章节的发展逻辑...', 'info');

    try {
      const safeBook2 = normalizeBook(activeBook);
      const result = await agentApi.rollOutline({
        title: safeBook2.title, genre: safeBook2.genre, worldview: safeBook2.worldview,
        characters: safeBook2.characters, writingPrompt: safeBook2.writingPrompt,
        chapters: safeBook2.chapters, currentChapterIndex: safeBook2.currentChapterIndex,
        knowledgeBase: safeBook2.knowledgeBase,
      });

      if (result.updatedChapters && result.updatedChapters.length > 0) {
        addPipelineLog('大纲智子 (Outline Agent)', `🎯 长篇滚动规划推演成功！已结合本章进展，对后续 ${result.updatedChapters.length} 个章节完成无缝大纲平滑重构：`, 'success');
        result.updatedChapters.forEach((ch) => {
          addPipelineLog('大纲智子 (Outline Agent)', `📖 [第 ${ch.number} 章《${ch.title}》] 修正后新走向: "${ch.summary}"`, 'info');
        });
        booksStore.updateBook(activeBookId, (b) => {
          const updatedChapters = b.chapters.map((originalCh) => {
            const matched = result.updatedChapters.find((u) => u.number === originalCh.number);
            return matched ? { ...originalCh, title: matched.title, summary: matched.summary } : originalCh;
          });
          return { ...b, chapters: updatedChapters };
        });
      } else {
        addPipelineLog('大纲智子 (Outline Agent)', '🍂 本章已是全书最终章，本次滚动规划无需对后文进行大纲重塑。', 'success');
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? `[${err.code}] ${err.message}` : err.message || '未知错误';
      addPipelineLog('大纲智子 (Outline Agent)', `⚠️ 滚动大纲协同节点超时: ${msg}。`, 'warn');
    } finally {
      pipeline.setRollingOutline(false);
      // Auto-pilot:本章审校 + 滚动大纲都跑完后,自动跳到下一章继续
      scheduleAutoAdvance();
    }
  };

  /**
   * Auto-pilot 调度:开启时,本章跑完后自动切到下一章并继续跑。
   * 直到最后一章或用户主动叫停 / 切换章节。
   */
  const scheduleAutoAdvance = () => {
    if (!usePipelineStore.getState().isAutoPilot) return;
    if (!activeBookId) return;
    // 拿最新的 book(rolling outline 刚更新过 chapters)
    const book = useBooksStore.getState().getBook(activeBookId);
    if (!book) return;

    const nextIdx = book.currentChapterIndex + 1;
    if (nextIdx >= book.chapters.length) {
      addPipelineLog('系统', '🎉 全书所有章节已协同完成!已自动关闭 Auto-Pilot。', 'success');
      usePipelineStore.getState().setAutoPilot(false);
      return;
    }
    const nextCh = book.chapters[nextIdx];
    if (nextCh.status === 'completed') {
      addPipelineLog('系统', `⏭️ 第 ${nextCh.number} 章已存在正文,跳过,继续。`, 'info');
      useBooksStore.getState().setCurrentChapter(activeBookId, nextIdx);
      // 递归调度,可能还有更多已完成章节
      pipelineTimeoutRef.current = setTimeout(scheduleAutoAdvance, 1500);
      return;
    }

    addPipelineLog('系统', `🚀 Auto-Pilot 启动:跳转到第 ${nextCh.number} 章《${nextCh.title}》继续创作。`, 'info');
    useBooksStore.getState().setCurrentChapter(activeBookId, nextIdx);
    usePipelineStore.getState().setStage('idle');
    usePipelineStore.getState().clearLogs();
    usePipelineStore.getState().setActiveHighlights([]);
    usePipelineStore.getState().setSuggestedLore(null);

    pipelineTimeoutRef.current = setTimeout(() => {
      runNextPipelineStage();
    }, 1500);
  };

  /**
   * 切换 Auto-Pilot:开启时立即从当前章节开始;关闭时仅停开关不打断当前跑流。
   */
  const handleAutoPilotToggle = () => {
    const wasOn = usePipelineStore.getState().isAutoPilot;
    if (wasOn) {
      usePipelineStore.getState().setAutoPilot(false);
      addPipelineLog('人类导演 (You)', '🛑 Auto-Pilot 已关闭,当前章节跑完后停止自动跳转。', 'warn');
      return;
    }
    if (!activeBook) return;
    usePipelineStore.getState().setAutoPilot(true);
    addPipelineLog('系统', '✈️ Auto-Pilot 已开启:从当前章节起,跑完自动跳下一章,直到全书完成。', 'info');
    // 如果当前 idle,立刻启动
    if (usePipelineStore.getState().currentStage === 'idle') {
      runNextPipelineStage();
    }
  };

  const handlePausePipeline = () => {
    const pipeline = usePipelineStore.getState();
    pipeline.setRunning(false);
    pipeline.setAutoPilot(false);
    if (pipelineTimeoutRef.current) {
      clearTimeout(pipelineTimeoutRef.current);
      pipelineTimeoutRef.current = null;
    }
    addPipelineLog('人类导演 (You)', '⏸️ 手动叫停了后台智能体自动流水线。', 'warn');
  };

  const handleApplySteering = () => {
    if (!steeringInput.trim()) return;
    useSteeringStore.getState().apply(steeringInput);
    addPipelineLog('人类导演 (You)', `🎯 注入新的导演命令："${steeringInput}"`, 'info');
    addPipelineLog('系统', '🔄 智能体工作流已被导演指示重构，点击「继续协同写书」重新运行规划与创作。', 'warn');
    usePipelineStore.getState().setStage('idle');
  };

  const handleRewriteFromHere = () => {
    if (!activeBook || !activeBookId) return;
    if (!window.confirm('确定要【从此处重写】吗？')) return;
    if (pipelineTimeoutRef.current) {
      clearTimeout(pipelineTimeoutRef.current);
      pipelineTimeoutRef.current = null;
    }
    const startIdx = activeBook.currentChapterIndex;
    useBooksStore.getState().updateBook(activeBookId, (b) => ({
      ...b,
      chapters: b.chapters.map((ch, idx) =>
        idx >= startIdx ? { ...ch, content: idx === startIdx ? ch.content : '', status: 'pending' as ChapterStatus } : ch,
      ),
    }));
    usePipelineStore.getState().setStage('idle');
    usePipelineStore.getState().setRunning(false);
    usePipelineStore.getState().clearLogs();
    usePipelineStore.getState().setActiveHighlights([]);
    addPipelineLog('系统', `🧹 已重置从 Chapter ${activeBook.chapters[startIdx].number} 开始的后续所有章节。`, 'warn');
  };

  const triggerLoreExtraction = async (content: string, titleStr: string) => {
    if (!activeBook || !activeBookId) return;
    usePipelineStore.getState().setExtractingLore(true);
    try {
      const safeBook3 = normalizeBook(activeBook);
      const kbSuggest = await bookApi.suggestKbEntry({
        title: safeBook3.title, worldview: safeBook3.worldview, characters: safeBook3.characters,
        chapterContent: content, chapterTitle: titleStr,
      });
      usePipelineStore.getState().setSuggestedLore(kbSuggest);
      if (useSettingsStore.getState().autoAcceptLore && kbSuggest.title) {
        const newKb: KBEntry = {
          id: `kb-suggest-${Date.now()}`,
          category: kbSuggest.category,
          title: kbSuggest.title,
          content: kbSuggest.content,
        };
        useBooksStore.getState().appendKnowledgeBase(activeBookId, newKb);
        addPipelineLog('知识库', `📚 自动归档新设定 [${newKb.title}]！`, 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      usePipelineStore.getState().setExtractingLore(false);
    }
  };

  const handleAcceptSuggestedLore = () => {
    if (!activeBookId || !suggestedLore) return;
    const newKb: KBEntry = {
      id: `kb-suggest-${Date.now()}`,
      category: suggestedLore.category,
      title: suggestedLore.title,
      content: suggestedLore.content,
    };
    useBooksStore.getState().appendKnowledgeBase(activeBookId, newKb);
    usePipelineStore.getState().setSuggestedLore(null);
    addPipelineLog('知识库', `📚 归档新设定 [${newKb.title}]！`, 'success');
  };

  const handleSaveWorldview = (v: string) => {
    if (!activeBookId) return;
    useBooksStore.getState().updateBook(activeBookId, (b) => ({ ...b, worldview: v }));
  };

  const handleSavePrompt = (v: string) => {
    if (!activeBookId) return;
    useBooksStore.getState().updateBook(activeBookId, (b) => ({ ...b, writingPrompt: v }));
  };

  const handleOpenAddKb = () => useDialogStore.getState().openKbDialog();
  const handleEditKb = (id: string) => {
    const entry = useBooksStore.getState().books.find((b) => b.id === activeBookId)?.knowledgeBase.find((k) => k.id === id);
    if (!entry) return;
    useDialogStore.getState().openKbDialog(id);
    useDialogStore.getState().setKbForm({ title: entry.title, category: entry.category, content: entry.content });
  };
  const handleDeleteKb = (id: string) => {
    if (!activeBookId) return;
    if (!window.confirm('确定要删除这条知识库设定吗？')) return;
    useBooksStore.getState().updateBook(activeBookId, (b) => ({
      ...b,
      knowledgeBase: b.knowledgeBase.filter((kb) => kb.id !== id),
    }));
  };
  const handleSaveKb = (form: { title: string; category: KBCategory; content: string }) => {
    if (!activeBookId) return;
    const editingId = useDialogStore.getState().editingKbId;
    if (editingId) {
      useBooksStore.getState().updateBook(activeBookId, (b) => ({
        ...b,
        knowledgeBase: b.knowledgeBase.map((kb) => (kb.id === editingId ? { ...kb, ...form } : kb)),
      }));
    } else {
      useBooksStore.getState().appendKnowledgeBase(activeBookId, { id: `kb-${Date.now()}`, ...form });
    }
    useDialogStore.getState().closeKbDialog();
  };

  const handleOpenAddChar = () => useDialogStore.getState().openCharDialog();
  const handleAddCharacter = (form: { name: string; role: string; description: string; skillInput: string }) => {
    if (!activeBookId) return;
    const skills = form.skillInput ? form.skillInput.split(',').map((s) => s.trim()).filter(Boolean) : [];
    useBooksStore.getState().addCharacter(activeBookId, {
      name: form.name, role: form.role, description: form.description, skills,
    });
    useDialogStore.getState().closeCharDialog();
    addPipelineLog('系统', `👤 新增角色 [${form.name}]`, 'success');
  };
  const handleDeleteCharacter = (charName: string) => {
    if (!activeBookId) return;
    if (!window.confirm(`确定要彻底删除角色 [${charName}] 吗？`)) return;
    useBooksStore.getState().removeCharacter(activeBookId, charName);
    addPipelineLog('人设智能体', `👤 已下线角色 [${charName}]`, 'warn');
  };
  const handleGenerateSkill = async (charName: string) => {
    if (!activeBook || !activeBookId) return;
    const detail = window.prompt(`请描述你想要为 ${charName} 创造的新技能灵感：`);
    if (detail === null) return;
    addPipelineLog('人设智能体', `✨ 正在为 [${charName}] 雕琢专属技能...`, 'info');
    try {
      const skill = await bookApi.generateElement({
        type: 'character-skill', title: activeBook.title, worldview: activeBook.worldview,
        detail: `角色: ${charName}. 灵感: ${detail}`,
      });
      useBooksStore.getState().appendSkillToCharacter(activeBookId, charName, `${skill.title} (${skill.description})`);
      addPipelineLog('人设智能体', `✅ [${charName}] 领悟了新技能: [${skill.title}]!`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeChapter = (idx: number) => {
    if (!activeBookId) return;
    // 用户主动切章节,Auto-Pilot 关闭(避免切回去又被自动跳走)
    usePipelineStore.getState().setAutoPilot(false);
    useBooksStore.getState().setCurrentChapter(activeBookId, idx);
    usePipelineStore.getState().setStage('idle');
    usePipelineStore.getState().clearLogs();
    usePipelineStore.getState().setActiveHighlights([]);
    usePipelineStore.getState().setSuggestedLore(null);
    usePipelineStore.getState().setRunning(false);
    if (pipelineTimeoutRef.current) {
      clearTimeout(pipelineTimeoutRef.current);
      pipelineTimeoutRef.current = null;
    }
  };

  const handleOpenExport = () => useDialogStore.getState().openExport();
  const handleDismissLore = () => usePipelineStore.getState().setSuggestedLore(null);

  // ============ Handlers → WorkspaceHandlers(适配 WorkspacePage 的 props 形态) ============
  const workspaceHandlers: WorkspaceHandlers = {
    onRunNext: () => runNextPipelineStage(),
    onPause: handlePausePipeline,
    onApplySteering: handleApplySteering,
    onRewriteFromHere: handleRewriteFromHere,
    onLog: addPipelineLog,
    onOpenExport: handleOpenExport,
    onOpenAddChar: handleOpenAddChar,
    onAddCharacter: handleAddCharacter,
    onDeleteCharacter: handleDeleteCharacter,
    onGenerateSkill: handleGenerateSkill,
    onSaveWorldview: handleSaveWorldview,
    onSavePrompt: handleSavePrompt,
    onAddKb: handleOpenAddKb,
    onEditKb: handleEditKb,
    onDeleteKb: handleDeleteKb,
    onSaveKb: handleSaveKb,
    onAcceptLore: handleAcceptSuggestedLore,
    onDismissLore: handleDismissLore,
    onChangeChapter: handleChangeChapter,
    onToggleAutoPilot: handleAutoPilotToggle,
  };

  // ============ 渲染 ============
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] flex flex-col h-screen overflow-hidden antialiased">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-[#F0EBE3] bg-white shrink-0 shadow-[0_1px_3px_rgba(120,142,118,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#788E76] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(120,142,118,0.2)]">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#4A5A48] tracking-tight">Arcadia AI</h1>
              <Tag tone="sage" size="sm" className="font-medium">SaaS Beta</Tag>
            </div>
            <p className="text-[9px] text-gray-400 tracking-wider uppercase">Multi-Agent Creative Studio</p>
          </div>
        </div>

        {activeBook && (
          <div className="hidden md:flex items-center gap-2 bg-[#F4F1EC] p-1 px-3 rounded-full text-xs">
            <span className="font-semibold text-[#4A5A48]">{activeBook.title}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 italic">{activeBook.genre}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex bg-[#FAF9F6] p-1 rounded-lg border border-gray-100 gap-1 text-xs">
            <Button
              variant={!activeBookId ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveBookId(null)}
              className={!activeBookId ? 'shadow-sm' : 'text-gray-500 hover:text-gray-800'}
            >
              我的书架
            </Button>
            {activeBookId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab(activeTab === 'soul' ? 'kb' : 'soul')}
                icon={<Sliders className="w-3.5 h-3.5" />}
                className="bg-white text-[#788E76] border border-gray-100 shadow-sm font-medium"
              >
                切换视图: {activeTab === 'soul' ? '灵魂大本营' : '一书一知识库'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 border-l border-gray-200 pl-4">
            <Clock className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-mono">2026-07-16 UTC</span>
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden">
        {!activeBookId || !activeBook ? (
          <BookshelfPage />
        ) : (
          <WorkspacePage book={activeBook} handlers={workspaceHandlers} />
        )}
      </div>

      {/* === Global Dialogs === */}
      <NewBookDialog onSubmit={handleCreateBook} />
      <AddCharacterDialog onSubmit={handleAddCharacter} />
      {activeBook && <ExportBookDialog book={activeBook} />}
    </div>
  );
}
