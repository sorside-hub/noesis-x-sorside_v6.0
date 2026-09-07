import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PanelLeft, PanelRight, Plus, X, Lock, Unlock } from 'lucide-react';
import { VaultData, FileNode } from '../../../types/vault';
import { NoteOptionsMenu } from './NoteOptionsMenu';
import { RagStatusDot } from './RagStatusDot';

interface EditorHeaderProps {
  vault: VaultData;
  activeNode: FileNode | null;
  navigateToNote: (id: string) => void;
  closeTab: (id: string) => void;
  openInNewTab: (id: string | null) => void;
  handleLeftHeaderToggle: () => void;
  handleRightHeaderToggle: () => void;
  onMoveNote?: () => void;
  onDeleteNote?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  vault,
  activeNode,
  navigateToNote,
  closeTab,
  openInNewTab,
  handleLeftHeaderToggle,
  handleRightHeaderToggle,
  onMoveNote,
  onDeleteNote,
  isBookmarked,
  onToggleBookmark,
  isLocked = false,
  onToggleLock,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScrollOverflow = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    setShowLeftShadow(el.scrollLeft > 6);
    setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  // Auto-scroll active tab into view smoothly whenever activeTabId or openTabs changes
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      });
    }
    // Re-check overflow indicators after slight delay for DOM layout/smooth scroll
    const timer = setTimeout(checkScrollOverflow, 100);
    return () => clearTimeout(timer);
  }, [vault.activeTabId, vault.openTabs, checkScrollOverflow]);

  // Track scroll and resize events for overflow fade indicators
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollOverflow, { passive: true });
    window.addEventListener('resize', checkScrollOverflow, { passive: true });
    checkScrollOverflow();
    return () => {
      el.removeEventListener('scroll', checkScrollOverflow);
      window.removeEventListener('resize', checkScrollOverflow);
    };
  }, [checkScrollOverflow]);

  return (
    <header className="flex items-center justify-between bg-bg-surface border-b border-border-default z-30 relative px-2 h-10 shrink-0 select-none">
      {/* Left Controls (Sidebar Toggle + Divider) */}
      <div className="flex items-center shrink-0 pr-1">
        {/* Mobile Left Sidebar Toggle */}
        <button
          type="button"
          onClick={handleLeftHeaderToggle}
          title="Toggle Left Sidebar"
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
        >
          <PanelLeft size={16} />
        </button>

        {/* Desktop Left Sidebar Toggle */}
        <button
          type="button"
          onClick={handleLeftHeaderToggle}
          title="Toggle Left Sidebar"
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
        >
          <PanelLeft size={16} />
        </button>

        {/* Thin Divider separating Left Sidebar Toggle from Tab Bar */}
        <div className="h-4 w-px bg-border-default ml-1.5 shrink-0" />
      </div>

      {/* Scrollable Tabs Area with Container & Subtle Fade Indicators */}
      <div className="relative flex-1 min-w-0 h-full flex items-center">
        {/* Left Scroll Overflow Shadow */}
        {showLeftShadow && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg-surface to-transparent z-20 transition-opacity duration-200" />
        )}

        <div
          ref={tabsContainerRef}
          className="flex items-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth w-full h-full px-1.5"
        >
          {(vault.openTabs || []).map((tabId) => {
            const isTabEmpty = tabId.startsWith('empty_');
            const node = !isTabEmpty ? vault.nodes[tabId] : null;

            // Defensive guard: if it's a note tab but the note does not exist in vault, skip rendering
            if (!isTabEmpty && !node) {
              return null;
            }

            const tabTitle = isTabEmpty ? 'Tab Baru' : (node?.name || 'Untitled');
            const isActive = vault.activeTabId === tabId;

            return (
              <div
                key={tabId}
                ref={isActive ? activeTabRef : null}
                onClick={() => {
                  if (!isTabEmpty && !vault.nodes[tabId]) {
                    closeTab(tabId);
                    return;
                  }
                  navigateToNote(tabId);
                }}
                className={`group flex items-center gap-2 h-8 px-3 text-xs font-medium min-w-[110px] max-w-[170px] shrink-0 cursor-pointer transition-colors relative select-none ${
                  isActive
                    ? 'border-t-2 border-l border-r border-t-accent-primary border-l-border-default border-r-border-default rounded-t-lg bg-bg-primary text-accent-primary z-10 before:absolute before:-bottom-px before:left-0 before:right-0 before:h-px before:bg-bg-primary font-semibold shadow-[0_-4px_10px_rgba(197,163,106,0.05)]'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover/60 rounded-t-lg border-t-2 border-l border-r border-transparent'
                }`}
              >
                <span className="truncate flex-1">{tabTitle}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabId);
                  }}
                  title="Tutup Tab"
                  className="w-4 h-4 flex items-center justify-center rounded-xs hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* Add New Tab Button (+) */}
          <div className="flex items-center h-8 shrink-0">
            <button
              type="button"
              onClick={() => openInNewTab(null)}
              title="Buka Tab Baru"
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Right Scroll Overflow Shadow */}
        {showRightShadow && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg-surface to-transparent z-20 transition-opacity duration-200" />
        )}
      </div>

      {/* Right Controls (Divider + Note Options + Right Sidebar Toggle) */}
      <div className="flex items-center gap-1 shrink-0 pl-1">
        {/* Thin Divider separating Tab Bar from Right Controls */}
        <div className="h-4 w-px bg-border-default mr-1 shrink-0" />

        {/* Lock / Reading Mode Toggle (Desktop only, hidden on mobile) */}
        {activeNode && onToggleLock && (
          <button
            type="button"
            onClick={onToggleLock}
            title={isLocked ? 'Buka Kunci (Mode Edit)' : 'Kunci Catatan (Mode Membaca)'}
            className={`hidden sm:flex w-7 h-7 items-center justify-center rounded-md transition-all cursor-pointer shrink-0 ${
              isLocked
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-medium'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
        )}

        {/* Note Options Menu */}
        {activeNode && onMoveNote && onDeleteNote && (
          <div className="flex items-center">
            <NoteOptionsMenu
              node={activeNode}
              variant="inline"
              onMoveNote={onMoveNote}
              onDeleteNote={onDeleteNote}
              isBookmarked={isBookmarked}
              onToggleBookmark={onToggleBookmark}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleRightHeaderToggle}
          title="Toggle Right Sidebar"
          className="relative w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
        >
          <PanelRight size={16} />
          <RagStatusDot activeNode={activeNode} />
        </button>
      </div>
    </header>
  );
};
