import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileNode } from '../../../types/vault';
import { FileText, Plus, CornerDownRight } from 'lucide-react';
import { checkNoteExists } from '../../../lib/editor/wikilinkPlugin';
import { getNodeFolderPath } from '../../../lib/vaultUtils';

interface WikilinkAutocompletePopupProps {
  nodes: Record<string, FileNode>;
  query: string;
  onSelect: (insertText: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

interface AutocompleteSuggestion {
  id: string;
  type: 'note' | 'alias';
  displayName: string;
  subText: string;
  insertValue: string;
  targetNoteName: string;
  alias?: string;
}

export const WikilinkAutocompletePopup: React.FC<WikilinkAutocompletePopupProps> = ({
  nodes,
  query,
  onSelect,
  onClose,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // Dynamic viewport bounds positioning
  const [adjustedPos, setAdjustedPos] = useState({ top: position.top, left: position.left });

  const q = query.toLowerCase().trim();
  const allFiles = (Object.values(nodes) as FileNode[]).filter((n) => n.type === 'file');

  // Build suggestions list matching Obsidian's exact behavior
  const suggestions: AutocompleteSuggestion[] = [];

  allFiles.forEach((note) => {
    const folderPath = getNodeFolderPath(note.parentId, nodes) || 'Root';
    const aliases = note.metadata?.aliases || [];
    const noteNameLower = note.name.toLowerCase();

    const noteMatches = !q || noteNameLower.includes(q);
    const matchingAliases = aliases.filter((al) => !q || al.toLowerCase().includes(q));

    // Skip note if neither title nor any of its aliases match query
    if (!noteMatches && matchingAliases.length === 0) {
      return;
    }

    // 1. Direct Note
    suggestions.push({
      id: `note-${note.id}`,
      type: 'note',
      displayName: note.name,
      subText: folderPath,
      insertValue: note.name,
      targetNoteName: note.name,
    });

    // 2. Aliases directly under this note
    const aliasesToShow = !q ? aliases : matchingAliases;
    aliasesToShow.forEach((alias) => {
      suggestions.push({
        id: `alias-${note.id}-${alias}`,
        type: 'alias',
        displayName: alias,
        subText: `${note.name} • ${folderPath}`,
        insertValue: alias,
        targetNoteName: note.name,
        alias,
      });
    });
  });

  const matchingSuggestions = suggestions.slice(0, 15);

  const cleanQuery = query.trim();
  const exactExists = checkNoteExists(cleanQuery, nodes);
  const showCreateOption = cleanQuery.length > 0 && !exactExists;

  const totalItemsCount = matchingSuggestions.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Recalculate horizontal position to prevent overflowing left/right screen edges
  useLayoutEffect(() => {
    if (!popupRef.current) return;
    const rect = popupRef.current.getBoundingClientRect();
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

    // Always keep strictly below the active text line without covering it
    setAdjustedPos({ top: t, left: l });
  }, [position.top, position.left, totalItemsCount]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Tab, Escape)
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
        if (showCreateOption && selectedIndex === matchingSuggestions.length) {
          onSelect(cleanQuery);
        } else if (matchingSuggestions[selectedIndex]) {
          onSelect(matchingSuggestions[selectedIndex].insertValue);
        } else if (cleanQuery) {
          onSelect(cleanQuery);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [matchingSuggestions, selectedIndex, showCreateOption, totalItemsCount, cleanQuery, onSelect, onClose]);

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

  if (totalItemsCount === 0) {
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
      className="z-50 w-72 max-w-[calc(100vw-24px)] max-h-64 overflow-y-auto bg-bg-surface border border-border-default rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none custom-scrollbar"
    >
      <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border-default/40 pb-1 mb-1">
        <span>Link to Note</span>
        <span className="text-[9px] font-normal normal-case opacity-60">Tab / Enter to select</span>
      </div>

      <div className="space-y-0.5 mt-0.5">
        {matchingSuggestions.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const isAlias = item.type === 'alias';

          return (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item.insertValue);
              }}
              onClick={() => onSelect(item.insertValue)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-accent-primary/15 text-accent-primary font-medium'
                  : 'text-text-primary hover:bg-bg-hover'
              } ${isAlias ? 'pl-5' : ''}`}
            >
              {isAlias ? (
                <CornerDownRight size={13} className="shrink-0 text-amber-500/80" />
              ) : (
                <FileText size={14} className="shrink-0 text-accent-primary" />
              )}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-xs font-medium text-text-primary leading-tight">
                    {item.displayName}
                  </span>
                  {isAlias && (
                    <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Alias
                    </span>
                  )}
                </div>
                <span className="truncate text-[10px] text-text-muted leading-tight mt-0.5">
                  {item.subText}
                </span>
              </div>
            </button>
          );
        })}

        {showCreateOption && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(cleanQuery);
            }}
            onClick={() => onSelect(cleanQuery)}
            onMouseEnter={() => setSelectedIndex(matchingSuggestions.length)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
              selectedIndex === matchingSuggestions.length
                ? 'bg-accent-primary/15 text-accent-primary font-medium'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Plus size={14} className="shrink-0 text-text-muted" />
            <span className="truncate flex-1">
              Link to <span className="font-semibold text-text-primary">"{cleanQuery}"</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
