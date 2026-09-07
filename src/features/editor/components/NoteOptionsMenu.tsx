import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, FolderInput, Trash2, Star, StarOff, FileDown, Globe } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { FileNode } from '../../../types/vault';
import { ExportNoteModal } from '../../../components/modals/ExportNoteModal';
import { useNavigation } from '../../../context/NavigationContext';

interface NoteOptionsMenuProps {
  node?: FileNode | null;
  onMoveNote: () => void;
  onDeleteNote: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  variant?: 'inline' | 'floating';
  className?: string;
}

export const NoteOptionsMenu: React.FC<NoteOptionsMenuProps> = ({
  node,
  onMoveNote,
  onDeleteNote,
  isBookmarked = false,
  onToggleBookmark,
  variant = 'inline',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigation = useNavigation();

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleBookmarkClick = () => {
    setIsOpen(false);
    onToggleBookmark?.();
  };

  const handleMoveClick = () => {
    setIsOpen(false);
    onMoveNote();
  };

  const handleExportClick = () => {
    setIsOpen(false);
    setIsExportModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsOpen(false);
    onDeleteNote();
  };

  return (
    <>
      <div className={twMerge('relative inline-flex items-center', className)} ref={menuRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Pilihan Catatan"
          aria-expanded={isOpen}
          aria-label="Pilihan Catatan"
          className={twMerge(
            'flex items-center justify-center transition-all duration-150 cursor-pointer',
            variant === 'floating' ? 'p-2 rounded-full' : 'w-7 h-7 rounded-md',
            isOpen
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
          )}
        >
          <MoreHorizontal size={15} />
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div
            className={twMerge(
              'absolute z-50 bg-bg-surface border border-border-default rounded-xl shadow-xl py-1.5 min-w-[175px] backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100',
              variant === 'floating'
                ? 'right-full mr-2.5 top-1/2 -translate-y-1/2'
                : 'right-0 top-full mt-1.5'
            )}
          >
            {/* Toggle Bookmark Action */}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={handleToggleBookmarkClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer text-left"
              >
                {isBookmarked ? (
                  <>
                    <StarOff size={14} className="text-accent-primary shrink-0" />
                    <span>Hapus Bookmark</span>
                  </>
                ) : (
                  <>
                    <Star size={14} className="text-accent-primary shrink-0" />
                    <span>Bookmark</span>
                  </>
                )}
              </button>
            )}

            {/* Publish to SORSIDE Action */}
            {node && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigation?.navigateView('sorside');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('publish-note-to-sorside', { detail: node }));
                  }, 50);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer text-left"
              >
                <Globe size={14} className="text-accent-primary shrink-0" />
                <span>Publish ke SORSIDE</span>
              </button>
            )}

            {/* Export Note Action */}
            {node && (
              <button
                type="button"
                onClick={handleExportClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer text-left"
              >
                <FileDown size={14} className="text-text-muted shrink-0" />
                <span>Export Catatan</span>
              </button>
            )}

            {/* Move to Folder Action */}
            <button
              type="button"
              onClick={handleMoveClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer text-left"
            >
              <FolderInput size={14} className="text-text-muted shrink-0" />
              <span>Pindahkan ke...</span>
            </button>

            <div className="h-px bg-border-subtle my-1 mx-2" />

            {/* Delete Note Action */}
            <button
              type="button"
              onClick={handleDeleteClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-status-error hover:bg-status-error-bg transition-colors cursor-pointer text-left"
            >
              <Trash2 size={14} className="text-status-error shrink-0" />
              <span>Hapus Catatan</span>
            </button>
          </div>
        )}
      </div>

      {/* Export Note Modal Dialog */}
      {node && (
        <ExportNoteModal
          node={node}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </>
  );
};
