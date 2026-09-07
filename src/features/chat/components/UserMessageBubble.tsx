import React from 'react';
import { Pencil, Copy, Check } from 'lucide-react';
import { ChatMessageRecord } from '../../../lib/db';

interface UserMessageBubbleProps {
  msg: ChatMessageRecord;
  isEditing: boolean;
  editDraft: string;
  isProcessing: boolean;
  isCopied: boolean;
  onEditDraftChange: (val: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSubmitEdit: () => void;
  onCopy: () => void;
}

export const UserMessageBubble: React.FC<UserMessageBubbleProps> = ({
  msg,
  isEditing,
  editDraft,
  isProcessing,
  isCopied,
  onEditDraftChange,
  onStartEditing,
  onCancelEditing,
  onSubmitEdit,
  onCopy,
}) => {
  if (isEditing) {
    return (
      <div className="flex flex-col items-end w-full space-y-2">
        <div className="w-full sm:max-w-[85%] bg-bg-surface border border-accent-primary/60 rounded-2xl p-3 shadow-md space-y-2.5">
          <textarea
            value={editDraft}
            onChange={(e) => onEditDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onSubmitEdit();
              }
            }}
            rows={Math.max(2, Math.min(8, editDraft.split('\n').length))}
            className="w-full bg-bg-primary/60 border border-border-default rounded-xl p-2.5 text-sm text-text-primary outline-hidden focus:border-accent-primary resize-none font-sans leading-relaxed"
            placeholder="Edit pesan Anda..."
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onCancelEditing}
              className="px-3 py-1.5 rounded-lg border border-border-default bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSubmitEdit}
              disabled={!editDraft.trim() || isProcessing}
              className="px-3.5 py-1.5 rounded-lg bg-accent-primary text-accent-contrast font-semibold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Kirim Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end w-full">
        <div className="bg-accent-primary text-accent-contrast font-medium border border-accent-primary rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[75%] shadow-xs text-sm font-sans leading-relaxed break-words whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>

      {/* Action buttons below the bubble on the far right */}
      <div className="flex items-center gap-1 pt-0.5">
        <button
          type="button"
          onClick={onStartEditing}
          disabled={isProcessing}
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-30"
          title="Edit pesan"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          title={isCopied ? 'Tersalin!' : 'Salin pesan'}
        >
          {isCopied ? (
            <Check size={12} className="text-accent-primary" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      </div>
    </div>
  );
};
