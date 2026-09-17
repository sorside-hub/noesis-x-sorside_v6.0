import React from 'react';
import { Pin, PinOff, Pencil, Trash2, Sparkles, Loader2, DatabaseZap } from 'lucide-react';
import { ChatSessionRecord } from '../../../lib/db';

interface ChatSessionContextMenuProps {
  contextMenu: {
    session: ChatSessionRecord;
    x: number;
    y: number;
  } | null;
  isEmbedded?: boolean;
  isEmbeddingLoading?: boolean;
  onClose?: () => void;
  onTogglePin: (sess: ChatSessionRecord, e?: React.MouseEvent) => void;
  onStartRename: (sess: ChatSessionRecord, e?: React.MouseEvent) => void;
  onDeleteSession: (sessId: string, e?: React.MouseEvent) => void;
  onToggleEmbedding?: (sess: ChatSessionRecord, e?: React.MouseEvent) => void;
}

export const ChatSessionContextMenu: React.FC<ChatSessionContextMenuProps> = ({
  contextMenu,
  isEmbedded = false,
  isEmbeddingLoading = false,
  onClose,
  onTogglePin,
  onStartRename,
  onDeleteSession,
  onToggleEmbedding,
}) => {
  if (!contextMenu) return null;

  return (
    <>
      {/* Backdrop tipis & blur subtle untuk menangkap klik luar tanpa menutup sidebar */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1.5px] transition-opacity animate-in fade-in duration-100"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      />

      <div
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-50 w-48 bg-bg-surface border border-border-default rounded-xl p-1 shadow-2xl space-y-0.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
      >
        <button
        type="button"
        onClick={(e) => onTogglePin(contextMenu.session, e)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-primary hover:bg-bg-hover transition-colors cursor-pointer text-left"
      >
        {contextMenu.session.isPinned ? (
          <>
            <PinOff size={14} className="text-text-muted" />
            <span>Unpin</span>
          </>
        ) : (
          <>
            <Pin size={14} className="text-amber-500" />
            <span>Pin</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={(e) => onStartRename(contextMenu.session, e)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-primary hover:bg-bg-hover transition-colors cursor-pointer text-left"
      >
        <Pencil size={14} className="text-text-muted" />
        <span>Rename</span>
      </button>

      {onToggleEmbedding && (
        <button
          type="button"
          disabled={isEmbeddingLoading}
          onClick={(e) => onToggleEmbedding(contextMenu.session, e)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left ${
            isEmbedded
              ? 'text-amber-600 hover:bg-amber-500/10'
              : 'text-accent-primary hover:bg-accent-primary/10'
          } ${isEmbeddingLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isEmbeddingLoading ? (
            <>
              <Loader2 size={14} className="animate-spin text-accent-primary" />
              <span>Memproses Vektor...</span>
            </>
          ) : isEmbedded ? (
            <>
              <DatabaseZap size={14} className="text-amber-500" />
              <span>Hapus Memori RAG</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-accent-primary" />
              <span>Index ke Memori RAG</span>
            </>
          )}
        </button>
      )}

      <div className="h-px bg-border-subtle my-0.5" />

      <button
        type="button"
        onClick={(e) => onDeleteSession(contextMenu.session.id, e)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-status-error hover:bg-status-error-bg transition-colors cursor-pointer text-left font-medium"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </div>
  </>
  );
};
