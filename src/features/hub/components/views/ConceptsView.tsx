import React, { useMemo, useState, useEffect } from 'react';
import { EnrichedNoteItem } from '../../types';
import { Sparkles, FileText, ChevronRight, Hash, Clock, Tag } from 'lucide-react';

interface ConceptsViewProps {
  notes: EnrichedNoteItem[];
  onOpenNote: (id: string) => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
};

export const ConceptsView: React.FC<ConceptsViewProps> = ({ notes, onOpenNote }) => {
  // Extract and count concepts
  const { conceptsList, conceptToNotes } = useMemo(() => {
    const map: Record<string, EnrichedNoteItem[]> = {};
    const counts: Record<string, number> = {};

    notes.forEach(note => {
      if (note.concepts && note.concepts.length > 0) {
        note.concepts.forEach(concept => {
          // Normalize concept text (Title Case logic can be applied if needed, but lowercasing for grouping is safer)
          const normalized = concept.trim();
          const key = normalized.toLowerCase();

          if (!map[key]) {
            map[key] = [];
            counts[key] = 0;
          }
          // Avoid duplicate note entries for a concept (just in case)
          if (!map[key].some(n => n.id === note.id)) {
            map[key].push(note);
            counts[key]++;
          }
        });
      }
    });

    // Create sorted list of concepts (by frequency descending)
    const list = Object.keys(counts).map(key => ({
      key,
      display: map[key][0].concepts!.find(c => c.toLowerCase() === key) || key, // Try to preserve original casing
      count: counts[key]
    })).sort((a, b) => b.count - a.count);

    return { conceptsList: list, conceptToNotes: map };
  }, [notes]);

  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  // Auto-select the first concept if none is selected
  useEffect(() => {
    if (conceptsList.length > 0 && !selectedConcept) {
      setSelectedConcept(conceptsList[0].key);
    }
  }, [conceptsList, selectedConcept]);

  if (conceptsList.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-text-muted border border-border-default border-dashed rounded-2xl">
        <Sparkles size={32} className="mb-3 opacity-50" />
        <h3 className="text-sm font-semibold text-text-heading mb-1">Belum Ada Konsep</h3>
        <p className="text-xs">Belum ada pola konsep yang terbentuk dari catatan-catatan Anda. Teruslah menulis!</p>
      </div>
    );
  }

  const activeNotes = selectedConcept ? (conceptToNotes[selectedConcept] || []) : [];

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Sidebar: Concept List */}
      <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col bg-bg-surface/50 border border-border-default rounded-xl overflow-hidden">
        <div className="p-3.5 border-b border-border-default flex items-center justify-between bg-bg-surface">
          <div className="flex items-center gap-2 text-text-heading font-medium text-sm">
            <Sparkles size={16} className="text-accent-primary" />
            <span>Peta Konsep</span>
          </div>
          <span className="text-[10px] py-0.5 px-2 bg-bg-hover rounded-full text-text-muted border border-border-subtle">
            {conceptsList.length} total
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {conceptsList.map((concept) => {
            const isActive = selectedConcept === concept.key;
            return (
              <button
                key={concept.key}
                onClick={() => setSelectedConcept(concept.key)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Hash size={14} className={isActive ? 'text-accent-primary' : 'text-text-muted/50'} />
                  <span className="truncate capitalize text-left">{concept.display}</span>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                  isActive ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-hover text-text-muted'
                }`}>
                  {concept.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Area: Notes for Selected Concept */}
      <div className="flex-1 flex flex-col bg-bg-surface/30 border border-border-default rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border-default flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-heading capitalize flex items-center gap-2">
              <span className="text-text-muted font-normal text-base">Konsep:</span> 
              {conceptsList.find(c => c.key === selectedConcept)?.display || 'Memuat...'}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Ditemukan di {activeNotes.length} catatan
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => onOpenNote(note.id)}
                className="group flex flex-col p-4 rounded-xl bg-bg-primary border border-border-default hover:border-accent-primary/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary/0 group-hover:bg-accent-primary/80 transition-colors" />
                
                <div className="flex items-start justify-between mb-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-text-muted group-hover:text-accent-primary transition-colors shrink-0" />
                    <h3 className="font-semibold text-text-primary text-sm line-clamp-1">{note.title}</h3>
                  </div>
                  <div className="flex items-center text-accent-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRight size={16} />
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3 flex-1">
                  {note.summary || <span className="italic opacity-50">Belum ada ringkasan...</span>}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-subtle">
                  <div className="flex gap-1.5 flex-wrap">
                    {note.tags && note.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted border border-border-subtle">
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-text-muted shrink-0">
                    <Clock size={10} />
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
