import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Clock } from 'lucide-react';
import { EnrichedNoteItem } from '../../types';
import { DynamicFilter, getPropertyLabel } from '../HubFilterBar';

interface BoardCardProps {
  note: EnrichedNoteItem;
  dynamicProperties: string[];
  getPropertyValue: (note: EnrichedNoteItem, prop: string) => any;
  onOpenNote: (id: string) => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
};

export const BoardCard: React.FC<BoardCardProps> = ({
  note,
  dynamicProperties,
  getPropertyValue,
  onOpenNote,
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Prevent opening if the user was just dragging
        if (!isDragging) {
           onOpenNote(note.id);
        }
      }}
      className={`group p-2.5 rounded-lg bg-bg-primary border ${isDragging ? 'border-accent-primary shadow-lg ring-1 ring-accent-primary' : 'border-border-default shadow-xs hover:border-accent-primary/50'} transition-colors cursor-grab active:cursor-grabbing flex flex-col gap-2 relative select-none touch-none`}
    >
      <div className="flex items-start gap-2">
        <FileText size={14} className="text-text-muted mt-0.5 shrink-0 group-hover:text-accent-primary transition-colors" />
        <h4 className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
          {note.title}
        </h4>
      </div>
      
      {/* Dynamic Active Filter Badges */}
      {dynamicProperties.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pl-5">
          {dynamicProperties.map(prop => {
            const val = getPropertyValue(note, prop);
            if (val === undefined || val === null || val === '') return null;
            const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
            return (
              <span 
                key={prop} 
                className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 truncate max-w-[140px]"
                title={`${getPropertyLabel(prop)}: ${displayVal}`}
              >
                <span className="opacity-70">{getPropertyLabel(prop)}:</span>
                <span className="font-semibold truncate">{displayVal}</span>
              </span>
            );
          })}
        </div>
      )}
      
      <div className="flex items-center justify-end pl-5 pt-1.5 border-t border-border-subtle/40">
        <div className="flex items-center gap-1 text-[10px] text-text-muted shrink-0">
          <Clock size={10} />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
