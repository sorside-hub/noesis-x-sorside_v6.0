import React, { useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Filter, 
  Layers, 
  Check, 
  Link2, 
  Tag, 
  ArrowLeftRight,
  Sparkles 
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { LocalGraphDepth, LocalGraphFilterOptions, LocalGraphStats } from './types';

interface LocalGraphHeaderProps {
  filters: LocalGraphFilterOptions;
  stats: LocalGraphStats;
  onSetDepth: (depth: LocalGraphDepth) => void;
  onToggleOutgoing: () => void;
  onToggleBacklinks: () => void;
  onToggleTags: () => void;
  onToggleSemantic: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  onCloseFilter: () => void;
}

export const LocalGraphHeader: React.FC<LocalGraphHeaderProps> = ({
  filters,
  stats,
  onSetDepth,
  onToggleOutgoing,
  onToggleBacklinks,
  onToggleTags,
  onToggleSemantic,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFilterOpen,
  onToggleFilter,
  onCloseFilter,
}) => {
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDropdown = filterDropdownRef.current?.contains(target);
      const clickedInsideButton = filterButtonRef.current?.contains(target);
      
      if (!clickedInsideDropdown && !clickedInsideButton) {
        onCloseFilter();
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, onCloseFilter]);

  return (
    <div className="relative flex items-center justify-between px-3 py-2 bg-bg-surface/95 backdrop-blur-xs border-t border-border-default select-none">
      {/* Left: Depth Quick Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-text-muted font-medium">Depth</span>
        <div className="flex items-center gap-1 bg-bg-base/80 p-0.5 rounded-lg border border-border-default/60">
          {([1, 2, 3] as LocalGraphDepth[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onSetDepth(d)}
              className={twMerge(
                'px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all',
                filters.depth === d
                  ? 'bg-accent-primary text-accent-contrast shadow-2xs font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              {d} hop{d > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Actions (Filter & Zoom Controls in 1 row) */}
      <div className="flex items-center gap-1.5">
        {/* Filter Toggle Button (Icon Only) */}
        <button
          ref={filterButtonRef}
          type="button"
          onClick={onToggleFilter}
          className={twMerge(
            'p-1 rounded text-xs transition-colors flex items-center justify-center border',
            isFilterOpen || !filters.showOutgoing || !filters.showBacklinks || !filters.showTags
              ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/30'
              : 'bg-bg-base/80 text-text-muted hover:text-text-primary border-border-default/60 hover:bg-bg-hover'
          )}
          title="Connection Filters"
        >
          <Filter size={13} />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-bg-base/80 p-0.5 rounded-lg border border-border-default/60">
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <div className="w-[1px] h-3 bg-border-default mx-0.5" />
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Reset View"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Filter Dropdown Popover (Opens Upward from right side) */}
      {isFilterOpen && (
        <div
          ref={filterDropdownRef}
          className="absolute bottom-full right-3 mb-2 w-56 z-40 bg-bg-surface border border-border-default rounded-xl shadow-xl p-2.5 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-1">
            Connection Filters
          </div>

          <button
            type="button"
            onClick={onToggleOutgoing}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-xs" />
              <Link2 size={13} className="text-sky-400" />
              <span>Outgoing Links</span>
            </div>
            {filters.showOutgoing && <Check size={13} className="text-accent-primary" />}
          </button>

          <button
            type="button"
            onClick={onToggleBacklinks}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
              <ArrowLeftRight size={13} className="text-emerald-400" />
              <span>Backlinks</span>
            </div>
            {filters.showBacklinks && <Check size={13} className="text-accent-primary" />}
          </button>

          <button
            type="button"
            onClick={onToggleTags}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs" />
              <Tag size={13} className="text-amber-400" />
              <span>Shared Tags (Dashed)</span>
            </div>
            {filters.showTags && <Check size={13} className="text-accent-primary" />}
          </button>

          <button
            type="button"
            onClick={onToggleSemantic}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-xs" />
              <Sparkles size={13} className="text-purple-400" />
              <span>Related Notes (AI)</span>
            </div>
            {filters.showSemantic && <Check size={13} className="text-accent-primary" />}
          </button>
        </div>
      )}
    </div>
  );
};
