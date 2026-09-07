import React, { useRef } from 'react';
import { Pin, MessageSquare, MoreVertical } from 'lucide-react';
import { ChatSessionRecord } from '../../../lib/db';

interface ChatSessionItemProps {
  session: ChatSessionRecord;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
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
      onTouchContextMenu(
        Math.min(clientX, window.innerWidth - 180),
        Math.min(clientY, window.innerHeight - 150)
      );
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
          <span className="truncate">{session.title}</span>
        )}
      </div>

      {/* 3-dots popup trigger button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu(
            Math.min(e.clientX, window.innerWidth - 180),
            Math.min(e.clientY, window.innerHeight - 150)
          );
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-text-primary text-text-muted rounded cursor-pointer transition-opacity"
      >
        <MoreVertical size={13} />
      </button>
    </div>
  );
};
