import React from 'react';
import { Pin, PinOff, Pencil, Trash2 } from 'lucide-react';
import { ChatSessionRecord } from '../../../lib/db';

interface ChatSessionContextMenuProps {
  contextMenu: {
    session: ChatSessionRecord;
    x: number;
    y: number;
  } | null;
  onTogglePin: (sess: ChatSessionRecord, e?: React.MouseEvent) => void;
  onStartRename: (sess: ChatSessionRecord, e?: React.MouseEvent) => void;
  onDeleteSession: (sessId: string, e?: React.MouseEvent) => void;
}

export const ChatSessionContextMenu: React.FC<ChatSessionContextMenuProps> = ({
  contextMenu,
  onTogglePin,
  onStartRename,
  onDeleteSession,
}) => {
  if (!contextMenu) return null;

  return (
    <div
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 w-44 bg-bg-surface border border-border-default rounded-xl p-1 shadow-xl space-y-0.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
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
  );
};
