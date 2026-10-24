import React from 'react';
import { MetricCardData } from '../types';

interface MetricCardProps {
  card: MetricCardData;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ card, icon }) => {
  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'red':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'teal':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'cyan':
      default:
        return 'bg-sky-50 text-sky-800 border-sky-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 transition-all shadow-soft flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
        {icon && <div className="text-slate-400 p-1.5 rounded-lg bg-slate-50">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          {card.value}
        </span>
        {card.unit && (
          <span className="text-xs font-semibold text-slate-500">{card.unit}</span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
        <span className="text-slate-500 truncate max-w-[160px]">{card.subtitle}</span>
        {card.badge && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${getBadgeStyle(card.badge_variant)}`}>
            {card.badge}
          </span>
        )}
      </div>
    </div>
  );
};
