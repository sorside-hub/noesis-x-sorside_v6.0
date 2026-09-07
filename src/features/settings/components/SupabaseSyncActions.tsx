import React from 'react';
import { Radio, Loader2, AlertCircle, CheckCircle2, CloudDownload, CloudUpload } from 'lucide-react';

interface SupabaseSyncActionsProps {
  syncPhase: 'idle' | 'pull' | 'push';
  syncProgressText: string;
  syncError: string | null;
  syncMessage: string | null;
  syncSummary?: { nodesCount: number; sessionsCount: number; messagesCount: number } | null;
  handlePullSync: () => void;
  handlePushSync: () => void;
}

export const SupabaseSyncActions: React.FC<SupabaseSyncActionsProps> = ({
  syncPhase,
  syncProgressText,
  syncError,
  syncMessage,
  handlePullSync,
  handlePushSync,
}) => {
  return (
    <div className="space-y-4">
      {/* Sync Progress & Alerts */}
      {syncPhase !== 'idle' && (
        <div className="p-4 rounded-xl bg-bg-primary border border-border-default space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-medium text-text-primary">
            <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
            <span>{syncProgressText}</span>
          </div>
          <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden">
            <div className="bg-accent-primary h-full rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {syncError && (
        <div className="flex items-start gap-2.5 p-3.5 text-xs text-status-error bg-status-error-bg border border-status-error/20 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{syncError}</span>
        </div>
      )}

      {syncMessage && !syncError && syncPhase === 'idle' && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-medium">{syncMessage}</span>
        </div>
      )}

      {/* Quick Dual Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handlePullSync}
          disabled={syncPhase !== 'idle'}
          className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-text-primary bg-bg-primary hover:bg-bg-hover rounded-xl transition-all border border-border-default hover:border-accent-primary/40 shadow-2xs cursor-pointer disabled:opacity-50"
        >
          {syncPhase === 'pull' ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
          ) : (
            <CloudDownload className="w-4 h-4 text-accent-primary" />
          )}
          <span>Restore from Cloud</span>
        </button>

        <button
          type="button"
          onClick={handlePushSync}
          disabled={syncPhase !== 'idle'}
          className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-text-primary bg-bg-primary hover:bg-bg-hover rounded-xl transition-all border border-border-default hover:border-accent-primary/40 shadow-2xs cursor-pointer disabled:opacity-50"
        >
          {syncPhase === 'push' ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
          ) : (
            <CloudUpload className="w-4 h-4 text-accent-primary" />
          )}
          <span>Backup to Cloud</span>
        </button>
      </div>
    </div>
  );
};
