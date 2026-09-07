import React from 'react';
import { Calendar, Clock, FileText, FileCode } from 'lucide-react';

interface NoteStatsSectionProps {
  formattedCreated: string;
  formattedModified: string;
  stats: {
    words: number;
    characters: number;
    readingTimeMinutes: number;
  };
}

export const NoteStatsSection: React.FC<NoteStatsSectionProps> = ({
  formattedCreated,
  formattedModified,
  stats,
}) => {
  return (
    <div className="space-y-4">
      {/* Created & Modified Dates */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-text-muted">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-text-muted" />
            <span>Created</span>
          </div>
          <span className="font-mono text-text-primary">{formattedCreated}</span>
        </div>
        <div className="flex items-center justify-between text-text-muted">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-text-muted" />
            <span>Modified</span>
          </div>
          <span className="font-mono text-text-primary">{formattedModified}</span>
        </div>
      </div>

      <div className="h-px bg-border-subtle" />

      {/* Document Statistics */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
          Document Statistics
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Words Card */}
          <div className="p-3 bg-bg-primary border border-border-default rounded-xl flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
              <FileText size={13} />
              <span>Words</span>
            </div>
            <div className="text-xl font-bold text-text-heading mt-1">
              {stats.words}
            </div>
          </div>
          {/* Characters Card */}
          <div className="p-3 bg-bg-primary border border-border-default rounded-xl flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
              <FileCode size={13} />
              <span>Characters</span>
            </div>
            <div className="text-xl font-bold text-text-heading mt-1">
              {stats.characters}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-text-muted text-center">
          Estimasi waktu baca: <span className="font-semibold text-text-secondary">{stats.readingTimeMinutes} mnt</span>
        </p>
      </div>
    </div>
  );
};
