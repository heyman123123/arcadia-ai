/**
 * AgentStatusBoard - 智能体三宫格状态
 */

import { usePipelineStore } from '../../stores';
import { Card } from '../../components';

const AGENTS = [
  { key: 'planning' as const, label: '大纲智子 (Planner)', desc: '负责读取独立设定、融合人类导演即时干预,滚动推演后续大纲。', runLabel: '分析指令中', idleLabel: '就绪' },
  { key: 'drafting' as const, label: '写作智子 (Draftsmith)', desc: '精雕细琢白描句子,强制执行"文风 & 去AI味精修层"的白描规则。', runLabel: '写初稿中', idleLabel: '就绪' },
  { key: 'reviewing' as const, label: '审校智子 (Lead Editor)', desc: '检验人设一致性,杜绝生硬叙述与俗套废话,完成最终润色。', runLabel: '质量初评中', idleLabel: '就绪' },
];

export function AgentStatusBoard() {
  const stage = usePipelineStore((s) => s.currentStage);

  return (
    <div className="px-6 py-3 border-t border-b border-[#F0EBE3] bg-[#FAF9F6] grid grid-cols-3 gap-4 shrink-0">
      {AGENTS.map((a) => {
        const isActive =
          (a.key === 'planning' && stage === 'planning') ||
          (a.key === 'drafting' && stage === 'drafting') ||
          (a.key === 'reviewing' && (stage === 'reviewing' || stage === 'review_done'));
        return (
          <Card
            key={a.key}
            className={`p-2.5 flex flex-col justify-between transition-all ${
              isActive ? 'bg-[#788E76]/5 border-[#788E76]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#4A5A48] flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#788E76] animate-pulse' : 'bg-gray-300'}`}></span>
                {a.label}
              </span>
              <span
                className={`text-[8px] px-1 rounded font-bold ${
                  isActive ? 'bg-[#788E76] text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isActive ? a.runLabel : a.idleLabel}
              </span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 leading-normal">{a.desc}</p>
          </Card>
        );
      })}
    </div>
  );
}
