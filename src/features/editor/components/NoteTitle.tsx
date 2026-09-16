import React, { useRef, useEffect, useState, useCallback } from 'react';

interface NoteTitleProps {
  title: string;
  onChange: (newTitle: string) => void;
  onEnterPress?: () => void;
  isReadOnly?: boolean;
}

export const NoteTitle: React.FC<NoteTitleProps> = ({
  title,
  onChange,
  onEnterPress,
  isReadOnly = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localTitle, setLocalTitle] = useState(title);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTitleRef = useRef(title);
  const localTitleRef = useRef(title);

  localTitleRef.current = localTitle;

  const flushTitle = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const currentVal = localTitleRef.current;
    if (currentVal !== lastSavedTitleRef.current) {
      lastSavedTitleRef.current = currentVal;
      onChange(currentVal);
    }
  }, [onChange]);

  // Sync title prop to localTitle when switching notes or when not focused
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setLocalTitle(title);
      lastSavedTitleRef.current = title;
      localTitleRef.current = title;
    }
  }, [title]);

  // Auto resize height based on content smoothly
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      requestAnimationFrame(() => {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(textarea.scrollHeight, 38)}px`;
      });
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [localTitle, adjustHeight]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        adjustHeight();
      }
    });

    observer.observe(textarea);
    return () => observer.disconnect();
  }, [adjustHeight]);

  // Flush on unmount or note switch
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        const currentVal = localTitleRef.current;
        if (currentVal !== lastSavedTitleRef.current) {
          onChange(currentVal);
        }
      }
    };
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      flushTitle();
      if (onEnterPress) {
        onEnterPress();
      }
    }
  };

  if (isReadOnly) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <h1 className="text-[28px] font-serif font-bold leading-[1.3] text-text-heading break-words">
          {title.trim() || 'Untitled'}
        </h1>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      <textarea
        ref={textareaRef}
        rows={1}
        value={localTitle}
        onChange={(e) => {
          const val = e.target.value;
          setLocalTitle(val);
          localTitleRef.current = val;
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            flushTitle();
          }, 250);
        }}
        onBlur={() => {
          flushTitle();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Untitled"
        className="w-full resize-none overflow-hidden bg-transparent text-[28px] font-serif font-bold leading-[1.3] text-text-heading placeholder:text-text-muted focus:outline-none border-none p-0 tracking-tight block min-h-[38px]"
        aria-label="Note Title"
      />
    </div>
  );
};
