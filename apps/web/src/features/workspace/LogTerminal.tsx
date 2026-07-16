/**
 * LogTerminal - 多智能体实时协同日志
 */

import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { usePipelineStore } from '../../stores';
import type { LogType } from '@arcadia/shared';

const LOG_COLOR: Record<LogType, string> = {
  info: 'text-[#788E76]',
  warn: 'text-amber-700',
  success: 'text-emerald-700',
  critique: 'text-purple-700',
};

const LOG_TEXT_COLOR: Record<LogType, string> = {
  info: 'text-gray-600',
  warn: 'text-amber-800',
  success: 'text-emerald-800',
  critique: 'text-purple-900 bg-purple-50/50 p-1 rounded border border-purple-100 block',
};

export function LogTerminal() {
  const logs = usePipelineStore((s) => s.logs);
  const isRunning = usePipelineStore((s) => s.isRunning);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-44 border-t border-[#F0EBE3] bg-[#FAF9F6] p-4 flex flex-col overflow-hidden shrink-0">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A5A48]">
          <Activity className="w-3.5 h-3.5 animate-soft-pulse text-[#788E76]" />
          <span>多智能体协同实时创作日志 (ainovel-cli 架构)</span>
        </div>
        <div className="text-[10px] text-gray-400">
          {isRunning ? '智能体工作组正按章节逻辑推演...' : '工作组闲置,等待指令'}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pt-2 font-mono text-[11px] leading-relaxed">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <span className={`font-semibold shrink-0 ${LOG_COLOR[log.type]}`}>[{log.agent}]</span>
            <span className={LOG_TEXT_COLOR[log.type]}>{log.text}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-400 text-center py-6 italic">
            暂无协同日志。请点击上方"开启本章智能体创作"或右下角"从此处重写",体验多智能体联合跑流过程。
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
