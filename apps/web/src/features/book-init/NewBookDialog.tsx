/**
 * New Book Dialog - 新建书籍对话框
 *
 * 包含:表单 + 初始化进度展示
 */

import { Feather, RefreshCw, Sparkles, X } from 'lucide-react';
import { useNewBookStore } from '../../stores';
import { WRITING_PROMPT_PRESETS } from '@arcadia/shared';
import { Dialog, TextField, Select, type SelectOption, Button } from '../../components';

interface NewBookDialogProps {
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
}

export function NewBookDialog({ onSubmit }: NewBookDialogProps) {
  const isOpen = useNewBookStore((s) => s.isOpen);
  const close = useNewBookStore((s) => s.close);
  const form = useNewBookStore((s) => s.form);
  const updateField = useNewBookStore((s) => s.updateField);
  const isInitializing = useNewBookStore((s) => s.isInitializing);
  const initLogs = useNewBookStore((s) => s.initLogs);

  const templateOptions: SelectOption[] = [
    { value: 'none', label: '自定义 / 无特定模板' },
    ...WRITING_PROMPT_PRESETS.map((p) => ({ value: p.name, label: p.name })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    void onSubmit(e);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => !isInitializing && close()}
      size="lg"
      disableClose={isInitializing}
    >
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#788E76]/10 flex items-center justify-center text-[#788E76]">
            <Feather className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-[#4A5A48] font-serif">新建 Arcadia 协同创作书籍</h3>
        </div>
        <button
          onClick={() => !isInitializing && close()}
          disabled={isInitializing}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isInitializing ? (
        <div className="py-12 space-y-4 text-center">
          <RefreshCw className="w-10 h-10 text-[#788E76] animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-700">正在生成书籍灵魂大本营...</h4>
            <p className="text-xs text-gray-400">大纲智能体、人设智能体、世界观大师协同建构中</p>
          </div>
          <div className="max-w-xs mx-auto text-[10px] font-mono text-left bg-gray-50 p-3 rounded-lg border border-gray-100 h-24 overflow-y-auto custom-scroll space-y-1">
            {initLogs.map((log, lIdx) => (
              <div key={lIdx} className="text-gray-500">{log}</div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="书籍名称"
            value={form.title}
            onChange={(v) => updateField('title', v)}
            placeholder="例如：《绿野蒸汽仙踪》、《桃源引力井》"
            required
          />
          <TextField
            label="流派风格 (小说基调)"
            value={form.genre}
            onChange={(v) => updateField('genre', v)}
            placeholder="例如：治愈系 / 蒸汽朋克 / 奇幻史诗 / 悬疑惊悚"
          />
          <Select
            label="专属提示词文风模板 (SaaS 内置)"
            value={form.template}
            onChange={(v) => updateField('template', v)}
            options={templateOptions}
            className="text-xs p-2 bg-[#FAF9F6] border border-gray-200 rounded-lg outline-none focus:border-[#788E76]"
          />
          <TextField
            label="灵感来源与书籍大纲 (书籍灵魂种子)"
            value={form.brief}
            onChange={(v) => updateField('brief', v)}
            placeholder="写下几句您的小说想法或开篇灵感..."
            required
            variant="textarea"
            rows={4}
          />

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={close} className="flex-1">
              取消
            </Button>
            <Button type="submit" variant="primary" className="flex-1" icon={<Sparkles className="w-3.5 h-3.5 spark-glow" />}>
              建立书籍并生成灵魂
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
