/**
 * KB Entry Dialog - 新增/编辑知识库条目
 */

import { useDialogStore } from '../../stores';
import { Dialog, TextField, Select, Button, type SelectOption } from '../../components';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'worldview', label: '世界观设定 / 规则约束' },
  { value: 'characters', label: '角色档案 / 人际契约' },
  { value: 'timeline', label: '大事记 / 已发生时间轴' },
];

interface Props {
  onSubmit: (form: { title: string; category: 'worldview' | 'characters' | 'timeline'; content: string }) => void;
}

export function KbEntryDialog({ onSubmit }: Props) {
  const isOpen = useDialogStore((s) => s.isAddKbOpen);
  const close = useDialogStore((s) => s.closeKbDialog);
  const form = useDialogStore((s) => s.kbForm);
  const setForm = useDialogStore((s) => s.setKbForm);
  const editingId = useDialogStore((s) => s.editingKbId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    onSubmit(form);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={close}
      size="md"
      title={editingId ? '编辑知识库条目' : '新建知识库独立设定'}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Select
          label="条目分类"
          value={form.category}
          onChange={(v) => setForm({ category: v as 'worldview' | 'characters' | 'timeline' })}
          options={CATEGORY_OPTIONS}
        />
        <TextField
          label="条目核心名称"
          value={form.title}
          onChange={(v) => setForm({ title: v })}
          placeholder="例如：《以太潮汐规律》、《凯恩的隐藏身份》"
          required
        />
        <TextField
          label="设定详细内容"
          value={form.content}
          onChange={(v) => setForm({ content: v })}
          placeholder="具体描述该设定的详细逻辑或限制条件..."
          required
          variant="textarea"
          rows={6}
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close} className="flex-1">
            取消
          </Button>
          <Button type="submit" variant="primary" className="flex-1 bg-[#D4B996] text-[#5D4A31] hover:opacity-90">
            归档至知识库
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
