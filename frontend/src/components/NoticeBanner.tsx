import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

interface NoticeBannerProps {
  message?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  message = "This dashboard supports awareness and planning. It does not guarantee flood predictions or replace official emergency alerts."
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
      <div className="flex items-center gap-2.5 max-w-6xl mx-auto flex-1">
        <span className="inline-flex items-center gap-1 font-semibold text-amber-800 text-[11px] bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Notice</span>
        </span>
        <span className="text-slate-700 leading-relaxed font-medium">
          {message}
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="p-1 hover:bg-amber-100 rounded-md text-amber-700/80 hover:text-amber-950 transition-colors shrink-0 ml-2"
        title="Dismiss notice"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
