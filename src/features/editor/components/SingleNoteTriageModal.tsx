import React from 'react';
import { Sparkles, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { TriageResult } from '../../../api-core/inboxTriageHandler';

interface SingleNoteTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  isLoading: boolean;
  result: TriageResult | null;
  error?: string | null;
  onApply: (verdict: 'keeper' | 'refine') => void;
}

export const SingleNoteTriageModal: React.FC<SingleNoteTriageModalProps> = ({
  isOpen,
  onClose,
  noteTitle,
  isLoading,
  result,
  error,
  onApply,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Sparkles size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">AI Triage Inbox</h3>
              <p className="text-[11px] text-text-muted truncate max-w-[240px]" title={noteTitle}>
                {noteTitle || 'Catatan'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 size={28} className="animate-spin text-accent-primary" />
              <div>
                <p className="text-xs font-medium text-text-primary">Menganalisis substansi catatan...</p>
                <p className="text-[11px] text-text-muted mt-0.5">Menilai apakah catatan layak dipertahankan atau butuh dipoles</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-status-error-bg/30 border border-status-error/30 text-status-error text-xs">
              <p className="font-semibold mb-1">Gagal melakukan triage</p>
              <p className="text-[11px] opacity-90">{error}</p>
            </div>
          ) : result ? (
            <div className="flex flex-col gap-3">
              <div 
                className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                  result.verdict === 'keeper'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-200'
                    : 'bg-purple-50/90 border-purple-300 text-purple-950 dark:bg-purple-950/40 dark:border-purple-500/30 dark:text-purple-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    <Sparkles 
                      size={13} 
                      className={result.verdict === 'keeper' ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'} 
                    />
                    <span>Verdict: {result.verdict}</span>
                  </span>
                  <span 
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      result.confidence >= 90
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                        : result.confidence >= 75
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                    }`}
                  >
                    {result.confidence}% {result.confidence < 75 ? '(ambigu)' : 'match'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {result.reason}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(result.verdict);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent-primary text-text-inverse font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  <Check size={14} strokeWidth={2.2} />
                  <span>Terapkan: Pindah ke {result.verdict === 'keeper' ? 'Keeper' : 'Refine'}</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-border-subtle bg-bg-elevated/20 flex items-center justify-between text-[11px] text-text-muted">
          <span>Keputusan PKM Triage</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-text-primary transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
