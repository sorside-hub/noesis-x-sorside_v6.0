import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, Plus, X, Sparkles, Sliders, Database, ChevronDown } from 'lucide-react';
import { EnrichedNoteItem } from '../types';

export interface DynamicFilter {
  id: string;
  property: string; // 'type' | 'status' | 'tags' | 'keywords' | 'concepts' | 'emotion' | custom property key
  value: string;
}

interface HubFilterBarProps {
  notes: EnrichedNoteItem[];
  filters: DynamicFilter[];
  onChange: (filters: DynamicFilter[]) => void;
}

// Fixed Core & Analysis property definitions
export const CORE_PROPERTIES = [
  { key: 'type', label: 'Note Type' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
];

export const ANALYSIS_PROPERTIES = [
  { key: 'keywords', label: 'Keywords' },
  { key: 'concepts', label: 'Concepts' },
  { key: 'emotion', label: 'Emotion' },
];

export const getPropertyLabel = (key: string): string => {
  const core = CORE_PROPERTIES.find(p => p.key === key);
  if (core) return core.label;
  const analysis = ANALYSIS_PROPERTIES.find(p => p.key === key);
  if (analysis) return analysis.label;
  if (key === 'noteType') return 'Note Type';
  return key; // Return custom property name as-is
};

export const isAnalysisProperty = (key: string): boolean => {
  return ANALYSIS_PROPERTIES.some(p => p.key === key);
};

export const isCoreProperty = (key: string): boolean => {
  return CORE_PROPERTIES.some(p => p.key === key) || key === 'noteType';
};

export const HubFilterBar: React.FC<HubFilterBarProps> = ({ notes, filters, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProp, setNewProp] = useState('');
  const [newVal, setNewVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique Custom Properties from all notes
  const customKeys = useMemo(() => {
    const keys = new Set<string>();
    const knownKeys = new Set([
      'type', 'noteType', 'status', 'tags', 'aliases', 'title',
      'keywords', 'concepts', 'emotion', 'summary',
      'id', 'note_id', 'user_id', 'created_at', 'updated_at', 'customProperties'
    ]);

    notes.forEach(note => {
      if (note.properties) {
        Object.keys(note.properties).forEach(k => {
          if (!knownKeys.has(k) && k.trim()) {
            keys.add(k.trim());
          }
        });
      }
    });

    return Array.from(keys).sort();
  }, [notes]);

  // Extract dynamic values for auto-complete for the selected property
  const propertyValues = useMemo(() => {
    if (!newProp) return [];
    const values = new Set<string>();
    let hasEmpty = false;

    notes.forEach(note => {
      let val = note.properties?.[newProp];
      if (val === undefined || val === null) {
        val = (note as any)[newProp];
      }
      if ((val === undefined || val === null) && newProp === 'type') {
        val = note.type || note.properties?.['noteType'];
      }

      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        hasEmpty = true;
      } else {
        if (typeof val === 'boolean') {
          values.add('true');
          values.add('false');
        } else if (Array.isArray(val)) {
          val.forEach(v => {
            if (v !== undefined && v !== null) {
              const str = String(v).trim();
              if (str) values.add(str);
            }
          });
        } else {
          const str = String(val).trim();
          if (str) values.add(str);
        }
      }
    });

    if (hasEmpty) {
      values.add('-');
    }

    // Provide sensible defaults for status if none found in notes
    if (newProp === 'status' && values.size === 0) {
      ['Inbox', 'Idea', 'Draft', 'In Progress', 'Completed', 'Archived'].forEach(s => values.add(s));
    }

    return Array.from(values).sort();
  }, [newProp, notes]);

  const addFilter = () => {
    if (newProp && newVal.trim()) {
      onChange([
        ...filters,
        {
          id: Math.random().toString(36).substring(2, 9),
          property: newProp,
          value: newVal.trim(),
        },
      ]);
      setIsAdding(false);
      setNewProp('');
      setNewVal('');
    }
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 w-full text-xs">
      {/* Active Filters & Add Button Row */}
      {!isAdding && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 w-full">
          {filters.length > 0 && (
            <span className="hidden sm:flex text-[11px] font-medium text-text-muted items-center gap-1.5 shrink-0">
              <Filter size={12} className="text-accent-primary" /> Active Filters:
            </span>
          )}

          {filters.map(filter => {
            const isAnalysis = isAnalysisProperty(filter.property);
            const isCore = isCoreProperty(filter.property);
            const label = getPropertyLabel(filter.property);

            return (
              <div
                key={filter.id}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-xs shadow-xs transition-all shrink-0 ${
                  isAnalysis
                    ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
                    : isCore
                    ? 'bg-accent-primary/10 border-accent-primary/25 text-accent-primary'
                    : 'bg-blue-500/10 border-blue-500/25 text-blue-300'
                }`}
              >
                {isAnalysis && <Sparkles size={10} className="text-purple-400 shrink-0" />}
                {isCore && <Sliders size={10} className="text-accent-primary shrink-0" />}
                {!isAnalysis && !isCore && <Database size={10} className="text-blue-400 shrink-0" />}
                
                <span className="font-semibold">{label}:</span>
                <span className="opacity-90">{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="text-text-muted hover:text-red-400 ml-0.5 sm:ml-1 cursor-pointer transition-colors"
                  title="Hapus Filter"
                >
                  <X size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </div>
            );
          })}

          {filters.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-[10px] text-text-muted hover:text-text-primary underline cursor-pointer shrink-0 mr-1"
            >
              Clear All
            </button>
          )}

          <button
            onClick={() => setIsAdding(true)}
            className={`flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg bg-bg-surface hover:bg-bg-hover transition-all border border-border-default hover:border-border-hover cursor-pointer shrink-0 ${
              filters.length > 0 ? 'p-1 sm:px-3 sm:py-1.5' : 'px-2 sm:px-3 py-0.5 sm:py-1.5'
            }`}
          >
            <Plus size={12} className="text-accent-primary" />
            <span className="hidden sm:inline">Add Custom Filter</span>
            {filters.length === 0 && <span className="sm:hidden">Filter</span>}
          </button>
        </div>
      )}

      {/* Add Filter Form */}
      {isAdding && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-bg-surface border border-border-default shadow-md animate-in fade-in duration-150">
          {/* 3 Categories Property Select */}
          <div className="relative">
            <select
              value={newProp}
              onChange={(e) => {
                setNewProp(e.target.value);
                setNewVal('');
              }}
              className="bg-bg-primary border border-border-default hover:border-border-hover focus:border-accent-primary rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none min-w-[160px] cursor-pointer"
            >
              <option value="" className="bg-bg-primary text-text-muted">
                -- Pilih Properti --
              </option>

              {/* 1. Core Properties */}
              <optgroup label="1. Core Properties" className="bg-bg-primary text-accent-primary font-semibold">
                {CORE_PROPERTIES.map(p => (
                  <option key={p.key} value={p.key} className="bg-bg-primary text-text-primary font-normal">
                    {p.label}
                  </option>
                ))}
              </optgroup>

              {/* 2. Custom Properties */}
              {customKeys.length > 0 && (
                <optgroup label="2. Custom Properties" className="bg-bg-primary text-blue-400 font-semibold">
                  {customKeys.map(k => (
                    <option key={k} value={k} className="bg-bg-primary text-text-primary font-normal">
                      {k}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* 3. Analysis Properties (Supabase note_metadata) */}
              <optgroup label="3. Analysis Properties (AI)" className="bg-bg-primary text-purple-400 font-semibold">
                {ANALYSIS_PROPERTIES.map(p => (
                  <option key={p.key} value={p.key} className="bg-bg-primary text-text-primary font-normal">
                    {p.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Dynamic Auto-complete Value Input */}
          {newProp && (
            <div className="relative flex-1 min-w-[160px]" ref={dropdownRef}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={newVal}
                  onChange={(e) => {
                    setNewVal(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProp && newVal.trim()) {
                      addFilter();
                      setShowDropdown(false);
                    }
                  }}
                  placeholder={`Ketik nilai ${getPropertyLabel(newProp)}...`}
                  className="w-full bg-bg-primary border border-border-default hover:border-border-hover focus:border-accent-primary rounded-lg pl-3 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="absolute right-2 text-text-muted hover:text-text-primary"
                >
                  <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showDropdown && propertyValues.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-bg-surface border border-border-default rounded-lg shadow-xl flex flex-col py-1">
                  {propertyValues
                    .filter(v => v.toLowerCase().includes(newVal.toLowerCase()))
                    .map(v => (
                      <button
                        key={v}
                        onClick={() => {
                          setNewVal(v);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  {propertyValues.filter(v => v.toLowerCase().includes(newVal.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-xs text-text-muted text-center italic">
                      Tidak ada opsi yang cocok
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={addFilter}
              disabled={!newProp || !newVal.trim()}
              className="px-3 py-1.5 rounded-lg bg-accent-primary text-accent-contrast font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewProp('');
                setNewVal('');
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title="Batal"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
