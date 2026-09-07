import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { RagSyncStatus } from '../../rag/services/ragPipeline';

interface NoteRagCardProps {
  isSyncingRag: boolean;
  ragSyncStatus: RagSyncStatus | null;
  aiMetadata?: any | null;
  handleProcessRag: () => void;
  handleRemoveRag: () => void;
}

export const NoteRagCard: React.FC<NoteRagCardProps> = ({
  isSyncingRag,
  ragSyncStatus,
  aiMetadata,
  handleProcessRag,
  handleRemoveRag,
}) => {
  const [isCascadeModalOpen, setIsCascadeModalOpen] = useState(false);

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent-primary tracking-wider uppercase">
        <Sparkles size={12} className="text-accent-primary" />
        <span>AI RAG Analysis</span>
      </div>

      <div className="flex flex-col gap-2 p-3 rounded-xl bg-bg-primary border border-border-default text-xs transition-all duration-200">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[12px]">
            {isSyncingRag ? (
              <>
                <Loader2 size={13} className="animate-spin text-accent-primary" />
                <span className="text-accent-primary font-medium">Processing...</span>
              </>
            ) : ragSyncStatus === 'synced' ? (
              <div className="flex items-center gap-1.5 justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-status-success" />
                  <span className="text-status-success font-medium">Up to Date</span>
                </div>
                {aiMetadata?.cascadeLog && aiMetadata.cascadeLog.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCascadeModalOpen(true)}
                    className="text-text-muted hover:text-accent-primary transition-colors flex items-center justify-center p-1 rounded-full hover:bg-accent-primary/10 cursor-pointer"
                    title="Lihat riwayat proses model AI"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            ) : ragSyncStatus === 'error' ? (
              <div className="flex items-center gap-1.5 justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-status-error" />
                  <span className="text-status-error font-medium">Sync Failed</span>
                </div>
                {aiMetadata?.cascadeLog && aiMetadata.cascadeLog.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCascadeModalOpen(true)}
                    className="text-text-muted hover:text-status-error transition-colors flex items-center justify-center p-1 rounded-full hover:bg-status-error/10 cursor-pointer"
                    title="Lihat riwayat error model AI"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            ) : ragSyncStatus === 'out_of_sync' ? (
              <div className="flex items-center gap-1.5 justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-status-warning" />
                  <span className="text-status-warning font-medium">Needs Update</span>
                </div>
                {aiMetadata?.cascadeLog && aiMetadata.cascadeLog.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCascadeModalOpen(true)}
                    className="text-text-muted hover:text-accent-primary transition-colors flex items-center justify-center p-1 rounded-full hover:bg-accent-primary/10 cursor-pointer"
                    title="Lihat riwayat proses model AI sebelumnya"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-text-muted" />
                  <span className="text-text-muted font-medium">Unprocessed</span>
                </div>
                {aiMetadata?.cascadeLog && aiMetadata.cascadeLog.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCascadeModalOpen(true)}
                    className="text-text-muted hover:text-accent-primary transition-colors flex items-center justify-center p-1 rounded-full hover:bg-accent-primary/10 cursor-pointer"
                    title="Lihat riwayat proses model AI"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] text-text-muted leading-relaxed">
            {ragSyncStatus === 'synced'
              ? 'Catatan ini sudah terindeks dan siap digunakan oleh AI.'
              : ragSyncStatus === 'error'
              ? 'Gagal memproses. Cek API key, koneksi, atau limitasi model Anda.'
              : ragSyncStatus === 'out_of_sync'
              ? 'Catatan ini telah diubah. Silakan update agar AI mengenali perubahan terbaru.'
              : 'Proses catatan ini agar AI bisa membacanya sebagai konteks (RAG).'}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={handleProcessRag}
            disabled={isSyncingRag || ragSyncStatus === 'synced'}
            className={twMerge(
              'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150 shadow-2xs',
              isSyncingRag
                ? 'bg-bg-hover text-text-muted cursor-not-allowed shadow-none opacity-60'
                : ragSyncStatus === 'synced'
                ? 'bg-bg-hover text-text-muted border border-border-subtle shadow-none cursor-default opacity-70'
                : ragSyncStatus === 'error'
                ? 'bg-status-error hover:opacity-90 text-white cursor-pointer'
                : 'bg-accent-primary text-accent-contrast font-semibold hover:opacity-90 cursor-pointer'
            )}
          >
            <RefreshCw size={12} className={isSyncingRag ? 'animate-spin' : ''} />
            <span>
              {ragSyncStatus === 'unprocessed'
                ? 'Process AI'
                : ragSyncStatus === 'error'
                ? 'Retry Process'
                : ragSyncStatus === 'out_of_sync'
                ? 'Update AI'
                : 'Up to Date'}
            </span>
          </button>

          {ragSyncStatus && ragSyncStatus !== 'unprocessed' && (
            <button
              type="button"
              onClick={handleRemoveRag}
              disabled={isSyncingRag}
              className={twMerge(
                'flex items-center justify-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs border',
                isSyncingRag
                  ? 'bg-bg-hover border-transparent text-text-muted cursor-not-allowed shadow-none opacity-60'
                  : 'bg-status-error-bg/60 hover:bg-status-error-bg border-status-error-border/60 hover:border-status-error-border text-status-error hover:text-status-error'
              )}
              title="Remove from AI index"
            >
              Remove
            </button>
          )}
        </div>

        {/* Cascade Log Modal */}
        {isCascadeModalOpen && aiMetadata?.cascadeLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm p-4">
            <div className="bg-bg-surface border border-border-default rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
              <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-primary">
                <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                  <span className="text-[14px]">ℹ️</span> Riwayat Eksekusi AI
                </h3>
                <button
                  onClick={() => setIsCascadeModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] bg-bg-surface">
                {aiMetadata.cascadeLog.map((attempt: any, idx: number) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="mt-0.5">
                      {attempt.status === 'active' ? (
                        <div className="w-4 h-4 rounded-full bg-status-success/20 flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-status-success" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-status-error/20 flex items-center justify-center">
                          <AlertCircle size={10} className="text-status-error" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary">{attempt.modelTried}</span>
                        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary uppercase tracking-wider">
                          {attempt.slotId}
                        </span>
                      </div>
                      {attempt.error && (
                        <p className="text-status-error text-[11px] leading-relaxed break-words">
                          {attempt.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
