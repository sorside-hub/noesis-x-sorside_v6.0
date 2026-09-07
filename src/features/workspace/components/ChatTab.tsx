import React, { useState, useRef, useEffect, useLayoutEffect, UIEvent } from 'react';
import { Send, Loader2, Bot, Trash2, ArrowDown } from 'lucide-react';
import { FileNode, NoteMetadata } from '../../../types/vault';
import { useAiActions } from '../../editor/hooks/useAiActions';
import { renderMarkdown } from '../../../lib/editor/markdownRenderer';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChatTabProps {
  activeNode: FileNode;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ activeNode, onUpdateMetadata }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { isLoading, error, executeAction } = useAiActions();
  const [renderedHtmlMap, setRenderedHtmlMap] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Load messages from metadata when active node changes
  useEffect(() => {
    const history = (activeNode.metadata?.chatHistory as ChatMessage[]) || [];
    setMessages(history);
    setInput('');
  }, [activeNode.id]); // Deliberately not including metadata.chatHistory to avoid infinite loop while typing

  // Async Markdown Rendering
  useEffect(() => {
    let isMounted = true;
    const renderMessages = async () => {
      const updates: Record<string, string> = {};
      let hasChanges = false;
      for (const msg of messages) {
        if (msg.role === 'ai' && msg.content && !renderedHtmlMap[msg.id]) {
          try {
            const html = await renderMarkdown(msg.content);
            updates[msg.id] = html;
            hasChanges = true;
          } catch (err) {
            updates[msg.id] = `<p>${msg.content}</p>`;
            hasChanges = true;
          }
        }
      }
      if (isMounted && hasChanges) {
        setRenderedHtmlMap((prev) => ({ ...prev, ...updates }));
      }
    };
    renderMessages();
    return () => {
      isMounted = false;
    };
  }, [messages, renderedHtmlMap]);

  const isAutoScrollRef = useRef(true);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollBtn(!isAtBottom);
    isAutoScrollRef.current = isAtBottom;
    if (activeNode.id) {
      nodeScrollMap.current.set(activeNode.id, scrollTop);
    }
  };

  const scrollToBottom = () => {
    setShowScrollBtn(false);
    isAutoScrollRef.current = true;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const prevLastMsgId = useRef<string | null>(null);
  const nodeScrollMap = useRef(new Map<string, number>());
  const prevNodeId = useRef<string | undefined>(activeNode.id);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let shouldScrollToBottom = false;

    const isNodeChanged = activeNode.id !== prevNodeId.current;
    if (isNodeChanged) {
      prevNodeId.current = activeNode.id;
      if (activeNode.id && nodeScrollMap.current.has(activeNode.id)) {
        scrollContainer.scrollTop = nodeScrollMap.current.get(activeNode.id)!;
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
        setShowScrollBtn(!isAtBottom);
        isAutoScrollRef.current = isAtBottom;
      } else {
        shouldScrollToBottom = true;
        setShowScrollBtn(false);
        isAutoScrollRef.current = true;
      }
    } else if (isAutoScrollRef.current) {
      shouldScrollToBottom = true;
    }

    const lastMsg = messages[messages.length - 1];
    const isNewMessage = lastMsg && lastMsg.id !== prevLastMsgId.current;

    if (isNewMessage) {
      shouldScrollToBottom = true;
      setShowScrollBtn(false);
      isAutoScrollRef.current = true;
      if (lastMsg) prevLastMsgId.current = lastMsg.id;
    }

    if (shouldScrollToBottom) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, activeNode.id, renderedHtmlMap]);

  const updateMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    onUpdateMetadata(activeNode.id, { chatHistory: newMessages });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const tempMessages = [...messages, userMessage];
    updateMessages(tempMessages);
    setInput('');

    // Append context of the note. Limit length if it's too big to avoid payload issues.
    // 30,000 characters is roughly 7,500 tokens, well within Gemini limits.
    const noteContent = activeNode.content || '';
    const safeContent = noteContent.length > 30000 ? noteContent.substring(0, 30000) + '\n\n[Content truncated due to length]' : noteContent;

    const result = await executeAction('ask', safeContent, userMessage.content);

    if (result) {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result,
      };
      updateMessages([...tempMessages, aiMessage]);
    } else {
      // If error occurred (handled by hook, result is null)
      // Let's add an error message so it doesn't just get stuck or disappear silently
      const aiError: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `❌ **Oops! An error occurred.**\n\nI couldn't process your request. Please check your API key or try again later.`,
      };
      updateMessages([...tempMessages, aiError]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    updateMessages([]);
  };

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      {/* Header section */}
      <div className="flex items-center justify-between pb-2 border-b border-border-default/50">
        <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
          <Bot size={13} className="text-accent-primary" />
          <span>Noesis Copilot</span>
        </h3>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-status-error/80 hover:text-status-error bg-status-error-bg/30 hover:bg-status-error-bg border border-status-error-border/40 hover:border-status-error-border transition-all cursor-pointer shrink-0"
            title="Clear chat history"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar" style={{ overflowAnchor: 'none' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-muted space-y-3 opacity-60">
            <Bot size={32} />
            <p className="text-sm">Tanyakan apa saja tentang catatan ini.<br/>AI Copilot akan membaca isi catatan dan menjawab.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-accent-primary text-accent-contrast font-medium rounded-br-none'
                    : 'bg-bg-elevated border border-border-default/50 text-text-primary rounded-bl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div 
                    className="markdown-body text-sm prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderedHtmlMap[msg.id] || '<p>Rendering...</p>' }}
                  />
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-bg-elevated border border-border-default/50 text-text-primary rounded-xl rounded-bl-none px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-accent-primary" />
              <span className="text-xs text-text-muted">AI is thinking...</span>
            </div>
          </div>
        )}

        {error && !isLoading && !messages.some(m => m.content.includes('Oops! An error occurred')) && (
          <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-[60px] right-3 z-40 p-1.5 rounded-full bg-bg-surface border border-border-default text-text-primary shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:border-accent-primary hover:text-accent-primary transition-all animate-in fade-in slide-in-from-bottom-2 cursor-pointer flex items-center justify-center"
          title="Scroll to bottom"
        >
          <ArrowDown size={14} />
        </button>
      )}

      {/* Input area */}
      <div className="pt-2 border-t border-border-default/50">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center bg-bg-elevated border border-border-default rounded-xl focus-within:border-accent-primary/60 focus-within:ring-1 focus-within:ring-accent-primary/40 transition-colors"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
            placeholder="Tanyakan sesuatu tentang catatan ini..."
            className="w-full bg-transparent border-none resize-none pl-3.5 pr-10 py-2.5 text-sm leading-normal text-text-primary placeholder:text-text-muted outline-none max-h-32 min-h-[40px] custom-scrollbar block"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-accent-primary text-accent-contrast disabled:opacity-50 disabled:bg-bg-primary disabled:text-text-muted hover:opacity-90 transition-colors cursor-pointer flex items-center justify-center"
          >
            <Send size={14} className="text-accent-contrast" />
          </button>
        </form>
      </div>
    </div>
  );
};
