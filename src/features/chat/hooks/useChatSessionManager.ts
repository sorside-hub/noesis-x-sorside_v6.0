import { useState, useEffect, useCallback } from 'react';
import { ChatSessionRecord, ChatMessageRecord } from '../../../lib/db';
import {
  getAllChatSessions,
  createChatSession,
  renameChatSession,
  updateSessionMemory,
  getSessionMessages,
  saveChatMessage,
  deleteChatMessages,
} from '../services/chatStorage';

export function useChatSessionManager() {
  const [sessions, setSessions] = useState<ChatSessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    try {
      const list = await getAllChatSessions();
      setSessions(list);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  }, []);

  // Auto-select latest session on initial load only
  useEffect(() => {
    getAllChatSessions()
      .then((list) => {
        if (list.length > 0) {
          setActiveSessionId((prev) => prev || list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadSessions();

    const handleChatUpdated = () => {
      loadSessions();
      if (activeSessionId) {
        getSessionMessages(activeSessionId)
          .then((msgs) => setMessages(msgs))
          .catch(console.error);
      }
    };

    window.addEventListener('chat-updated', handleChatUpdated);
    return () => window.removeEventListener('chat-updated', handleChatUpdated);
  }, [loadSessions, activeSessionId]);

  // Load messages when activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    let isMounted = true;

    const loadMsgs = async () => {
      const msgs = await getSessionMessages(activeSessionId);
      if (isMounted) {
        setMessages((prev) => {
          const map = new Map<string, ChatMessageRecord>();
          // DB records first
          msgs.forEach((m) => map.set(m.id, m));
          // Preserve any in-memory active streaming/unsaved messages
          prev.forEach((m) => {
            if (m.sessionId === activeSessionId && !map.has(m.id)) {
              map.set(m.id, m);
            }
          });
          return Array.from(map.values());
        });
      }
    };

    loadMsgs();
    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);

  const handleNewChat = useCallback((onCloseSidebar?: any) => {
    setActiveSessionId(null);
    setMessages([]);
    if (typeof onCloseSidebar === 'function') {
      onCloseSidebar();
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    messages,
    setMessages,
    handleNewChat,
    createChatSession,
    renameChatSession,
    updateSessionMemory,
    saveChatMessage,
    deleteChatMessages,
  };
}
