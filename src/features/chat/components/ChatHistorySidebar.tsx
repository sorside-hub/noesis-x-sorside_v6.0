import React, { useState, useEffect } from 'react';
import {
  Folder,
  Plus,
  Pin,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react';
import { ChatSessionRecord, ChatMessageRecord } from '../../../lib/db';
import {
  deleteChatSession,
  togglePinChatSession,
  renameChatSession,
} from '../services/chatStorage';
import { ChatSessionContextMenu } from './ChatSessionContextMenu';
import { ChatSessionItem } from './ChatSessionItem';

interface ChatHistorySidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  sessions: ChatSessionRecord[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSessionRecord[]>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageRecord[]>>;
  onNewChat: () => void;
  className?: string;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  setActiveSessionId,
  setSessions,
  setMessages,
  onNewChat,
  className,
}) => {
  // Folder Collapsed States
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Editing session title
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Context Menu Popup State
  const [contextMenu, setContextMenu] = useState<{
    session: ChatSessionRecord;
    x: number;
    y: number;
  } | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const toggleFolder = (folderKey: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const handleDeleteSession = async (sessId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setContextMenu(null);

    try {
      await deleteChatSession(sessId);
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sessId);
        if (activeSessionId === sessId) {
          if (updated.length > 0) {
            setActiveSessionId(updated[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete chat session:', err);
    }
  };

  const handleTogglePin = async (sess: ChatSessionRecord, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newPinned = !sess.isPinned;
    await togglePinChatSession(sess.id, newPinned);
    setSessions((prev) =>
      prev.map((s) => (s.id === sess.id ? { ...s, isPinned: newPinned } : s))
    );
    setContextMenu(null);
  };

  const handleStartRename = (sess: ChatSessionRecord, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingSessionId(sess.id);
    setEditingTitle(sess.title);
    setContextMenu(null);
  };

  const handleSaveRename = async (sessId: string, customTitle?: string) => {
    const titleToSave = (customTitle !== undefined ? customTitle : editingTitle).trim();
    if (!titleToSave) {
      setEditingSessionId(null);
      return;
    }

    await renameChatSession(sessId, titleToSave);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? { ...s, title: titleToSave } : s))
    );
    setEditingSessionId(null);
  };

  // Time Grouping Helper
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

  const pinnedSessions = sessions.filter((s) => s.isPinned);
  const unpinnedSessions = sessions.filter((s) => !s.isPinned);

  const todaySessions = unpinnedSessions.filter(
    (s) => new Date(s.updatedAt).getTime() >= todayStart
  );
  const last7DaysSessions = unpinnedSessions.filter((s) => {
    const t = new Date(s.updatedAt).getTime();
    return t < todayStart && t >= sevenDaysAgo;
  });
  const olderSessions = unpinnedSessions.filter(
    (s) => new Date(s.updatedAt).getTime() < sevenDaysAgo
  );

  const renderSessionItem = (sess: ChatSessionRecord) => (
    <ChatSessionItem
      key={sess.id}
      session={sess}
      isActive={sess.id === activeSessionId}
      isEditing={sess.id === editingSessionId}
      editingTitle={editingTitle}
      onSelect={() => {
        setActiveSessionId(sess.id);
        onClose?.();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
          session: sess,
          x: Math.min(e.clientX, window.innerWidth - 180),
          y: Math.min(e.clientY, window.innerHeight - 150),
        });
      }}
      onTouchContextMenu={(x, y) => {
        setContextMenu({ session: sess, x, y });
      }}
      onEditChange={setEditingTitle}
      onSaveRename={() => handleSaveRename(sess.id)}
      onCancelRename={() => setEditingSessionId(null)}
      onOpenMenu={(x, y) => {
        setContextMenu({ session: sess, x, y });
      }}
    />
  );

  return (
    <>
      <ChatSessionContextMenu
        contextMenu={contextMenu}
        onTogglePin={handleTogglePin}
        onStartRename={handleStartRename}
        onDeleteSession={handleDeleteSession}
      />

      {/* LEFT SIDEBAR (FOLDER TREE CHAT HISTORY) */}
      <aside
        className={
          className ||
          'h-full w-full bg-bg-surface flex flex-col overflow-hidden relative select-none'
        }
      >
        {/* Header Left Sidebar */}
        <div className="h-14 px-4 border-b border-border-default flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <MessageSquare size={14} className="text-accent-primary" /> Riwayat Chat
          </span>
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (onClose) onClose();
            }}
            title="Percakapan Baru"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-95 transition-all cursor-pointer text-xs font-semibold shadow-xs"
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Folder Tree Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* 1. PINNED CATEGORY */}
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleFolder('pinned')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-accent-primary hover:opacity-80 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Pin size={12} className="fill-accent-primary/20" /> Disematkan ({pinnedSessions.length})
                </span>
                {collapsedFolders['pinned'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!collapsedFolders['pinned'] && (
                <div className="pl-1.5 border-l-2 border-accent-primary/30 ml-2 space-y-0.5">
                  {pinnedSessions.map(renderSessionItem)}
                </div>
              )}
            </div>
          )}

          {/* 2. TODAY CATEGORY */}
          {todaySessions.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleFolder('today')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock size={12} /> Hari Ini ({todaySessions.length})
                </span>
                {collapsedFolders['today'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!collapsedFolders['today'] && (
                <div className="pl-1.5 border-l-2 border-border-default ml-2 space-y-0.5">
                  {todaySessions.map(renderSessionItem)}
                </div>
              )}
            </div>
          )}

          {/* 3. LAST 7 DAYS CATEGORY */}
          {last7DaysSessions.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleFolder('last7')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar size={12} /> 7 Hari Terakhir ({last7DaysSessions.length})
                </span>
                {collapsedFolders['last7'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!collapsedFolders['last7'] && (
                <div className="pl-1.5 border-l-2 border-border-default ml-2 space-y-0.5">
                  {last7DaysSessions.map(renderSessionItem)}
                </div>
              )}
            </div>
          )}

          {/* 4. OLDER CATEGORY */}
          {olderSessions.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => toggleFolder('older')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Folder size={12} /> Lebih Lama ({olderSessions.length})
                </span>
                {collapsedFolders['older'] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {!collapsedFolders['older'] && (
                <div className="pl-1.5 border-l-2 border-border-default ml-2 space-y-0.5">
                  {olderSessions.map(renderSessionItem)}
                </div>
              )}
            </div>
          )}

          {sessions.length === 0 && (
            <div className="py-8 text-center text-xs text-text-muted">
              Belum ada riwayat chat
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
