import React from 'react';
import { 
  Edit2, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Image as ImageIcon,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { MediaAttachment } from '../../../../lib/db';
import { MediaCategory, LinkedNoteInfo } from '../../types';

interface ImageMediaCardProps {
  item: MediaAttachment;
  selectedCategory: MediaCategory | null;
  linkedNotes: LinkedNoteInfo[];
  copiedId: string | null;
  editingId: string | null;
  editTitle: string;
  onPreviewImage: (item: MediaAttachment) => void;
  onStartEdit: (item: MediaAttachment) => void;
  onEditTitleChange: (val: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onSaveRename: (id: string) => void;
  onCopyLink: (item: MediaAttachment, type?: 'markdown' | 'url') => void;
  onMoveToTrash: (item: MediaAttachment) => void;
  onRestoreFromTrash: (item: MediaAttachment) => void;
  onConfirmPermanentDelete: (item: MediaAttachment) => void;
  onNavigateToNote: (noteId: string) => void;
}

export const ImageMediaCard: React.FC<ImageMediaCardProps> = ({
  item,
  selectedCategory,
  linkedNotes,
  copiedId,
  editingId,
  editTitle,
  onPreviewImage,
  onStartEdit,
  onEditTitleChange,
  onRenameKeyDown,
  onSaveRename,
  onCopyLink,
  onMoveToTrash,
  onRestoreFromTrash,
  onConfirmPermanentDelete,
  onNavigateToNote
}) => {
  const isUnused = linkedNotes.length === 0;

  // File type detection for badge
  const cleanFilename = item.url.split('/').pop()?.split('?')[0] || item.title || '';
  const rawExt = (cleanFilename.split('.').pop() || (item.title.split('.').pop() || '')).toLowerCase();
  const ext = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(rawExt)
    ? rawExt.toUpperCase()
    : 'IMG';

  return (
    <div className="group rounded-2xl bg-bg-surface border border-border-default hover:border-accent-primary/50 transition-all shadow-xs hover:shadow-md flex flex-col overflow-hidden">
      {/* Visual Image Preview */}
      <div 
        className="relative h-36 bg-bg-elevated flex items-center justify-center overflow-hidden border-b border-border-subtle cursor-pointer"
        onClick={() => onPreviewImage(item)}
      >
        <img
          src={item.url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Type file badge on top right */}
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border font-mono shadow-xs bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-md bg-bg-surface/80">
          {ext}
        </span>
      </div>

      {/* Content & Metadata */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {editingId === item.id ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => onRenameKeyDown(e, item.id)}
              onBlur={() => onSaveRename(item.id)}
              autoFocus
              className="w-full text-xs font-semibold bg-bg-elevated border border-accent-primary rounded px-1.5 py-0.5 focus:outline-none text-text-primary mb-1"
            />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <h3 
                className="text-xs font-semibold text-text-primary truncate flex-1 hover:text-accent-primary transition-colors cursor-pointer" 
                title={item.title}
                onClick={() => onPreviewImage(item)}
              >
                {item.title}
              </h3>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-text-muted mt-1 font-mono">
            <span>
              {new Date(item.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Usage Note Status */}
        <div className="pt-2 border-t border-border-subtle">
          {isUnused ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[11px] font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Tidak Terkait Catatan</span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted font-medium block">Dipakai di {linkedNotes.length} catatan:</span>
              <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto custom-scrollbar">
                {linkedNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => onNavigateToNote(note.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-[10px] font-medium transition-colors truncate max-w-[180px] cursor-pointer"
                    title={`Buka catatan: ${note.name}`}
                  >
                    <FileCheck className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{note.name || 'Untitled Note'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onStartEdit(item)}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors cursor-pointer"
              title="Ubah Judul"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onCopyLink(item, 'markdown')}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title="Salin Markdown Link"
            >
              {copiedId === item.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {selectedCategory === 'trash' || item.deletedAt ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRestoreFromTrash(item)}
                className="p-1.5 rounded-lg text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Pulihkan"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onConfirmPermanentDelete(item)}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Hapus Gambar Permanen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onMoveToTrash(item)}
              className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Pindahkan ke Sampah"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
