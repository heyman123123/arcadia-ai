/**
 * Worldview Section - 灵魂大本营 · 世界观编辑
 */

import { useEffect } from 'react';
import { Compass, Edit3, Check, X } from 'lucide-react';
import { useEditingStore } from '../../stores';
import { Card, Button } from '../../components';

interface Props {
  worldview: string;
  onSave: (newValue: string) => void;
  onLog: (msg: string) => void;
}

export function WorldviewSection({ worldview, onSave, onLog }: Props) {
  const isEditing = useEditingStore((s) => s.isEditingWorldview);
  const draft = useEditingStore((s) => s.worldviewDraft);
  const setEditing = useEditingStore((s) => s.setEditingWorldview);
  const setDraft = useEditingStore((s) => s.setWorldviewDraft);

  // 进入编辑时同步最新值
  useEffect(() => {
    if (isEditing) setDraft(worldview);
  }, [isEditing, worldview, setDraft]);

  const onSaveClick = () => {
    onSave(draft);
    setEditing(false);
    onLog('💾 世界观最新设定保存并更新至灵魂大本营！');
  };

  const onCancel = () => {
    setDraft(worldview);
    setEditing(false);
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-[#788E76]" />
          世界观设定
        </h4>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} icon={<Edit3 className="w-3 h-3" />}>
            编辑
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
            <Button variant="ghost" size="sm" onClick={onCancel} icon={<X className="w-3 h-3" />}>
              取消
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full h-32 text-xs p-2 border border-gray-200 rounded-lg outline-none focus:border-[#788E76]"
        />
      ) : (
        <p className="text-xs text-gray-600 leading-relaxed bg-[#FAF9F6] p-2.5 rounded-lg border border-dashed border-gray-100 italic">
          {worldview}
        </p>
      )}
    </Card>
  );
}
