/**
 * Steering Panel - 导演干预面板
 */

import { Sliders } from 'lucide-react';
import { useSteeringStore } from '../../stores';
import { Card, Button, Tag } from '../../components';

interface Props {
  onApply: () => void;
  onRewriteFromHere: () => void;
}

export function SteeringPanel({ onApply, onRewriteFromHere }: Props) {
  const input = useSteeringStore((s) => s.input);
  const setInput = useSteeringStore((s) => s.setInput);
  const lastApplied = useSteeringStore((s) => s.lastApplied);

  return (
    <Card className="mt-auto border-2 border-[#788E76] space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#788E76] uppercase tracking-widest flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5" />
          导演干预面板 (Steering)
        </h4>
        <Tag tone="rose" size="sm" className="font-bold">
          断点干预已就绪
        </Tag>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="在此处输入对智能体的干预指令，例如：'让艾琳娜看穿凯恩的伪装，用圣光驱散他剑刃上的诅咒，揭示凯恩的隐忍与温情'..."
        className="w-full h-20 text-xs p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#788E76] bg-[#FDFBF7] resize-none"
      />

      <div className="flex gap-2">
        <Button
          onClick={onApply}
          disabled={!input.trim()}
          variant="primary"
          className="flex-1"
        >
          注入干预并推演
        </Button>
        <Button
          onClick={onRewriteFromHere}
          variant="secondary"
          icon={<Sliders className="w-3.5 h-3.5 rotate-180" />}
          title="清除本章及后续章节内容，并强制AI基于最新剧情修改和当前的导演干预重新写书"
        >
          从此处重写
        </Button>
      </div>

      {lastApplied && (
        <div className="text-[10px] text-gray-400 italic flex items-center gap-0.5">
          <span>当前生效干预:</span>
          <span className="truncate max-w-[160px] font-bold text-gray-600" title={lastApplied}>
            {lastApplied}
          </span>
        </div>
      )}
    </Card>
  );
}
