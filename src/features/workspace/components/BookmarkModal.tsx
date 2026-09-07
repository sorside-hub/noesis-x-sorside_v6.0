import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark, Star, Trash2, FolderPlus, Folder, ChevronRight, X } from 'lucide-react';
import { FileNode, VaultData } from '../../../types/vault';
import { BookmarkGroup } from '../types/bookmarks';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode: FileNode | null;
  vault: VaultData | null;
  groups: BookmarkGroup[];
  isBookmarked: boolean;
  currentTitle?: string;
  currentGroupId?: string | null;
  onSaveBookmark: (nodeId: string, title: string, groupId: string | null) => void;
  onRemoveBookmark: (nodeId: string) => void;
  onCreateGroup?: (name: string) => string | undefined;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  targetNode,
  vault,
  groups,
  isBookmarked,
  currentTitle = '',
  currentGroupId = null,
  onSaveBookmark,
  onRemoveBookmark,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Calculate full breadcrumb path for the target node
  const nodePath = useMemo(() => {
    if (!targetNode || !vault) return '';
    const parts: string[] = [targetNode.name];
    let parentId = targetNode.parentId;
    while (parentId && vault.nodes[parentId]) {
      const parent = vault.nodes[parentId];
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts.join(' / ');
  }, [targetNode, vault]);

  // Sync state when modal opens or targetNode changes
  useEffect(() => {
    if (isOpen && targetNode) {
      const existingBookmark = targetNode.metadata?.bookmark;
      const initialTitle = existingBookmark?.title || currentTitle || targetNode.name;
      const initialGroup = existingBookmark?.groupId ?? currentGroupId ?? null;
      setTitle(initialTitle);
      setSelectedGroupId(initialGroup);
      setIsCreatingNewGroup(false);
      setNewGroupName('');
    }
  }, [isOpen, targetNode, currentTitle, currentGroupId]);

  if (!isOpen || !targetNode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalGroupId = selectedGroupId;

    // If user typed a new group name
    if (isCreatingNewGroup && newGroupName.trim() && onCreateGroup) {
      const createdId = onCreateGroup(newGroupName.trim());
      if (createdId) {
        finalGroupId = createdId;
      }
    }

    const finalTitle = title.trim() || targetNode.name;
    onSaveBookmark(targetNode.id, finalTitle, finalGroupId);
    onClose();
  };

  const handleRemove = () => {
    onRemoveBookmark(targetNode.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-primary/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary shrink-0">
              <Bookmark size={18} className="fill-accent-primary/20" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {isBookmarked ? 'Edit Bookmark' : 'Bookmark'}
              </h3>
              <p className="text-[11px] text-text-muted">
                Atur judul tampilan dan grup untuk bookmark ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 1. Alur / Path Info (Read-only) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <span>Alur / Lokasi File</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-primary border border-border-subtle/80 text-xs text-text-secondary overflow-x-auto select-all">
              <span className="text-text-muted shrink-0 text-[11px]">📁</span>
              <span className="font-mono text-[11.5px] truncate text-text-secondary">
                {nodePath}
              </span>
            </div>
            <p className="text-[10px] text-text-muted">
              *Lokasi file asli bersifat tetap dan tidak berubah.
            </p>
          </div>

          {/* 2. Judul Bookmark Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="bm-title-input"
              className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between"
            >
              <span>Judul Bookmark</span>
              <span className="text-[10px] lowercase text-text-muted/80">
                (bisa beda dari nama file)
              </span>
            </label>
            <input
              id="bm-title-input"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={targetNode.name}
              className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all font-medium"
            />
          </div>

          {/* 3. Pilihan / Dropdown Grup Bookmark */}
          <div className="space-y-1.5">
            <label
              htmlFor="bm-group-select"
              className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between"
            >
              <span>Grup Bookmark</span>
            </label>

            {!isCreatingNewGroup ? (
              <div className="space-y-2">
                <select
                  id="bm-group-select"
                  value={selectedGroupId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__CREATE_NEW__') {
                      setIsCreatingNewGroup(true);
                      setSelectedGroupId(null);
                    } else {
                      setSelectedGroupId(val ? val : null);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border-default text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all cursor-pointer"
                >
                  <option value="">Tanpa Grup (Root)</option>
                  {groups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      📁 {grp.name}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__">+ Buat Grup Baru...</option>
                </select>
              </div>
            ) : (
              /* Inline New Group Input */
              <div className="space-y-2 p-3 bg-bg-primary/80 border border-accent-primary/40 rounded-xl animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-text-primary font-medium">
                  <span className="flex items-center gap-1.5 text-accent-primary">
                    <FolderPlus size={14} />
                    <span>Nama Grup Baru</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewGroup(false);
                      setNewGroupName('');
                    }}
                    className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Proyek Aktif, Referensi Penting..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-border-default text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            {isBookmarked ? (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-status-error hover:bg-status-error-bg transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus Bookmark</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <Star size={13} className="fill-accent-contrast text-accent-contrast" />
                <span>{isBookmarked ? 'Simpan Perubahan' : 'Bookmark'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
