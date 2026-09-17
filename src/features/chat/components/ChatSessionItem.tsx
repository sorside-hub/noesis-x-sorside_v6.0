import React, { useRef } from 'react';
import { Pin, MessageSquare, MoreVertical, Sparkles } from 'lucide-react';
import { ChatSessionRecord } from '../../../lib/db';

interface ChatSessionItemProps {
  session: ChatSessionRecord;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  isEmbedded?: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onTouchContextMenu: (x: number, y: number) => void;
  onEditChange: (val: string) => void;
  onSaveRename: (customTitle?: string) => void;
  onCancelRename: () => void;
  onOpenMenu: (x: number, y: number) => void;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isActive,
  isEditing,
  editingTitle,
  isEmbedded = false,
  onSelect,
  onContextMenu,
  onTouchContextMenu,
  onEditChange,
  onSaveRename,
  onCancelRename,
  onOpenMenu,
}) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    longPressTimerRef.current = setTimeout(() => {
      const menuWidth = 195;
      const menuHeight = 185;
      let x = clientX - menuWidth / 2;
      let y = clientY + 8;
      x = Math.max(12, Math.min(x, window.innerWidth - menuWidth - 12));
      if (y + menuHeight > window.innerHeight) {
        y = Math.max(12, clientY - menuHeight - 8);
      }
      onTouchContextMenu(x, y);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
        isActive
          ? 'bg-bg-hover border-l-2 border-accent-primary text-text-heading font-semibold shadow-2xs'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {session.isPinned ? (
          <Pin size={13} className="shrink-0 text-accent-primary fill-accent-primary/20" />
        ) : (
          <MessageSquare size={13} className="shrink-0 text-text-muted" />
        )}

        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onSaveRename();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onCancelRename();
              }
            }}
            onBlur={() => onSaveRename()}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="w-full bg-bg-primary border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary outline-hidden"
          />
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="truncate">{session.title}</span>
            {isEmbedded && (
              <span
                title="Sesi ini aktif di Memori RAG"
                className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-accent-primary/10 text-accent-primary text-[9px] font-medium"
              >
                <Sparkles size={9} />
                <span className="hidden group-hover:inline">RAG</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3-dots popup trigger button (Always accessible on mobile, hover on desktop) */}
      <button
        type="button"
        title="Opsi Sesi"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const menuWidth = 195;
          const menuHeight = 185;
          let x = rect.right - menuWidth;
          let y = rect.bottom + 4;
          x = Math.max(12, Math.min(x, window.innerWidth - menuWidth - 12));
          if (y + menuHeight > window.innerHeight) {
            y = Math.max(12, rect.top - menuHeight - 4);
          }
          onOpenMenu(x, y);
        }}
        className="opacity-70 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 hover:text-text-primary text-text-muted rounded-md hover:bg-bg-hover cursor-pointer transition-opacity shrink-0 ml-1"
      >
        <MoreVertical size={13} />
      </button>
    </div>
  );
};
