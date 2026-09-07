import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BoardCard } from './BoardCard';
import { EnrichedNoteItem } from '../../types';

interface BoardColumnProps {
  colKey: string;
  notes: EnrichedNoteItem[];
  isSingleColumn: boolean;
  dynamicProperties: string[];
  getPropertyValue: (note: EnrichedNoteItem, prop: string) => any;
  onOpenNote: (id: string) => void;
}

interface ColumnTheme {
  topLine: string;
  dot: string;
  badge: string;
  borderHover: string;
  dropRing: string;
}

export const getColumnTheme = (colKey: string): ColumnTheme => {
  const normalized = colKey.trim().toLowerCase();

  if (normalized === 'idea' || normalized === 'ideas' || normalized === 'backlog') {
    return {
      topLine: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      dot: 'bg-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
      badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      borderHover: 'hover:border-amber-500/40',
      dropRing: 'border-amber-500/60 ring-2 ring-amber-500/20',
    };
  }
  if (normalized === 'draft' || normalized === 'todo' || normalized === 'to do') {
    return {
      topLine: 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]',
      dot: 'bg-sky-400 ring-2 ring-sky-400/20 shadow-[0_0_6px_rgba(14,165,233,0.5)]',
      badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
      borderHover: 'hover:border-sky-500/40',
      dropRing: 'border-sky-500/60 ring-2 ring-sky-500/20',
    };
  }
  if (normalized === 'in progress' || normalized === 'progress' || normalized === 'doing' || normalized === 'active') {
    return {
      topLine: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
      dot: 'bg-purple-400 ring-2 ring-purple-400/20 shadow-[0_0_6px_rgba(168,85,247,0.5)]',
      badge: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      borderHover: 'hover:border-purple-500/40',
      dropRing: 'border-purple-500/60 ring-2 ring-purple-500/20',
    };
  }
  if (normalized === 'completed' || normalized === 'done' || normalized === 'finished') {
    return {
      topLine: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
      dot: 'bg-emerald-400 ring-2 ring-emerald-400/20 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
      badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      borderHover: 'hover:border-emerald-500/40',
      dropRing: 'border-emerald-500/60 ring-2 ring-emerald-500/20',
    };
  }
  if (normalized === 'archived' || normalized === 'archive' || normalized === 'closed') {
    return {
      topLine: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.25)]',
      dot: 'bg-slate-400 ring-2 ring-slate-400/20',
      badge: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
      borderHover: 'hover:border-slate-500/40',
      dropRing: 'border-slate-400/60 ring-2 ring-slate-400/20',
    };
  }

  // Fallback dynamic palette based on hash
  const palettes: ColumnTheme[] = [
    {
      topLine: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.35)]',
      dot: 'bg-rose-400 ring-2 ring-rose-400/20 shadow-[0_0_6px_rgba(244,63,94,0.4)]',
      badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      borderHover: 'hover:border-rose-500/40',
      dropRing: 'border-rose-500/60 ring-2 ring-rose-500/20',
    },
    {
      topLine: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.35)]',
      dot: 'bg-teal-400 ring-2 ring-teal-400/20 shadow-[0_0_6px_rgba(20,184,166,0.4)]',
      badge: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
      borderHover: 'hover:border-teal-500/40',
      dropRing: 'border-teal-500/60 ring-2 ring-teal-500/20',
    },
    {
      topLine: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.35)]',
      dot: 'bg-orange-400 ring-2 ring-orange-400/20 shadow-[0_0_6px_rgba(249,115,22,0.4)]',
      badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
      borderHover: 'hover:border-orange-500/40',
      dropRing: 'border-orange-500/60 ring-2 ring-orange-500/20',
    },
    {
      topLine: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.35)]',
      dot: 'bg-cyan-400 ring-2 ring-cyan-400/20 shadow-[0_0_6px_rgba(6,182,212,0.4)]',
      badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      borderHover: 'hover:border-cyan-500/40',
      dropRing: 'border-cyan-500/60 ring-2 ring-cyan-500/20',
    }
  ];

  let hash = 0;
  for (let i = 0; i < colKey.length; i++) {
    hash = colKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

export const BoardColumn: React.FC<BoardColumnProps> = ({
  colKey,
  notes,
  isSingleColumn,
  dynamicProperties,
  getPropertyValue,
  onOpenNote,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: colKey,
    data: {
      type: 'Column',
      columnId: colKey,
    },
  });

  const theme = getColumnTheme(colKey);

  return (
    <div 
      className={`flex flex-col h-full rounded-xl border relative overflow-hidden transition-all duration-200 ${
        isSingleColumn ? 'w-full flex-1' : 'flex-shrink-0 w-72'
      } ${
        isOver 
          ? `bg-bg-surface/90 ${theme.dropRing} shadow-xl scale-[1.01]` 
          : `bg-bg-surface/60 border-border-default/60 ${theme.borderHover} shadow-sm`
      }`}
    >
      {/* Top Accent Line */}
      <div className={`h-[3px] w-full ${theme.topLine}`} />

      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border-default/40 bg-bg-surface/40 backdrop-blur-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider truncate">
            {colKey}
          </h3>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${theme.badge} shrink-0`}>
          {notes.length}
        </span>
      </div>
      
      {/* Column Content */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar flex flex-col relative min-h-[150px]">
        <SortableContext items={notes.map(n => n.id)} strategy={verticalListSortingStrategy}>
          {notes.map(note => (
            <BoardCard
              key={note.id}
              note={note}
              dynamicProperties={dynamicProperties}
              getPropertyValue={getPropertyValue}
              onOpenNote={onOpenNote}
            />
          ))}
        </SortableContext>
        
        {notes.length === 0 && (
          <div className="w-full p-4 flex items-center justify-center border border-dashed border-border-subtle/50 rounded-lg text-text-muted text-xs italic opacity-60 mt-2">
            Kosong
          </div>
        )}
      </div>
    </div>
  );
};
