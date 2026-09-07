import React, { useState, useRef, useEffect, UIEvent, useLayoutEffect, useMemo } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { ChatMessageRecord } from '../../../lib/db';
import { ChatMode } from '../hooks/useChatLogic';
import { useNavigation } from '../../../context/NavigationContext';
import { useVault } from '../../../hooks/useVault';
import { renderMarkdownSync } from '../../../lib/editor/markdownRenderer';
import { UserMessageBubble } from './UserMessageBubble';
import { AssistantMessageFooter } from './AssistantMessageFooter';
import { CascadeLogModal } from './CascadeLogModal';

interface ChatMessageFeedProps {
  messages: ChatMessageRecord[];
  activeSessionId?: string;
  renderedHtmlMap: Record<string, string>;
  expandedContexts?: Record<string, boolean>;
  toggleContextInspector?: (msgId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  mode: ChatMode;
  activeNodeName?: string;
  vaultState?: ReturnType<typeof useVault>;
  isProcessing?: boolean;
  processingPhase?: 'idle' | 'rag' | 'generating';
  onEditMessage?: (userMsgId: string, newContent: string) => void;
}

const MarkdownContent: React.FC<{ content: string; nodes?: any }> = React.memo(({ content, nodes }) => {
  const html = useMemo(() => {
    if (!content) return '';
    return renderMarkdownSync(content, nodes);
  }, [content, nodes]);

  return (
    <div
      className="prose dark:prose-invert max-w-none text-text-primary text-sm font-sans leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export const ChatMessageFeed: React.FC<ChatMessageFeedProps> = ({
  messages,
  activeSessionId,
  renderedHtmlMap,
  messagesEndRef,
  vaultState,
  isProcessing = false,
  processingPhase = 'idle',
  onEditMessage,
}) => {
  const { navigateToNote, navigateView } = useNavigation();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);


  // Local state for mutually exclusive active footer tab per message ('sources' | 'chunks' | null)
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'sources' | 'chunks' | null>>({});

  // Local state for copy notification
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [activeLogMsgId, setActiveLogMsgId] = useState<string | null>(null);

  // Local state for inline user message editing
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>('');

  const toggleTab = (msgId: string, tab: 'sources' | 'chunks') => {
    setActiveTabMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === tab ? null : tab,
    }));
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => {
      setCopiedMsgId(null);
    }, 2000);
  };

  const startEditing = (msgId: string, content: string) => {
    setEditingMsgId(msgId);
    setEditDraft(content);
  };

  const cancelEditing = () => {
    setEditingMsgId(null);
    setEditDraft('');
  };

  const submitEdit = (msgId: string) => {
    if (!editDraft.trim() || isProcessing) return;
    onEditMessage?.(msgId, editDraft.trim());
    setEditingMsgId(null);
    setEditDraft('');
  };

  const handleCreateNoteFromMsg = (msgContent: string) => {
    if (!vaultState) return;

    // Extract clean title from message text
    const cleanText = msgContent.replace(/[#*`_]/g, '').trim();
    const firstLine = cleanText.split('\n')[0] || 'Hasil Chat AI';
    const noteTitle = firstLine.length > 35 ? firstLine.substring(0, 35) + '...' : firstLine;

    const newNoteId = vaultState.createNote(null, `AI - ${noteTitle}`);
    if (newNoteId) {
      vaultState.updateNoteContent(newNoteId, msgContent);
      navigateToNote(newNoteId);
      navigateView('vault');
    }
  };

  // Safeguard: deduplicate messages by id to guarantee unique keys
  const uniqueMessages = useMemo(() => {
    return Array.from(
      new Map<string, ChatMessageRecord>(messages.map((m) => [m.id, m])).values()
    );
  }, [messages]);

  const activeLogMessage = messages.find((m) => m.id === activeLogMsgId);

  const sessionScrollMap = useRef(new Map<string, number>());
  const prevSessionId = useRef<string | undefined>(activeSessionId);

  const isAutoScrollRef = useRef(true);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
    setShowScrollBtn(!isAtBottom);
    isAutoScrollRef.current = isAtBottom;
    if (activeSessionId) {
      sessionScrollMap.current.set(activeSessionId, scrollTop);
    }
  };

  const scrollToBottom = () => {
    setIsAutoScroll(true);
    setShowScrollBtn(false);
    isAutoScrollRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const prevLastMsgId = useRef<string | null>(null);

  // Scroll restoration on session change and auto-scroll on new message
  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Determine if the session has changed
    const isSessionChanged = activeSessionId !== prevSessionId.current;
    
    if (isSessionChanged) {
      prevSessionId.current = activeSessionId;
      if (activeSessionId && sessionScrollMap.current.has(activeSessionId)) {
        // Restore previous scroll position for this session
        scrollContainer.scrollTop = sessionScrollMap.current.get(activeSessionId)!;
        
        // Also update the button visibility state
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
        setIsAutoScroll(isAtBottom);
        setShowScrollBtn(!isAtBottom);
        isAutoScrollRef.current = isAtBottom;
      } else {
        // New or unseen session: start at the bottom
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        setIsAutoScroll(true);
        setShowScrollBtn(false);
        isAutoScrollRef.current = true;
      }
    }

    const lastMsg = uniqueMessages[uniqueMessages.length - 1];
    const isNewMessage = lastMsg && lastMsg.id !== prevLastMsgId.current;

    if (isNewMessage) {
      // Scroll to show the newly submitted user prompt & loading indicator
      setShowScrollBtn(false);
      setIsAutoScroll(true);
      isAutoScrollRef.current = true;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      if (lastMsg) prevLastMsgId.current = lastMsg.id;
    } else if (isAutoScrollRef.current) {
      // Keep tracking the bottom as content (like renderedHtmlMap) dynamically loads in
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
    // Absolutely NO auto-scroll while streaming unless user is already at the bottom
  }, [uniqueMessages, activeSessionId, renderedHtmlMap]);


  return (
    <>
    <div 
      ref={scrollContainerRef} 
      onScroll={handleScroll} 
      className="flex-1 overflow-y-auto px-4 pt-14 pb-0 flex flex-col"
      style={{ overflowAnchor: 'none' }}
    >
      {uniqueMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center select-none py-8 relative">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(var(--accent-primary) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* CSS Geometric Diamond Logo */}
            <div className="w-16 h-16 bg-accent-primary rounded-md flex items-center justify-center rotate-45 shadow-[0_0_30px_rgba(197,163,106,0.3)] mb-6">
              <div className="w-8 h-8 border-2 border-bg-primary -rotate-45" />
            </div>

            <h2 className="text-xl md:text-2xl font-serif font-bold text-accent-primary tracking-tight mb-2">
              NOESIS CHAT
            </h2>
            <p className="text-xs text-text-muted max-w-sm leading-relaxed">
              Tanyakan apa saja seputar catatan atau biarkan AI menganalisis dan mensintesis wawasan
              dari seluruh Vault Anda.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto space-y-8 pb-0">
          {uniqueMessages.map((msg, index) => {
            const isLastAssistantMessage =
              isProcessing && index === uniqueMessages.length - 1 && msg.role === 'assistant';

            return (
              <div key={msg.id} className="w-full space-y-3">
                {msg.role === 'user' ? (
                  <UserMessageBubble
                    msg={msg}
                    isEditing={editingMsgId === msg.id}
                    editDraft={editDraft}
                    isProcessing={isProcessing}
                    isCopied={copiedMsgId === msg.id}
                    onEditDraftChange={setEditDraft}
                    onStartEditing={() => startEditing(msg.id, msg.content)}
                    onCancelEditing={cancelEditing}
                    onSubmitEdit={() => submitEdit(msg.id)}
                    onCopy={() => handleCopy(msg.id, msg.content)}
                  />
                ) : (
                  <div className="w-full space-y-3 pt-1">
                    {!msg.content || msg.content.trim().length === 0 ? (
                      /* Minimalist 3-dots pulsing/bouncing loading animation */
                      <div className="flex items-center gap-1.5 py-2 px-1 text-accent-primary">
                        <span className="w-2 h-2 rounded-full bg-accent-primary/80 animate-bounce [animation-duration:0.6s] [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-accent-primary/80 animate-bounce [animation-duration:0.6s] [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-accent-primary/80 animate-bounce [animation-duration:0.6s]" />
                      </div>
                    ) : (
                      <div className="relative">
                        {isLastAssistantMessage ? (
                          <div className="text-text-primary text-sm font-sans leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                            <span
                              className="inline-block w-1.5 h-4 ml-1 bg-accent-primary animate-pulse align-middle rounded-xs"
                              title="Mengetik..."
                            />
                          </div>
                        ) : (
                          <MarkdownContent content={msg.content} nodes={vaultState?.vault?.nodes} />
                        )}
                      </div>
                    )}

                    {!isLastAssistantMessage && msg.content && msg.content.trim().length > 0 && (
                      <AssistantMessageFooter
                        msg={msg}
                        activeTab={activeTabMap[msg.id] || null}
                        isCopied={copiedMsgId === msg.id}
                        canCreateNote={!!vaultState}
                        onToggleTab={(tab) => toggleTab(msg.id, tab)}
                        onOpenLog={() => setActiveLogMsgId(msg.id)}
                        onCopy={() => handleCopy(msg.id, msg.content)}
                        onCreateNote={() => handleCreateNoteFromMsg(msg.content)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      

      {/* Cascade Log Modal */}
      <CascadeLogModal
        cascadeLog={activeLogMessage?.cascadeLog || null}
        onClose={() => setActiveLogMsgId(null)}
      />
    </div>

    {/* Floating Scroll to Bottom Button */}
    {showScrollBtn && (
      <div className="absolute bottom-20 lg:bottom-24 left-0 right-0 z-40 pointer-events-none flex justify-center px-4 md:px-8">
        <div className="max-w-3xl w-full flex justify-end">
          <button
            onClick={scrollToBottom}
            className="pointer-events-auto p-2 rounded-full bg-bg-surface border border-border-default text-text-primary shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:border-accent-primary hover:text-accent-primary transition-all animate-in fade-in slide-in-from-bottom-2 cursor-pointer flex items-center justify-center"
            title="Scroll to bottom"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      </div>
    )}
    </>
  );
};
