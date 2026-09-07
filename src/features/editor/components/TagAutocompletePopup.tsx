import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Hash, Plus } from 'lucide-react';

interface TagAutocompletePopupProps {
  existingTags: string[];
  query: string;
  onSelect: (insertTag: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const TagAutocompletePopup: React.FC<TagAutocompletePopupProps> = ({
  existingTags,
  query,
  onSelect,
  onClose,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ top: position.top, left: position.left });

  const q = query.toLowerCase().trim();

  // Filter existing tags by query
  const matchingTags = existingTags.filter((tag) => !q || tag.toLowerCase().includes(q));

  // Determine if query is a new tag not in matching list
  const isExactMatch = matchingTags.some((tag) => tag.toLowerCase() === q);
  const showCreateOption = q.length > 0 && !isExactMatch;

  const totalItemsCount = matchingTags.length + (showCreateOption ? 1 : 0);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Dynamic viewport bounds positioning
  useLayoutEffect(() => {
    const el = popupRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const pad = 12;

    let l = position.left;
    const t = position.top;

    if (l + rect.width > vw - pad) {
      l = Math.max(pad, vw - rect.width - pad);
    }
    if (l < pad) {
      l = pad;
    }

    setAdjustedPos({ top: t, left: l });
  }, [position.top, position.left, totalItemsCount]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalItemsCount > 0 ? (prev + 1) % totalItemsCount : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalItemsCount > 0 ? (prev - 1 + totalItemsCount) % totalItemsCount : 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        if (showCreateOption && selectedIndex === matchingTags.length) {
          onSelect(q);
        } else if (matchingTags[selectedIndex]) {
          onSelect(matchingTags[selectedIndex]);
        } else if (q) {
          onSelect(q);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [matchingTags, selectedIndex, showCreateOption, totalItemsCount, q, onSelect, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (totalItemsCount === 0 && !showCreateOption) {
    return null;
  }

  const content = (
    <div
      ref={popupRef}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        top: `${adjustedPos.top}px`,
        left: `${adjustedPos.left}px`,
      }}
      className="z-50 w-64 max-w-[calc(100vw-24px)] max-h-60 overflow-y-auto bg-bg-surface border border-border-default rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none custom-scrollbar"
    >
      <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border-default/40 pb-1 mb-1">
        <span className="flex items-center gap-1">
          <Hash size={12} className="text-accent-primary" />
          Tags
        </span>
        <span className="text-[9px] font-normal normal-case opacity-60">Tab / Enter</span>
      </div>

      <div className="space-y-0.5 mt-0.5">
        {matchingTags.map((tag, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onSelect(tag)}
              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors ${
                isSelected
                  ? 'bg-accent-primary/15 text-accent-primary font-medium'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              <span className="text-accent-primary font-mono text-[11px]">#</span>
              <span className="truncate flex-1 font-medium">{tag}</span>
            </button>
          );
        })}

        {/* Option to create new tag if query doesn't match exactly */}
        {showCreateOption && (
          <button
            type="button"
            onClick={() => onSelect(q)}
            className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors border-t border-border-default/30 mt-0.5 pt-1.5 ${
              selectedIndex === matchingTags.length
                ? 'bg-accent-primary/15 text-accent-primary font-medium'
                : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <Plus size={13} className="text-accent-primary flex-shrink-0" />
            <span className="truncate flex-1">
              Gunakan tag <strong className="text-accent-primary">#{q}</strong>
            </span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
