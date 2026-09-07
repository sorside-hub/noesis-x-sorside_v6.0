import React, { useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Plus, 
  FolderPlus, 
  ExternalLink, 
  Edit2, 
  FolderInput, 
  Trash2,
  Star,
  StarOff,
  FileDown
} from 'lucide-react';
import { FileNode } from '../../../types/vault';

interface LeftSidebarContextMenuProps {
  activeMenuNode: FileNode | null;
  menuPosition: { x: number; y: number } | null;
  isBookmarked?: boolean;
  onToggleBookmark?: (nodeId: string) => void;
  closeActiveDialog: () => void;
  handleCreateNoteInFolder: (node: FileNode) => void;
  handleCreateSubfolderInFolder: (node: FileNode) => void;
  onOpenInNewTab: (id: string) => void;
  onCloseMobile: () => void;
  handleStartRename: (node: FileNode) => void;
  handleStartMove: (node: FileNode) => void;
  handleExportNote?: (node: FileNode) => void;
  handleDelete: (node: FileNode) => void;
}

export const LeftSidebarContextMenu: React.FC<LeftSidebarContextMenuProps> = ({
  activeMenuNode,
  menuPosition,
  isBookmarked = false,
  onToggleBookmark,
  closeActiveDialog,
  handleCreateNoteInFolder,
  handleCreateSubfolderInFolder,
  onOpenInNewTab,
  onCloseMobile,
  handleStartRename,
  handleStartMove,
  handleExportNote,
  handleDelete,
}) => {
  useEffect(() => {
    if (!activeMenuNode) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-file-context-menu="true"]')) {
        return;
      }
      closeActiveDialog();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [activeMenuNode, closeActiveDialog]);

  if (!activeMenuNode || !menuPosition) return null;

  return (
    <>
      {/* Transparent overlay for outside clicks without blurring or dimming */}
      <div
        className="fixed inset-0 z-50 bg-transparent"
        onClick={closeActiveDialog}
        onPointerDown={closeActiveDialog}
      />

      <div
        data-file-context-menu="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          top: `${menuPosition.y}px`,
          left: `${menuPosition.x}px`,
        }}
        className="fixed w-48 bg-bg-surface border border-border-default rounded-xl shadow-xl py-1.5 z-60 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-100 font-normal"
      >
        {/* Header info */}
        <div className="px-3 py-1.5 border-b border-border-subtle mb-1 flex items-center gap-2 text-text-muted truncate font-medium">
          {activeMenuNode.type === 'folder' ? (
            <Folder size={13} className="text-text-secondary shrink-0" />
          ) : (
            <FileText size={13} className="text-text-secondary shrink-0" />
          )}
          <span className="truncate text-text-primary text-[11px] font-semibold">{activeMenuNode.name}</span>
        </div>

        {/* Bookmark Action */}
        {onToggleBookmark && (
          <button
            type="button"
            onClick={() => {
              onToggleBookmark(activeMenuNode.id);
              closeActiveDialog();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
          >
            {isBookmarked ? (
              <>
                <StarOff size={13} className="text-accent-primary shrink-0" />
                <span>Hapus Bookmark</span>
              </>
            ) : (
              <>
                <Star size={13} className="text-accent-primary shrink-0" />
                <span>Bookmark</span>
              </>
            )}
          </button>
        )}

        {/* Folder Specific Actions */}
        {activeMenuNode.type === 'folder' && (
          <>
            <button
              type="button"
              onClick={() => handleCreateNoteInFolder(activeMenuNode)}
              className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
            >
              <Plus size={13} className="text-text-muted shrink-0" />
              <span>Catatan Baru</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateSubfolderInFolder(activeMenuNode)}
              className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
            >
              <FolderPlus size={13} className="text-text-muted shrink-0" />
              <span>Folder Baru</span>
            </button>
          </>
        )}

        {/* Note Specific Action (Open in New Tab & Export) */}
        {activeMenuNode.type === 'file' && (
          <>
            <button
              type="button"
              onClick={() => {
                const targetId = activeMenuNode.id;
                closeActiveDialog();
                onOpenInNewTab(targetId);
                onCloseMobile();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
            >
              <ExternalLink size={13} className="text-text-muted shrink-0" />
              <span>Buka di Tab Baru</span>
            </button>

            {handleExportNote && (
              <button
                type="button"
                onClick={() => {
                  const node = activeMenuNode;
                  closeActiveDialog();
                  handleExportNote(node);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
              >
                <FileDown size={13} className="text-text-muted shrink-0" />
                <span>Export Catatan...</span>
              </button>
            )}
          </>
        )}

        {/* Common Actions (Rename, Move, Delete) */}
        <button
          type="button"
          onClick={() => handleStartRename(activeMenuNode)}
          className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
        >
          <Edit2 size={13} className="text-text-muted shrink-0" />
          <span>Ganti Nama</span>
        </button>

        <button
          type="button"
          onClick={() => handleStartMove(activeMenuNode)}
          className="flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
        >
          <FolderInput size={13} className="text-text-muted shrink-0" />
          <span>Pindahkan ke...</span>
        </button>

        <div className="my-1 border-t border-border-subtle" />

        <button
          type="button"
          onClick={() => handleDelete(activeMenuNode)}
          className="flex items-center gap-2 px-3 py-1.5 text-status-error hover:bg-status-error-bg/30 transition-colors text-left cursor-pointer"
        >
          <Trash2 size={13} className="shrink-0" />
          <span>Hapus</span>
        </button>
      </div>
    </>
  );
};
