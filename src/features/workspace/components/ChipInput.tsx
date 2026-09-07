import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ChipInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  prefix?: string;
  chipColorClass?: string;
  helperText?: string;
  suggestions?: string[];
}

export const ChipInput: React.FC<ChipInputProps> = ({
  label,
  items,
  onChange,
  placeholder = 'Add...',
  prefix = '',
  chipColorClass = 'bg-bg-hover text-text-primary border-border-default',
  helperText,
  suggestions = [],
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) => !items.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commitValue = (valToCommit?: string) => {
    const rawVal = valToCommit !== undefined ? valToCommit : (inputRef.current ? inputRef.current.value : inputValue);
    let clean = rawVal.trim();
    if (prefix && clean.startsWith(prefix)) {
      clean = clean.substring(prefix.length).trim();
    }
    if (!clean) return;

    if (!items.includes(clean)) {
      onChange([...items, clean]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setActiveIndex(-1);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    // Retain focus on this input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const isDelimiter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    return (
      e.key === ',' ||
      e.code === 'Comma' ||
      e.keyCode === 188 ||
      e.which === 188
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
          commitValue(filteredSuggestions[activeIndex]);
        } else {
          commitValue();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue();
      return;
    }

    if (isDelimiter(e)) {
      e.preventDefault();
      commitValue();
    }
  };

  const handleRemove = (itemToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(items.filter((item) => item !== itemToRemove));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
          {label}
        </label>
        {helperText && (
          <span className="text-[10px] text-text-muted/70 flex-1 truncate lowercase">
            ({helperText})
          </span>
        )}
      </div>
      <div className="relative">
        <div
          onClick={() => inputRef.current?.focus()}
          className="min-h-[42px] p-2 bg-bg-surface border border-border-default hover:border-accent-primary/50 rounded-xl flex flex-wrap gap-1.5 items-center cursor-text transition-colors focus-within:border-accent-primary/50"
        >
          {items.map((item) => (
            <span
              key={item}
              className={twMerge(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                chipColorClass
              )}
            >
              <span>
                {prefix}
                {item}
              </span>
              <button
                type="button"
                onClick={(e) => handleRemove(item, e)}
                className="hover:text-status-error rounded-full p-0.5 cursor-pointer text-text-muted transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1 flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              enterKeyHint="done"
              autoComplete="off"
              placeholder={items.length === 0 ? placeholder : 'Add...'}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none px-1 py-0.5"
            />
            {inputValue && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  commitValue();
                }}
                className="p-1 rounded-md text-text-primary hover:bg-bg-hover cursor-pointer shrink-0 transition-colors"
              >
                <Plus size={13} />
              </button>
            )}
          </div>
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-bg-surface border border-border-default rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => commitValue(suggestion)}
                className={twMerge(
                  'w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-hover transition-colors',
                  index === activeIndex ? 'bg-bg-hover' : ''
                )}
              >
                {prefix}{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
