import React, { MouseEvent, useState } from 'react';
import { Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { FileNode } from '../../../types/vault';

interface DistilTabProps {
  activeNode: FileNode;
  isDistiling: boolean;
  distilError: string;
  distilHtml: string;
  distilResult?: string;
  distilLog?: any[];
  onGenerateDistil: () => void;
  onDistilClick: (e: MouseEvent<HTMLDivElement>) => void;
}

export const DistilTab: React.FC<DistilTabProps> = ({
  activeNode,
  isDistiling,
  distilError,
  distilHtml,
  distilResult,
  distilLog,
  onGenerateDistil,
  onDistilClick,
}) => {
  const [showLog, setShowLog] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="space-y-1">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-accent-primary" />
          <span>Distil AI</span>
        </h3>
        <p className="text-[11px] text-text-muted">
          Buat ringkasan dan poin penting dari catatan ini menggunakan AI.
        </p>
      </div>

      <button
        type="button"
        disabled={isDistiling || !activeNode.content?.trim()}
        onClick={() => {
          setShowLog(false);
          onGenerateDistil();
        }}
        className="w-full flex items-center justify-center gap-2 bg-accent-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-accent-contrast text-xs font-semibold py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer"
      >
        {isDistiling ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-accent-contrast/30 border-t-accent-contrast rounded-full animate-spin" />
            <span>Distiling...</span>
          </>
        ) : (
          <>
            <Sparkles size={14} className="text-accent-contrast" />
            <span>Generate Distil</span>
          </>
        )}
      </button>

      {distilError && !isDistiling && (
        <div className="p-3 bg-status-error-bg border border-status-error-border rounded-xl text-xs text-status-error">
          <strong className="block mb-1 font-semibold">Error:</strong>
          {distilError}
        </div>
      )}

      {(distilResult || (distilLog && distilLog.length > 0)) && !isDistiling && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-text-heading uppercase tracking-wider">
              {showLog ? 'Riwayat Eksekusi' : 'Result'}
            </h4>
            
            {distilLog && distilLog.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLog(!showLog)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  showLog 
                    ? 'bg-bg-hover text-text-primary' 
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}
                title="Toggle Riwayat Eksekusi AI"
              >
                <Info size={14} />
              </button>
            )}
          </div>

          {showLog && distilLog ? (
            <div className="p-3 bg-bg-surface border border-border-default rounded-xl space-y-3 max-h-[60vh] overflow-y-auto">
              {distilLog.map((attempt: any, idx: number) => (
                <div key={idx} className="flex gap-2.5 text-xs">
                  <div className="mt-0.5">
                    {attempt.status === 'active' ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-status-success/20 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-status-success" />
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-status-error/20 flex items-center justify-center">
                        <AlertCircle size={10} className="text-status-error" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">{attempt.modelTried}</span>
                      <span className="text-[9px] text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary uppercase tracking-wider">{attempt.slotId}</span>
                    </div>
                    {attempt.error && (
                      <p className="text-status-error text-[10px] leading-relaxed break-words">{attempt.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : distilResult ? (
            <div
              className="prose dark:prose-invert prose-zinc max-w-none text-xs leading-relaxed p-3.5 bg-bg-primary border border-border-default rounded-xl"
              dangerouslySetInnerHTML={{ __html: distilHtml }}
              onClick={onDistilClick}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
