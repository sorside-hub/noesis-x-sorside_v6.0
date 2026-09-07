import React from 'react';
import { 
  FileText, 
  Edit2, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  FileCheck,
  AlertCircle,
  Eye
} from 'lucide-react';
import { MediaAttachment } from '../../../../lib/db';
import { MediaCategory, LinkedNoteInfo } from '../../types';

interface DocumentMediaCardProps {
  item: MediaAttachment;
  selectedCategory: MediaCategory | null;
  linkedNotes: LinkedNoteInfo[];
  copiedId: string | null;
  editingId: string | null;
  editTitle: string;
  onPreviewDocument?: (item: MediaAttachment) => void;
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

export const DocumentMediaCard: React.FC<DocumentMediaCardProps> = ({
  item,
  selectedCategory,
  linkedNotes,
  copiedId,
  editingId,
  editTitle,
  onPreviewDocument,
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

  // File type detection identical to DocumentPill
  const cleanFilename = item.url.split('/').pop()?.split('?')[0] || item.title || '';
  const ext = (cleanFilename.split('.').pop() || (item.title.split('.').pop() || '')).toLowerCase();

  const isPdf = ext === 'pdf' || item.url.toLowerCase().includes('.pdf');
  const isDocx = ext === 'docx' || ext === 'doc';
  const isSheet = ['xlsx', 'xls', 'csv'].includes(ext);
  const isSlide = ['pptx', 'ppt'].includes(ext);

  // Dynamic color ONLY for badge type file matching DocumentPill
  const getBadgeColors = () => {
    if (isPdf) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (isDocx) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (isSheet) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (isSlide) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  };

  const handleCardPreview = () => {
    if (onPreviewDocument) {
      onPreviewDocument(item);
    }
  };

  return (
    <div className="group rounded-2xl bg-bg-surface border border-border-default hover:border-accent-primary/50 transition-all shadow-xs hover:shadow-md flex flex-col justify-between p-3.5 space-y-3">
      {/* Header: Icon (purple) on the left + Title in middle + Badge on the right */}
      <div>
        {editingId === item.id ? (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => onRenameKeyDown(e, item.id)}
              onBlur={() => onSaveRename(item.id)}
              autoFocus
              className="flex-1 text-xs font-semibold bg-bg-elevated border border-accent-primary rounded px-2 py-1 focus:outline-none text-text-primary"
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2.5">
            {/* Left: Purple Document Icon + Title & Date Column */}
            <div 
              onClick={handleCardPreview}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group/title"
              title="Klik untuk Pratinjau Layar Penuh"
            >
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0 group-hover/title:bg-purple-500/20 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 
                  className="text-xs font-semibold text-text-primary truncate group-hover/title:text-accent-primary transition-colors" 
                  title={item.title}
                >
                  {item.title}
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Right: Badge with file extension color (exact match to DocumentPill) */}
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border font-mono shrink-0 shadow-2xs mt-0.5 ${getBadgeColors()}`}>
              {ext || 'BERKAS'}
            </span>
          </div>
        )}
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
          {/* Dedicated Preview Button */}
          <button
            type="button"
            onClick={handleCardPreview}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors cursor-pointer"
            title="Pratinjau Layar Penuh"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

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

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Buka / Unduh Berkas Asli"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
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
              title="Hapus Dokumen Permanen"
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
  );
};

