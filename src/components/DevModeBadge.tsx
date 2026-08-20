import React from 'react';
import { FileText, Info } from 'lucide-react';

interface DevModeBadgeProps {
  pages: number | number[];
  title?: string;
  fieldCount?: number;
  compact?: boolean;
  className?: string;
}

export const DevModeBadge: React.FC<DevModeBadgeProps> = ({
  pages,
  title,
  fieldCount,
  compact = false,
  className = ''
}) => {
  const pageList = Array.isArray(pages) ? pages : [pages];
  const pageStr = pageList.map(p => `Page ${p}`).join(', ');

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/30 shadow-sm ${className}`}
        title={`Digitizes Template ${pageStr}${title ? `: ${title}` : ''}`}
      >
        <FileText className="w-3 h-3 text-purple-400 shrink-0" />
        <span>{pageStr}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs backdrop-blur-md shadow-inner my-2 ${className}`}>
      <div className="flex items-start sm:items-center gap-2 min-w-0">
        <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300 border border-purple-400/20 shrink-0 mt-0.5 sm:mt-0">
          <FileText className="w-4 h-4 text-purple-300" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-purple-100 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider flex-wrap">
            <span>Template Reference: {pageStr}</span>
          </div>
          {title && <div className="text-[11px] text-purple-300/80 font-normal leading-snug mt-0.5">{title}</div>}
        </div>
      </div>
      {fieldCount && (
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-purple-300 bg-purple-900/40 px-2 py-1 rounded-md border border-purple-500/20 shrink-0 self-start sm:self-auto">
          <Info className="w-3 h-3 text-purple-400" />
          <span>{fieldCount} Fields</span>
        </div>
      )}
    </div>
  );
};
