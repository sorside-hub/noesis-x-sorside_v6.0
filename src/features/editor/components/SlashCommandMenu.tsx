import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { SlashCommand, SLASH_COMMANDS } from '../data/slashCommands';

export type { SlashCommand };

interface SlashCommandMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query,
  position,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Dynamic viewport bounds positioning
  const [adjustedPos, setAdjustedPos] = useState({ top: position.top, left: position.left });

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(q);
      const descMatch = cmd.description.toLowerCase().includes(q);
      const keywordMatch = cmd.keywords.some((k) => k.toLowerCase().includes(q));
      return titleMatch || descMatch || keywordMatch;
    });
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Adjust position to stay within viewport
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;

    let l = position.left;
    let t = position.top;

    if (l + rect.width > vw - pad) {
      l = Math.max(pad, vw - rect.width - pad);
    }
    if (l < pad) {
      l = pad;
    }

    if (t + rect.height > vh - pad && t - rect.height - 16 > pad) {
      t = Math.max(pad, t - rect.height - 16);
    }

    setAdjustedPos({ top: t, left: l });
  }, [position.top, position.left, filteredCommands.length]);

  // Scroll active item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredCommands.length > 0 && filteredCommands[selectedIndex]) {
          e.preventDefault();
          e.stopPropagation();
          onSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (filteredCommands.length === 0) {
    return null;
  }

  const content = (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.preventDefault()} // Prevent editor blur
      style={{
        position: 'fixed',
        top: `${adjustedPos.top}px`,
        left: `${adjustedPos.left}px`,
      }}
      className="z-50 w-72 max-w-[calc(100vw-24px)] max-h-80 overflow-y-auto bg-bg-surface border border-border-default rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none custom-scrollbar"
    >
      <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border-default/40 pb-1 mb-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-accent-primary" />
          Slash Commands
        </span>
        <span className="text-[9px] font-mono text-text-disabled lowercase">
          {query ? `/${query}` : 'type to filter'}
        </span>
      </div>

      <div className="space-y-0.5">
        {filteredCommands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              ref={isSelected ? selectedItemRef : null}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(cmd);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                isSelected
                  ? 'bg-accent-primary text-accent-contrast font-semibold shadow-sm'
                  : 'text-text-primary hover:bg-bg-hover'
              }`}
            >
              <div
                className={`flex-none p-1.5 rounded-md ${
                  isSelected ? 'bg-accent-contrast/15 text-accent-contrast' : 'bg-bg-primary border border-border-default/50'
                }`}
              >
                {cmd.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="truncate">{cmd.title}</span>
                  {cmd.id === 'todo' && (
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-accent-contrast/80' : 'text-text-disabled'}`}>
                      []
                    </span>
                  )}
                </div>
                <p
                  className={`text-[10px] truncate ${
                    isSelected ? 'text-accent-contrast/75 font-normal' : 'text-text-muted'
                  }`}
                >
                  {cmd.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
