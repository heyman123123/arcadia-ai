/**
 * Soul Base Panel - 灵魂大本营主面板
 *
 * 包含 4 个 section:世界观 / 角色 / 写作提示词 / 文风精修
 *
 * 父组件传入 activeBook + 一组 handler(后续可改成 context)
 */

import type { BookProject } from '@arcadia/shared';
import { WorldviewSection } from './WorldviewSection';
import { CharacterSection } from './CharacterSection';
import { WritingPromptSection } from './WritingPromptSection';
import { StyleFiltersSection } from './StyleFiltersSection';

export interface SoulBaseHandlers {
  onSaveWorldview: (v: string) => void;
  onSavePrompt: (v: string) => void;
  onAddCharacter: () => void;
  onDeleteCharacter: (name: string) => void;
  onGenerateSkill: (name: string) => void;
  onLog: (msg: string) => void;
}

interface Props {
  book: BookProject;
  handlers: SoulBaseHandlers;
}

export function SoulBasePanel({ book, handlers }: Props) {
  return (
    <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-6">
      <WorldviewSection
        worldview={book.worldview}
        onSave={handlers.onSaveWorldview}
        onLog={handlers.onLog}
      />
      <CharacterSection
        characters={book.characters}
        onAdd={handlers.onAddCharacter}
        onDelete={handlers.onDeleteCharacter}
        onGenerateSkill={handlers.onGenerateSkill}
      />
      <WritingPromptSection
        writingPrompt={book.writingPrompt}
        onSave={handlers.onSavePrompt}
        onLog={handlers.onLog}
      />
      <StyleFiltersSection />
    </div>
  );
}
