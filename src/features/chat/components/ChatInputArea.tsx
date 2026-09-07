import React, { useEffect } from 'react';
import { Send } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ChatInputAreaProps {
  input: string;
  setInput: (val: string) => void;
  isProcessing: boolean;
  onSend: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input,
  setInput,
  isProcessing,
  onSend,
  textareaRef,
  placeholder
}) => {
  // Auto-resize textarea height as content grows or resets
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (input) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
      }
    }
  }, [input, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Optional desktop shortcut: Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
      return;
    }
    // Regular Enter: allows default browser newline creation (no send, no preventDefault)
  };

  const isSendActive = !isProcessing;

  return (
    <div className="shrink-0 w-full px-4 pb-4 lg:pb-6 pt-0 bg-bg-primary">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end gap-2 bg-bg-surface border border-border-default hover:border-border-hover focus-within:border-accent-primary/60 focus-within:ring-1 focus-within:ring-accent-primary/40 rounded-2xl p-2 px-4 shadow-md transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-hidden text-sm text-text-primary placeholder:text-text-muted resize-none max-h-32 py-1.5 font-sans leading-relaxed"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!isSendActive}
            className={twMerge(
              "p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 shadow-xs",
              isSendActive
                ? "bg-accent-primary text-accent-contrast font-semibold hover:opacity-90 active:scale-95"
                : "bg-bg-hover text-text-muted opacity-40 cursor-not-allowed shadow-none"
            )}
            title="Kirim Pesan (atau tekan Ctrl+Enter)"
          >
            <Send size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
};

