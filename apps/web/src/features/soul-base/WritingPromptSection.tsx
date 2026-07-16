/**
 * Writing Prompt Section - 灵魂大本营 · 写作提示词
 */

import { useEffect } from 'react';
import { Feather, Edit3, Check, X } from 'lucide-react';
import { WRITING_PROMPT_PRESETS } from '@arcadia/shared';
import { useEditingStore } from '../../stores';
import { Card, Button } from '../../components';

interface Props {
  writingPrompt: string;
  onSave: (v: string) => void;
  onLog: (msg: string) => void;
}

export function WritingPromptSection({ writingPrompt, onSave, onLog }: Props) {
  const isEditing = useEditingStore((s) => s.isEditingPrompt);
  const draft = useEditingStore((s) => s.promptDraft);
  const setEditing = useEditingStore((s) => s.setEditingPrompt);
  const setDraft = useEditingStore((s) => s.setPromptDraft);

  useEffect(() => {
    if (isEditing) setDraft(writingPrompt);
  }, [isEditing, writingPrompt, setDraft]);

  const onSaveClick = () => {
    onSave(draft);
    setEditing(false);
    onLog('💾 专属写作提示词（导演 Prompt）修改成功！');
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <Feather className="w-3.5 h-3.5 text-[#D4B996]" />
          专属写作提示词
        </h4>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} icon={<Edit3 className="w-3 h-3" />}>
            修改
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveClick}
              icon={<Check className="w-3 h-3" />}
              className="text-emerald-600 hover:bg-emerald-50"
            >
              保存
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(writingPrompt);
                setEditing(false);
              }}
              icon={<X className="w-3 h-3" />}
            >
              取消
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-32 text-xs p-2 border border-gray-200 rounded-lg outline-none focus:border-[#788E76]"
          />
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 block">加载文风模板:</span>
            <div className="grid grid-cols-2 gap-1">
              {WRITING_PROMPT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setDraft(p.prompt)}
                  className="text-[9px] bg-gray-50 border border-gray-100 hover:bg-[#788E76]/5 p-1 rounded text-left truncate"
                >
                  🎨 {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 leading-relaxed bg-[#FAF9F6] p-2.5 rounded-lg border border-dashed border-gray-100">
          {writingPrompt}
        </p>
      )}
    </Card>
  );
}
