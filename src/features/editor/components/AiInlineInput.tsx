import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useAiActions } from '../hooks/useAiActions';

interface AiInlineInputProps {
  position: { top: number; left: number };
  onComplete: (result: string) => void;
  onCancel: () => void;
}

export const AiInlineInput: React.FC<AiInlineInputProps> = ({ position, onComplete, onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const { isLoading, error, executeAction } = useAiActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    // We don't have text selection context for inline input, so text is empty or context can be given
    // Actually, inline prompt is 'custom' action with empty target text (it's generative)
    const result = await executeAction('custom', 'Generate content based on instruction.', prompt);
    if (result) {
      onComplete(result);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed z-50 flex flex-col gap-2 bg-bg-elevated/98 dark:bg-bg-elevated/95 backdrop-blur-xl border border-border-default dark:border-accent-primary/20 rounded-2xl shadow-[0_16px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-black/5 dark:ring-white/10 p-2 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: Math.max(10, position.top), left: Math.max(10, position.left) }}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent-primary ml-1" />
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI to write something..."
          className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-64 min-w-0"
          disabled={isLoading}
          onKeyDown={handleKeyDown}
        />
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-text-secondary" />
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </form>
      {error && (
        <div className="text-xs text-red-500 max-w-[280px] truncate px-1">
          {error}
        </div>
      )}
    </div>
  );
};
