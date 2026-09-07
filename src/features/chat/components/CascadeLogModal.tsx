import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface CascadeLogModalProps {
  cascadeLog: any[] | null;
  onClose: () => void;
}

export const CascadeLogModal: React.FC<CascadeLogModalProps> = ({ cascadeLog, onClose }) => {
  if (!cascadeLog || cascadeLog.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-bg-surface border border-border-default rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-primary">
          <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
            <span className="text-[14px]">ℹ️</span> Riwayat Eksekusi AI
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh] bg-bg-surface">
          {cascadeLog.map((attempt: any, idx: number) => (
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
  );
};
