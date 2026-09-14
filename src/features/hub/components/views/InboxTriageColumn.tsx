import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  Inbox, 
  Sparkles, 
  Star
} from 'lucide-react';
import { EnrichedNoteItem } from '../../types';
import { InboxTriageCard } from './InboxTriageCard';
import { TriageResult } from '../../../../api-core/inboxTriageHandler';

export type TriageColumnKey = 'Inbox' | 'Refine' | 'Keeper';

interface InboxTriageColumnProps {
  colKey: TriageColumnKey;
  title: string;
  notes: EnrichedNoteItem[];
  aiResults: Record<string, TriageResult>;
  loadingNoteIds: Set<string>;
  onOpenNote: (id: string) => void;
  onSingleTriage: (note: EnrichedNoteItem) => void;
  onApplyVerdict: (note: EnrichedNoteItem, verdict: 'keeper' | 'refine') => void;
  onRequestMove: (note: EnrichedNoteItem) => void;
  onRequestDelete: (note: EnrichedNoteItem) => void;
}

const getColumnDetails = (colKey: TriageColumnKey) => {
  switch (colKey) {
    case 'Inbox':
      return {
        icon: Inbox,
        topLine: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        dropActive: 'border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-500/5',
        dot: 'bg-amber-400 ring-2 ring-amber-400/20 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
      };
    case 'Refine':
      return {
        icon: Sparkles,
        topLine: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
        badge: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
        dropActive: 'border-purple-500/60 ring-2 ring-purple-500/20 bg-purple-500/5',
        dot: 'bg-purple-400 ring-2 ring-purple-400/20 shadow-[0_0_6px_rgba(168,85,247,0.5)]',
      };
    case 'Keeper':
      return {
        icon: Star,
        topLine: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
        badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        dropActive: 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-500/5',
        dot: 'bg-emerald-400 ring-2 ring-emerald-400/20 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
      };
  }
};

export const InboxTriageColumn: React.FC<InboxTriageColumnProps> = ({
  colKey,
  title,
  notes,
  aiResults,
  loadingNoteIds,
  onOpenNote,
  onSingleTriage,
  onApplyVerdict,
  onRequestMove,
  onRequestDelete,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: colKey,
  });

  const details = getColumnDetails(colKey);
  const Icon = details.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full rounded-xl border relative overflow-hidden transition-all duration-200 flex-shrink-0 w-72 ${
        isOver
          ? `bg-bg-surface/90 ${details.dropActive} shadow-xl scale-[1.01]`
          : 'bg-bg-surface/60 border-border-default/60 hover:border-border-hover shadow-sm'
      }`}
    >
      {/* Top Accent Line */}
      <div className={`h-1 w-full ${details.topLine}`} />

      {/* Column Header */}
      <div className="p-3 border-b border-border-default/70 bg-bg-surface/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${details.dot}`} />
          <div className="flex items-center gap-1.5">
            <Icon size={14} className="text-text-heading" />
            <h3 className="text-xs font-bold text-text-heading tracking-tight">
              {title}
            </h3>
          </div>
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${details.badge}`}>
          {notes.length}
        </span>
      </div>

      {/* Cards List Container */}
      <div className="flex-1 p-2.5 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 min-h-[150px]">
        <SortableContext
          items={notes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {notes.length > 0 ? (
            notes.map((note) => (
              <InboxTriageCard
                key={note.id}
                note={note}
                columnKey={colKey}
                aiResult={aiResults[note.id]}
                isAiLoading={loadingNoteIds.has(note.id)}
                onOpenNote={onOpenNote}
                onSingleTriage={onSingleTriage}
                onApplyVerdict={onApplyVerdict}
                onRequestMove={onRequestMove}
                onRequestDelete={onRequestDelete}
              />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-border-default rounded-xl bg-bg-surface/20 text-text-muted">
              <Icon size={24} className="opacity-30 mb-2" />
              <p className="text-xs font-medium">Kolom ini kosong</p>
              <p className="text-[10px] opacity-70 mt-0.5">
                {colKey === 'Inbox'
                  ? 'Semua tangkapan ide sudah terkurasi!'
                  : `Tarik catatan ke sini untuk menandai sebagai ${colKey}`}
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};
