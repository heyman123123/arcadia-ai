/**
 * Add Character Dialog
 */

import { useDialogStore } from '../../stores';
import { Dialog, TextField, Select, Button, type SelectOption } from '../../components';

const ROLE_OPTIONS: SelectOption[] = [
  { value: '主角', label: '主角' },
  { value: '重要配角', label: '重要配角' },
  { value: '反派', label: '反派' },
  { value: '背景角色', label: '背景人物' },
];

interface Props {
  onSubmit: (form: { name: string; role: string; description: string; skillInput: string }) => void;
}

export function AddCharacterDialog({ onSubmit }: Props) {
  const isOpen = useDialogStore((s) => s.isAddCharOpen);
  const close = useDialogStore((s) => s.closeCharDialog);
  const form = useDialogStore((s) => s.charForm);
  const setForm = useDialogStore((s) => s.setCharForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;
    onSubmit(form);
  };

  return (
    <Dialog isOpen={isOpen} onClose={close} size="md" title="新增角色至人设大本营">
      <form onSubmit={handleSubmit} className="space-y-3">
        <TextField
          label="角色名字"
          value={form.name}
          onChange={(v) => setForm({ name: v })}
          placeholder="例如：修尔 (Shure)"
          required
        />
        <Select
          label="角色定位"
          value={form.role}
          onChange={(v) => setForm({ role: v })}
          options={ROLE_OPTIONS}
        />
        <TextField
          label="角色小传与格调"
          value={form.description}
          onChange={(v) => setForm({ description: v })}
          placeholder="描写角色的外貌、身世来历或执念..."
          required
          variant="textarea"
          rows={4}
        />
        <TextField
          label="特色动作 / 专属魔招 (英文半角逗号分隔)"
          value={form.skillInput}
          onChange={(v) => setForm({ skillInput: v })}
          placeholder="例如：流沙隐形 (Sand Hide), 烈风斩"
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close} className="flex-1">
            取消
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            加入角色
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
