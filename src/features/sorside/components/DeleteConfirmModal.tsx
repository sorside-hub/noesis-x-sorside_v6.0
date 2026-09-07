import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemTitle: string;
  itemType?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemTitle,
  itemType = 'data',
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl space-y-5 text-left relative animate-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-status-error-bg border border-status-error/30 flex items-center justify-center text-status-error shrink-0 shadow-xs">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-heading tracking-tight">
              {title || 'Konfirmasi Hapus'}
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        {/* Item Preview Box */}
        <div className="p-3.5 rounded-xl bg-bg-primary border border-border-default space-y-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            {itemType} yang akan dihapus:
          </span>
          <p className="text-xs font-bold text-text-heading truncate">
            {itemTitle}
          </p>
        </div>

        {/* Warning Note */}
        <div className="flex items-center gap-2 text-xs text-status-error bg-status-error-bg/50 border border-status-error/20 p-2.5 rounded-xl">
          <AlertTriangle size={14} className="shrink-0" />
          <span>Data akan terhapus secara permanen dari database Supabase.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-primary hover:bg-bg-hover border border-border-default transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-status-error text-white hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Ya, Hapus Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
