/**
 * Character Section - 灵魂大本营 · 角色档案
 */

import { UserPlus, Trash2, Sparkles } from 'lucide-react';
import type { Character } from '@arcadia/shared';
import { Card, Button, Tag } from '../../components';

interface Props {
  characters: Character[];
  onAdd: () => void;
  onDelete: (name: string) => void;
  onGenerateSkill: (name: string) => void;
}

export function CharacterSection({ characters, onAdd, onDelete, onGenerateSkill }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <UserPlus className="w-3.5 h-3.5 text-[#788E76]" />
          人设大本营
        </h4>
        <Button variant="secondary" size="sm" onClick={onAdd} className="text-[#788E76] border-[#788E76]/20">
          + 新增角色
        </Button>
      </div>

      <div className="space-y-3">
        {characters.map((char, index) => (
          <Card key={index} className="space-y-2 relative group/char">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">{char.name}</span>
              <div className="flex items-center gap-1.5">
                <Tag tone="amber">{char.role}</Tag>
                <button
                  onClick={() => onDelete(char.name)}
                  className="text-gray-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"
                  title="删除角色"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">{char.description}</p>

            {/* Skills */}
            <div className="space-y-1.5 pt-2 border-t border-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">专属动作 / 战斗招式</span>
                <button
                  onClick={() => onGenerateSkill(char.name)}
                  className="text-[9px] text-[#D4B996] hover:underline flex items-center gap-0.5"
                  title="结合世界观与AI自动编制一个极其贴切的特技名称及文笔描述"
                >
                  <Sparkles className="w-2.5 h-2.5" /> AI自动技能
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {char.skills?.map((sk, skIdx) => (
                  <Tag key={skIdx} tone="emerald" className="leading-none max-w-full truncate" title={sk}>
                    ⚡ {sk}
                  </Tag>
                ))}
                {(!char.skills || char.skills.length === 0) && (
                  <span className="text-[10px] text-gray-300 italic">暂无技能</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
