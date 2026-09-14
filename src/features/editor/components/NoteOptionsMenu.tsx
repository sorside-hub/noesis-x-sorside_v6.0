import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, FolderInput, Trash2, Star, StarOff, FileDown, Globe, Sparkles } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { FileNode } from '../../../types/vault';
import { ExportNoteModal } from '../../../components/modals/ExportNoteModal';
import { SingleNoteTriageModal } from './SingleNoteTriageModal';
import { useNavigation } from '../../../context/NavigationContext';
import { TriageResult } from '../../../api-core/inboxTriageHandler';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';

interface NoteOptionsMenuProps {
  node?: FileNode | null;
  onMoveNote: () => void;
  onDeleteNote: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onUpdateMetadata?: (nodeId: string, metadata: Partial<FileNode['metadata']>) => void;
  variant?: 'inline' | 'floating';
  className?: string;
}

export const NoteOptionsMenu: React.FC<NoteOptionsMenuProps> = ({
  node,
  onMoveNote,
  onDeleteNote,
  isBookmarked = false,
  onToggleBookmark,
  onUpdateMetadata,
  variant = 'inline',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [isTriageLoading, setIsTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const navigation = useNavigation();

  // Check if note is strictly in Inbox status
  const isInboxStatus = (() => {
    if (!node) return false;
    const st = (node.metadata?.status || '').trim().toLowerCase();
    return st === 'inbox' || st === 'inbox (unsorted)' || st === 'unsorted' || st === 'inbox/unsorted';
  })();

  const handleTriggerTriage = async () => {
    if (!node) return;
    setIsOpen(false);
    setIsTriageModalOpen(true);
    setIsTriageLoading(true);
    setTriageResult(null);
    setTriageError(null);

    try {
      const customKeys = getAllLocalKeyOverrides();
      const res = await fetch('/api/inbox/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: [
            {
              id: node.id,
              title: node.name,
              content: node.content || '',
            },
          ],
          customKeys,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menganalisis catatan');
      }

      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setTriageResult(data.results[0]);
      } else {
        throw new Error('Tidak ada respon kurasi dari AI');
      }
    } catch (err: any) {
      console.error('[NoteOptionsMenu] Triage error:', err);
      setTriageError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsTriageLoading(false);
    }
  };

  const handleApplyVerdict = (verdict: 'keeper' | 'refine') => {
    if (!node || !onUpdateMetadata) return;
    const targetStatus = verdict === 'keeper' ? 'Inbox (Keeper)' : 'Inbox (Refine)';
    onUpdateMetadata(node.id, {
      ...node.metadata,
      status: targetStatus,
    });
  };

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
            {/* AI Triage Action - Strictly available when note is in Inbox status */}
            {isInboxStatus && (
              <button
                type="button"
                onClick={handleTriggerTriage}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary transition-colors cursor-pointer text-left"
              >
                <Sparkles size={14} className="text-accent-primary shrink-0" />
                <span>AI Triage</span>
              </button>
            )}

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

      {/* Single Note AI Triage Modal Dialog */}
      {node && (
        <SingleNoteTriageModal
          isOpen={isTriageModalOpen}
          onClose={() => setIsTriageModalOpen(false)}
          noteTitle={node.name}
          isLoading={isTriageLoading}
          result={triageResult}
          error={triageError}
          onApply={handleApplyVerdict}
        />
      )}
    </>
  );
};
