/**
 * WorkflowProgress - 顶部流水线进度
 */

import { Check, ChevronRight, Activity, Pause, Play } from 'lucide-react';
import { Button } from '../../components';
import { usePipelineStore } from '../../stores';
import type { ChapterStatus } from '@arcadia/shared';

const STEPS: Array<{ key: ChapterStatus; label: string }> = [
  { key: 'planning', label: '规划大纲' },
  { key: 'drafting', label: '初稿撰写' },
  { key: 'reviewing', label: '质量评审' },
  { key: 'completed', label: '正式提交' },
];

interface Props {
  chapterStatus: ChapterStatus;
  onRunNext: () => void;
  onPause: () => void;
}

export function WorkflowProgress({ chapterStatus, onRunNext, onPause }: Props) {
  const isRunning = usePipelineStore((s) => s.isRunning);
  const stage = usePipelineStore((s) => s.currentStage);
  const isIdle = stage === 'idle';

  return (
    <div className="h-14 px-6 border-b border-[#F0EBE3] flex items-center justify-between bg-[#FDFBF7] shrink-0">
      <div className="flex gap-2 items-center text-xs overflow-x-auto custom-scroll pr-4">
        {STEPS.map((step, idx) => {
          let cls = 'text-gray-400 bg-gray-50 border border-gray-100';
          if (chapterStatus === step.key || (step.key === 'completed' && chapterStatus === 'completed')) {
            cls = 'bg-[#788E76] text-white font-bold shadow-sm ring-2 ring-[#788E76]/20';
          } else if (
            (step.key === 'planning' && ['planning', 'drafting', 'reviewing', 'completed'].includes(chapterStatus)) ||
            (step.key === 'drafting' && ['drafting', 'reviewing', 'completed'].includes(chapterStatus)) ||
            (step.key === 'reviewing' && ['reviewing', 'completed'].includes(chapterStatus))
          ) {
            cls = 'text-[#788E76] bg-[#788E76]/10 border border-[#788E76]/20 font-medium';
          }
          return (
            <div key={step.key} className="flex items-center">
              <div className={`px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 shrink-0 ${cls}`}>
                {chapterStatus === 'completed' && step.key !== 'completed' ? <Check className="w-3 h-3" /> : null}
                {step.label}
              </div>
              {idx < STEPS.length - 1 && <ChevronRight className="w-3 text-gray-300 shrink-0 mx-1" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {isRunning ? (
          <div className="flex items-center gap-2 bg-[#F0F2EF] px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-[#788E76] animate-ping"></span>
            <span className="text-xs font-semibold text-[#788E76] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              智能体协同跑流中...
            </span>
            <button
              onClick={onPause}
              className="text-red-500 hover:text-red-700 ml-2 p-0.5 rounded-md hover:bg-red-50 transition-colors"
              title="紧急叫停自动流程"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          </div>
        ) : (
          <Button onClick={onRunNext} icon={<Play className="w-3.5 h-3.5 fill-current" />}>
            {isIdle ? '开启本章智能体创作' : '继续协同写书'}
          </Button>
        )}
      </div>
    </div>
  );
}
