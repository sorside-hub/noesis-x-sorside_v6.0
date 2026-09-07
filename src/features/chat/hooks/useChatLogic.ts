import { useState, useRef, useEffect, useCallback } from 'react';
import { VaultData, FileNode } from '../../../types/vault';
import { ChatMessageRecord } from '../../../lib/db';
import { retrieveChatContext } from '../services/chatContextRetriever';
import { executeChatStream, summarizeChatMemory } from '../services/chatStreamClient';
import { useChatSessionManager } from './useChatSessionManager';
import { useChatMarkdownRenderer } from './useChatMarkdownRenderer';

export type ChatMode = 'rag' | 'current';

export function useChatLogic(vault: VaultData, activeTabId: string | null) {
  // Session & Message management from specialized hook
  const {
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
  } = useChatSessionManager();

  // Context Inspector Expand States per Message ID
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});

  // Input & Settings
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('rag');
  const [topK, setTopK] = useState<number>(5);
  const [threshold, setThreshold] = useState<number>(0.55);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<'idle' | 'rag' | 'generating'>('idle');
  const [renderedHtmlMap, setRenderedHtmlMap] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isProcessingRef = useRef(false);

  const activeNode =
    activeTabId && vault.nodes[activeTabId] ? (vault.nodes[activeTabId] as FileNode) : null;

  // Render markdown for assistant messages with caching
  useChatMarkdownRenderer({
    messages,
    vaultNodes: vault.nodes,
    setRenderedHtmlMap,
  });

  // Auto-scroll is now handled inside ChatMessageFeed directly using Smart Scroll

  // Toggle Context Inspector Accordion per Message
  const toggleContextInspector = useCallback((msgId: string) => {
    setExpandedContexts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  }, []);

  // Core AI Stream Pipeline (Reusable for both standard send and message editing)
  const runAiPipeline = useCallback(
    async (query: string, aiMsg: ChatMessageRecord) => {
      try {
        const { contextText, sources, chunksToSave } = await retrieveChatContext(
          query,
          mode,
          activeNode,
          topK,
          threshold
        );

        // Collect chat history up to before this message
        const historyPayload = messages
          .filter((m) => m.id !== aiMsg.id && m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content }));

        setProcessingPhase('generating');
        const { finalContent, failoverResult } = await executeChatStream({
          query,
          contextText,
          chatHistory: historyPayload,
          memorySummary: activeSession?.memorySummary,
          onChunk: (_chunk, currentFullText) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsg.id ? { ...msg, content: currentFullText } : msg
              )
            );
          },
        });

        const finalAiMsg: ChatMessageRecord = {
          ...aiMsg,
          content: finalContent,
          sources,
          chunks: chunksToSave,
          cascadeLog: failoverResult?.attempts || [],
        };

        await saveChatMessage(finalAiMsg);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsg.id ? finalAiMsg : msg))
        );

        // =========================================================================
        // Smart Batch Rolling Memory Compression
        // Kept 8 most recent messages in active window. Older messages are compressed in batches of 6.
        // =========================================================================
        const updatedTotalMessages = [...messages, finalAiMsg];
        const recentWindowSize = 8;
        const batchChunkSize = 6;

        if (updatedTotalMessages.length >= recentWindowSize + batchChunkSize && activeSessionId) {
          const eligibleMessages = updatedTotalMessages.slice(0, -recentWindowSize);
          const lastSummarized = activeSession?.lastSummarizedMsgCount || 0;
          const unsummarizedDelta = eligibleMessages.length - lastSummarized;

          if (unsummarizedDelta >= batchChunkSize) {
            // Schedule non-blocking background summarization for only the unsummarized batch delta
            setTimeout(async () => {
              try {
                const batchToCompress = eligibleMessages
                  .slice(lastSummarized)
                  .map((m) => ({ role: m.role, content: m.content }));

                if (batchToCompress.length > 0) {
                  const newSummary = await summarizeChatMemory(
                    batchToCompress,
                    activeSession?.memorySummary
                  );

                  if (newSummary && newSummary.trim().length > 0) {
                    const newSummarizedCount = eligibleMessages.length;
                    await updateSessionMemory(activeSessionId, newSummary.trim(), newSummarizedCount);
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === activeSessionId
                          ? {
                              ...s,
                              memorySummary: newSummary.trim(),
                              lastSummarizedMsgCount: newSummarizedCount,
                            }
                          : s
                      )
                    );
                  }
                }
              } catch (err) {
                console.warn('[MemoryCompression] Background batch compression error:', err);
              }
            }, 500);
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        const errAiMsg: ChatMessageRecord = {
          ...aiMsg,
          content: '⚠️ Terjadi kesalahan saat memproses jawaban AI.',
        };
        await saveChatMessage(errAiMsg);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsg.id ? errAiMsg : msg))
        );
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
        setProcessingPhase('idle');
      }
    },
    [
      mode,
      topK,
      threshold,
      activeNode,
      messages,
      activeSession,
      activeSessionId,
      setMessages,
      saveChatMessage,
      updateSessionMemory,
      setSessions,
    ]
  );

  // Send Message Logic
  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query || isProcessingRef.current) return;

      isProcessingRef.current = true;
      setInput('');
      setIsProcessing(true);
      setProcessingPhase(mode === 'rag' ? 'rag' : 'generating');

      let currentSessionId = activeSessionId;
      let isNewSessionCreated = false;

      if (!currentSessionId) {
        const autoTitle = query.length > 25 ? query.substring(0, 25) + '...' : query;
        const newSess = await createChatSession(autoTitle);
        currentSessionId = newSess.id;
        setActiveSessionId(newSess.id);
        setSessions((prev) => [newSess, ...prev]);
        isNewSessionCreated = true;
      }

      const now = Date.now();
      const userMsgId = `msg_${now}_${crypto.randomUUID().substring(0, 8)}_usr`;
      const userMsg: ChatMessageRecord = {
        id: userMsgId,
        sessionId: currentSessionId,
        role: 'user',
        content: query,
        createdAt: new Date(now).toISOString(),
      };

      const aiMsgId = `msg_${now + 1}_${crypto.randomUUID().substring(0, 8)}_ai`;
      const aiMsg: ChatMessageRecord = {
        id: aiMsgId,
        sessionId: currentSessionId,
        role: 'assistant',
        content: '',
        createdAt: new Date(now + 1).toISOString(),
      };

      await saveChatMessage(userMsg);
      setMessages((prev) => {
        const map = new Map<string, ChatMessageRecord>();
        prev.forEach((m) => map.set(m.id, m));
        map.set(userMsg.id, userMsg);
        map.set(aiMsg.id, aiMsg);
        return Array.from(map.values());
      });

      const currentSession = sessions.find((s) => s.id === currentSessionId);
      if (
        !isNewSessionCreated &&
        currentSession &&
        currentSession.title === 'Percakapan Baru' &&
        messages.length === 0
      ) {
        const autoTitle = query.length > 25 ? query.substring(0, 25) + '...' : query;
        await renameChatSession(currentSessionId, autoTitle);
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSessionId ? { ...s, title: autoTitle } : s))
        );
      }

      await runAiPipeline(query, aiMsg);
    },
    [
      input,
      activeSessionId,
      sessions,
      messages.length,
      createChatSession,
      setActiveSessionId,
      setSessions,
      saveChatMessage,
      setMessages,
      renameChatSession,
      runAiPipeline,
    ]
  );

  // Edit User Message & Regenerate from that point
  const handleEditUserMessage = useCallback(
    async (userMsgId: string, newContent: string) => {
      const query = newContent.trim();
      if (!query || isProcessingRef.current || !activeSessionId) return;

      isProcessingRef.current = true;
      setIsProcessing(true);
      setProcessingPhase(mode === 'rag' ? 'rag' : 'generating');

      const msgIdx = messages.findIndex((m) => m.id === userMsgId);
      if (msgIdx === -1) {
        isProcessingRef.current = false;
        setIsProcessing(false);
        setProcessingPhase('idle');
        return;
      }

      // Delete subsequent messages from DB
      const subsequentMsgs = messages.slice(msgIdx + 1);
      const idsToDelete = subsequentMsgs.map((m) => m.id);
      if (idsToDelete.length > 0) {
        try {
          await deleteChatMessages(idsToDelete);
        } catch (err) {
          console.error('Failed to delete subsequent messages:', err);
        }
      }

      // Update the target user message
      const targetMsg = messages[msgIdx];
      const now = Date.now();
      const updatedUserMsg: ChatMessageRecord = {
        ...targetMsg,
        content: query,
        createdAt: new Date(now).toISOString(),
      };
      await saveChatMessage(updatedUserMsg);

      // Create new AI response placeholder
      const aiMsgId = `msg_${now + 1}_${crypto.randomUUID().substring(0, 8)}_ai`;
      const newAiMsg: ChatMessageRecord = {
        id: aiMsgId,
        sessionId: activeSessionId,
        role: 'assistant',
        content: '',
        createdAt: new Date(now + 1).toISOString(),
      };

      const keptBefore = messages.slice(0, msgIdx);
      setMessages([...keptBefore, updatedUserMsg, newAiMsg]);

      await runAiPipeline(query, newAiMsg);
    },
    [activeSessionId, messages, deleteChatMessages, saveChatMessage, setMessages, runAiPipeline]
  );

  return {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    messages,
    setMessages,
    input,
    setInput,
    mode,
    setMode,
    topK,
    setTopK,
    threshold,
    setThreshold,
    isProcessing,
    processingPhase,
    renderedHtmlMap,
    expandedContexts,
    messagesEndRef,
    textareaRef,
    activeNode,
    handleSend,
    handleEditUserMessage,
    handleNewChat,
    toggleContextInspector,
  };
}
