import React from 'react';
import { EnrichedNoteItem } from '../../types';
import { FileText, Clock, Tag } from 'lucide-react';
import { DynamicFilter, getPropertyLabel } from '../HubFilterBar';

interface TableViewProps {
  notes: EnrichedNoteItem[];
  filters?: DynamicFilter[];
  onOpenNote: (id: string) => void;
}

// Simple date formatter since we don't have date-fns
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const TableView: React.FC<TableViewProps> = ({ notes, filters = [], onOpenNote }) => {
  // Extract unique property names from active filters
  const dynamicProperties = Array.from(new Set(filters.map(f => f.property)));

  if (notes.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-text-muted border border-border-default border-dashed rounded-2xl">
        <FileText size={32} className="mb-3 opacity-50" />
        <p className="text-sm">Tidak ada catatan yang ditemukan.</p>
      </div>
    );
  }

  const renderDynamicCell = (note: EnrichedNoteItem, prop: string) => {
    let val = note.properties?.[prop];
    if (val === undefined || val === null) {
      val = (note as any)[prop];
    }
    if ((val === undefined || val === null) && prop === 'type') {
      val = note.type || note.properties?.['noteType'];
    }

    if (val === undefined || val === null || val === '') {
      return <span className="text-text-muted/50 text-xs italic">-</span>;
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 3).map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary border border-border-subtle truncate max-w-[80px]">
              {String(item)}
            </span>
          ))}
          {val.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted border border-border-subtle">
              +{val.length - 3}
            </span>
          )}
        </div>
      );
    }

    if (typeof val === 'boolean') {
      return <span className="text-xs text-text-secondary">{val ? 'Yes' : 'No'}</span>;
    }

    if (prop === 'status') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
          val === 'Completed' ? 'bg-status-success-bg text-status-success border-status-success-border' :
          val === 'In Progress' ? 'bg-status-info-bg text-status-info border-status-info-border' :
          val === 'Inbox' ? 'bg-status-warning-bg text-status-warning border-status-warning-border' :
          'bg-bg-hover text-text-muted border-border-subtle'
        }`}>
          {String(val)}
        </span>
      );
    }

    return <span className="text-xs text-text-secondary capitalize line-clamp-1">{String(val)}</span>;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mobile Card Layout (< md) */}
      <div className="md:hidden flex flex-col gap-3">
        {notes.map((note) => (
          <div 
            key={note.id}
            onClick={() => onOpenNote(note.id)}
            className="flex flex-col gap-2 p-3.5 bg-bg-surface border border-border-default rounded-xl hover:border-accent-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-bg-hover shrink-0 text-text-muted mt-0.5">
                <FileText size={12} />
              </div>
              <span className="font-semibold text-text-primary text-sm line-clamp-2 leading-tight">
                {note.title}
              </span>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
              {note.summary || <span className="text-text-muted/50 italic">Belum ada analisis AI...</span>}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 text-[10px] text-text-muted bg-bg-hover px-2 py-0.5 rounded-full border border-border-subtle">
                <Clock size={10} className="opacity-70" />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              
              {dynamicProperties.map(prop => (
                <div key={prop} className="flex items-center gap-1 text-[10px]">
                  <span className="opacity-50 text-text-muted capitalize">{getPropertyLabel(prop)}:</span>
                  {renderDynamicCell(note, prop)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-border-default bg-bg-surface shadow-xs custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-bg-primary/50 text-text-muted text-xs border-b border-border-default">
              <th className="font-medium py-3 px-4 w-[25%] min-w-[200px]">Title</th>
              <th className="font-medium py-3 px-4 flex-1">AI Summary</th>
              <th className="font-medium py-3 px-4 w-[15%] min-w-[120px]">Updated</th>
              {dynamicProperties.map(prop => (
                <th key={prop} className="font-medium py-3 px-4 w-[12%] min-w-[120px] capitalize">
                  {getPropertyLabel(prop)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {notes.map((note) => (
              <tr 
                key={note.id} 
                onClick={() => onOpenNote(note.id)}
                className="group hover:bg-bg-hover transition-colors cursor-pointer text-sm"
              >
                {/* Title */}
                <td className="py-3 px-4 align-top">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-bg-hover shrink-0 text-text-muted group-hover:text-accent-primary transition-colors">
                      <FileText size={12} />
                    </div>
                    <span className="font-medium text-text-primary truncate" title={note.title}>{note.title}</span>
                  </div>
                </td>
                
                {/* AI Summary */}
                <td className="py-3 px-4 text-xs text-text-secondary align-top">
                  <div className="line-clamp-2 leading-relaxed">
                    {note.summary || <span className="text-text-muted/50 italic">Belum ada analisis AI...</span>}
                  </div>
                </td>
                
                {/* Updated At */}
                <td className="py-3 px-4 text-xs text-text-muted align-top">
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Clock size={12} className="opacity-70 shrink-0" />
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </td>

                {/* Dynamic Columns */}
                {dynamicProperties.map(prop => (
                  <td key={prop} className="py-3 px-4 align-top pt-3.5">
                    {renderDynamicCell(note, prop)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
