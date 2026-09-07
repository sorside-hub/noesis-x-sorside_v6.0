import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface NoteAutoDetectCardProps {
  isAutoDetecting?: boolean;
  autoDetectError?: string | null;
  handleRunAutoDetect?: () => void;
}

export const NoteAutoDetectCard: React.FC<NoteAutoDetectCardProps> = ({
  isAutoDetecting,
  autoDetectError,
  handleRunAutoDetect,
}) => {
  return (
    <div className="p-3 bg-bg-primary border border-border-default rounded-xl space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-primary">
        <Sparkles size={13} className="text-accent-primary" />
        <span>AI Auto-Detect</span>
      </div>

      <p className="text-[11px] text-text-muted leading-snug">
        Analisis otomatis isi catatan untuk mengisi metadata, tags, dan menentukan folder yang paling sesuai.
      </p>

      {autoDetectError && (
        <p className="text-[11px] text-status-error font-medium">
          {autoDetectError}
        </p>
      )}

      <button
        type="button"
        onClick={handleRunAutoDetect}
        disabled={isAutoDetecting}
        className={twMerge(
          'w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs',
          isAutoDetecting
            ? 'bg-accent-primary/50 text-accent-contrast/60 cursor-not-allowed'
            : 'bg-accent-primary text-accent-contrast hover:opacity-90'
        )}
      >
        {isAutoDetecting ? (
          <>
            <Loader2 size={13} className="animate-spin text-accent-contrast/60" />
            <span>Analyzing Note...</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="text-accent-contrast" />
            <span>Auto-Detect Metadata & Folder</span>
          </>
        )}
      </button>
    </div>
  );
};
