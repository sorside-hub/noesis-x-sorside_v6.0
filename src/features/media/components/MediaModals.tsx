import React from 'react';
import { Trash2, Loader2, X } from 'lucide-react';
import { MediaAttachment } from '../../../lib/db';

interface DeleteConfirmModalProps {
  media: MediaAttachment | null;
  deletingId: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  media,
  deletingId,
  onClose,
  onConfirm
}) => {
  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-text-primary">
            Hapus Media Secara Permanen?
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            File <strong className="text-text-primary">"{media.title}"</strong> akan dihapus permanen dari Cloud Storage dan database. Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deletingId !== null}
            className="flex-1 py-2 rounded-xl border border-border-default hover:bg-bg-hover text-xs font-medium text-text-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deletingId !== null}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {deletingId ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Hapus Permanen</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImagePreviewModalProps {
  media: MediaAttachment | null;
  onClose: () => void;
}

interface EmptyTrashModalProps {
  isOpen: boolean;
  itemCount: number;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const EmptyTrashModal: React.FC<EmptyTrashModalProps> = ({
  isOpen,
  itemCount,
  isLoading,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-semibold text-text-primary">
            Kosongkan Kotak Sampah?
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Apakah Anda yakin ingin menghapus <strong className="text-text-primary">{itemCount} file media</strong> di Kotak Sampah secara permanen? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 rounded-xl border border-border-default hover:bg-bg-hover text-xs font-medium text-text-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengosongkan...</span>
              </>
            ) : (
              <span>Kosongkan Sampah</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  media,
  onClose
}) => {
  if (!media) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl max-h-[85vh] bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border-subtle flex items-center justify-between">
          <span className="text-xs font-medium text-text-primary truncate max-w-sm">
            {media.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 flex items-center justify-center overflow-auto max-h-[75vh]">
          <img
            src={media.url}
            alt={media.title}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
