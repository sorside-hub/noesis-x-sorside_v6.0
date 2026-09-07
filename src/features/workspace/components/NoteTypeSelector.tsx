import React, { useState, useRef, useEffect } from 'react';

interface NoteTypeSelectorProps {
  noteType: string;
  existingNoteTypes?: string[];
  activeNodeId: string;
  onChange: (val: string) => void;
}

export const NoteTypeSelector: React.FC<NoteTypeSelectorProps> = ({
  noteType,
  existingNoteTypes = [],
  activeNodeId,
  onChange,
}) => {
  const [localNoteType, setLocalNoteType] = useState(noteType);
  const [showNoteTypeSuggestions, setShowNoteTypeSuggestions] = useState(false);
  const noteTypeContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local noteType in sync with prop changes
  useEffect(() => {
    setLocalNoteType(noteType);
  }, [noteType, activeNodeId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (val: string) => {
    setLocalNoteType(val);
    setShowNoteTypeSuggestions(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChange(val);
    }, 250);
  };

  const handleSelectSuggestion = (val: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalNoteType(val);
    setShowNoteTypeSuggestions(false);
    onChange(val);
  };

  const handleInputBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onChange(localNoteType);
  };

  const filteredNoteTypes = existingNoteTypes.filter(
    (type) =>
      type.toLowerCase().includes(localNoteType.toLowerCase()) &&
      type.toLowerCase() !== localNoteType.trim().toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (noteTypeContainerRef.current && !noteTypeContainerRef.current.contains(e.target as Node)) {
        setShowNoteTypeSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={noteTypeContainerRef}>
      <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
        Note Type
      </label>
      <div className="relative">
        <input
          type="text"
          value={localNoteType}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onFocus={() => setShowNoteTypeSuggestions(true)}
          placeholder="e.g. Daily, Project, Concept"
          className="w-full px-3 py-2 bg-bg-primary border border-border-default hover:border-border-hover focus:border-accent-primary/60 rounded-xl text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none transition-colors"
        />
        {showNoteTypeSuggestions && filteredNoteTypes.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-bg-surface border border-border-default rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredNoteTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectSuggestion(type)}
                className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-bg-hover transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
