/**
 * StyleFilters Section - 文风精修层开关
 */

import { Sliders, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { Card, Tag } from '../../components';

export function StyleFiltersSection() {
  const filters = useSettingsStore((s) => s.styleFilters);
  const setStyleFilter = useSettingsStore((s) => s.setStyleFilter);

  const items: Array<{ key: keyof typeof filters; label: string; emoji: string; desc: string }> = [
    { key: 'noCliches', label: '屏蔽高频 AI 俗套词', emoji: '🚫', desc: '强力屏蔽"突然、然而、只见、不可否认"等低级连词。' },
    { key: 'showDontTell', label: 'Show, Don\'t Tell (白描细节)', emoji: '🍃', desc: '禁止直接写伤心、震惊等情绪判定，强制用动作呼应。' },
    { key: 'slowPacing', label: '林间治愈留白 (慢节奏渲染)', emoji: '🌲', desc: '减缓故事推进，融入大量微风/古木/以太微光等治愈氛围。' },
    { key: 'keepMystery', label: '摒弃市面网文低俗套路', emoji: '⚔️', desc: '摒弃低级反派和嘴炮打斗，让文字保持深邃克制。' },
  ];

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#4A5A48] uppercase tracking-widest flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-[#788E76]" />
          去AI味 & 文风精修层
        </h4>
        <Tag tone="emerald" size="sm" className="uppercase tracking-wider">
          Active
        </Tag>
      </div>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        对标 cli 中枢架构策略，通过强约束过滤器净化叙事，根除大模型套路与废话连篇。
      </p>

      <div className="space-y-2.5 pt-1.5">
        {items.map((it) => (
          <label
            key={it.key}
            className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-[#FAF9F6] transition-colors border border-transparent hover:border-[#F0EBE3]"
          >
            <input
              type="checkbox"
              checked={filters[it.key]}
              onChange={(e) => setStyleFilter(it.key, e.target.checked)}
              className="mt-0.5 accent-[#788E76]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-700 block">
                {it.emoji} {it.label}
              </span>
              <p className="text-[9px] text-gray-400 leading-normal">{it.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-1 pt-1 border-t border-gray-50">
        <Sparkles className="w-3 h-3 text-[#D4B996]" />
        <span className="text-[10px] text-gray-400">配置自动随会话持久化</span>
      </div>
    </Card>
  );
}
