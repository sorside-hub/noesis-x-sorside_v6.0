import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileText, 
  Sparkles, 
  FolderInput, 
  Trash2, 
  Loader2, 
  Check, 
  ArrowRight,
  Clock,
  Tag
} from 'lucide-react';
import { EnrichedNoteItem } from '../../types';
import { TriageResult } from '../../../../api-core/inboxTriageHandler';

interface InboxTriageCardProps {
  note: EnrichedNoteItem;
  columnKey: 'Inbox' | 'Refine' | 'Keeper';
  aiResult?: TriageResult;
  isAiLoading?: boolean;
  onOpenNote: (id: string) => void;
  onSingleTriage: (note: EnrichedNoteItem) => void;
  onApplyVerdict: (note: EnrichedNoteItem, verdict: 'keeper' | 'refine') => void;
  onRequestMove: (note: EnrichedNoteItem) => void;
  onRequestDelete: (note: EnrichedNoteItem) => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
};

// Clean preview snippet from markdown
const cleanSnippet = (content?: string) => {
  if (!content) return '';
  return content
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italics
    .replace(/\[\[(.*?)\]\]/g, '$1') // Remove wikilinks
    .replace(/`{1,3}.*?`{1,3}/g, '') // Remove inline code
    .replace(/\n+/g, ' ') // Collapse newlines
    .trim()
    .slice(0, 110);
};

export const InboxTriageCard: React.FC<InboxTriageCardProps> = ({
  note,
  columnKey,
  aiResult,
  isAiLoading,
  onOpenNote,
  onSingleTriage,
  onApplyVerdict,
  onRequestMove,
  onRequestDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: {
      type: 'Note',
      note,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const snippet = cleanSnippet(note.node.content);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) {
          onOpenNote(note.id);
        }
      }}
      className={`group relative flex flex-col gap-2.5 p-3.5 rounded-xl bg-bg-surface/90 border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'border-accent-primary ring-2 ring-accent-primary/20 shadow-xl touch-none'
          : 'border-border-default hover:border-border-hover hover:shadow-md'
      }`}
    >
      {/* Header: Title & Quick Move / Trash */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <FileText 
            size={15} 
            className="text-text-muted mt-0.5 shrink-0 group-hover:text-accent-primary transition-colors" 
          />
          <h4 className="text-xs font-semibold text-text-heading leading-snug line-clamp-2">
            {note.title || 'Tanpa Judul'}
          </h4>
        </div>

        {/* Top Hover Actions */}
        <div 
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Pindahkan ke folder lain"
            onClick={() => onRequestMove(note)}
            className="p-1 rounded-md text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <FolderInput size={13} />
          </button>
          <button
            type="button"
            title="Hapus catatan"
            onClick={() => onRequestDelete(note)}
            className="p-1 rounded-md text-text-muted hover:text-status-error hover:bg-status-error-bg transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Snippet Preview */}
      {snippet ? (
        <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
          {snippet}
        </p>
      ) : (
        <p className="text-[11px] text-text-muted/60 italic">
          (Catatan masih kosong)
        </p>
      )}

      {/* AI Triage Result Banner (if evaluated) */}
      {aiResult && (
        <div 
          className={`flex flex-col gap-1.5 p-2.5 rounded-lg border text-[11px] transition-all shadow-2xs ${
            aiResult.verdict === 'keeper'
              ? 'bg-emerald-50/80 border-emerald-300/80 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-200'
              : 'bg-purple-50/80 border-purple-300/80 text-purple-900 dark:bg-purple-950/40 dark:border-purple-500/30 dark:text-purple-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles 
                size={12} 
                className={
                  aiResult.verdict === 'keeper' 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : 'text-purple-700 dark:text-purple-400'
                } 
              />
              <span className="text-[11px]">
                Verdict: <strong className="uppercase font-bold tracking-wide">{aiResult.verdict}</strong>
              </span>
            </span>
            <span 
              className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold border ${
                aiResult.confidence >= 90
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : aiResult.confidence >= 75
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
              }`}
              title={
                aiResult.confidence >= 90
                  ? 'Sangat yakin'
                  : aiResult.confidence >= 75
                  ? 'Cukup yakin'
                  : 'Ambigu / butuh interpretasi'
              }
            >
              {aiResult.confidence}% {aiResult.confidence < 75 ? '(ambigu)' : ''}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
            {aiResult.reason}
          </p>

          {/* Quick Apply Button if not already in that column */}
          {((aiResult.verdict === 'keeper' && columnKey !== 'Keeper') ||
            (aiResult.verdict === 'refine' && columnKey !== 'Refine')) && (
            <button
              type="button"
              onClick={() => onApplyVerdict(note, aiResult.verdict)}
              className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md bg-accent-primary text-text-inverse font-medium text-[11px] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check size={12} strokeWidth={2.2} />
              <span>Pindah ke {aiResult.verdict === 'keeper' ? 'Keeper' : 'Refine'}</span>
            </button>
          )}
        </div>
      )}

      {/* Footer: Tags, Date, and AI Triage Button */}
      <div 
        className="flex items-center justify-between pt-1 border-t border-border-default/60 text-[10px] text-text-muted mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center gap-1 shrink-0">
            <Clock size={11} />
            <span>{formatDate(note.updatedAt || note.createdAt)}</span>
          </span>
          {note.tags && note.tags.length > 0 && (
            <span className="flex items-center gap-1 truncate text-accent-primary/80">
              <Tag size={10} />
              <span className="truncate">#{note.tags[0]}</span>
            </span>
          )}
        </div>

        {/* AI Triage Trigger Button - strictly for Inbox column */}
        {!aiResult && columnKey === 'Inbox' && (
          <button
            type="button"
            disabled={isAiLoading}
            onClick={() => onSingleTriage(note)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <Sparkles size={10} />
                <span>AI Triage</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
