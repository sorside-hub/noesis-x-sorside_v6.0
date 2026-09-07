import React, { useState } from 'react';
import { Sparkles, Folder, Tag, Layers, Check, X, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { AutoDetectResult } from '../../../api-core/autoDetectHandler';

interface AutoDetectModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AutoDetectResult | null;
  cascadeLog?: any[];
  onApply: (customResult: AutoDetectResult) => void;
}

export const AutoDetectModal: React.FC<AutoDetectModalProps> = ({
  isOpen,
  onClose,
  result,
  cascadeLog,
  onApply,
}) => {
  if (!isOpen || !result) return null;

  const [title, setTitle] = useState(result.suggestedTitle);
  const [noteType, setNoteType] = useState(result.noteType);
  const [tags, setTags] = useState<string[]>(result.tags || []);
  const [aliases, setAliases] = useState<string[]>(result.aliases || []);
  const [showLog, setShowLog] = useState(false);

  const handleConfirm = () => {
    onApply({
      ...result,
      suggestedTitle: title,
      noteType,
      tags,
      aliases,
    });
  };

  const isExistingFolder = result.folderDecision.action === 'existing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">AI Auto-Detect Suggestions</h3>
              <p className="text-[11px] text-text-muted">Review metadata & folder placement before applying</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cascadeLog && cascadeLog.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLog(!showLog)}
                className={`p-1 rounded-md transition-colors cursor-pointer mr-1 ${showLog ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
                title="Riwayat Eksekusi AI"
              >
                <Info size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {showLog && cascadeLog ? (
          <div className="p-4 space-y-3 bg-bg-surface overflow-y-auto max-h-[60vh] rounded-xl border border-border-default">
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
                    <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-secondary uppercase tracking-wider">{attempt.slotId}</span>
                  </div>
                  {attempt.error && (
                    <p className="text-status-error text-[11px] leading-relaxed break-words">{attempt.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
          {/* 1. Suggested Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Judul Catatan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-bg-primary border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-muted/40 focus:border-border-hover"
            />
          </div>

          {/* 2. Note Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Note Type
            </label>
            <input
              type="text"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full px-3 py-1.5 bg-bg-primary border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-text-muted/40 focus:border-border-hover"
            />
          </div>

          {/* 3. Target Folder Decision */}
          <div className="p-3 bg-bg-primary border border-border-default rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-heading">
              <Folder size={14} className="text-text-muted shrink-0" />
              <span>Rekomendasi Folder</span>
            </div>

            {isExistingFolder ? (
              <div className="text-xs text-status-success font-medium flex items-center gap-1">
                <Check size={12} />
                <span>Pakai folder eksisting: <strong>{result.folderDecision.existingFolderPath || 'Root Vault'}</strong></span>
              </div>
            ) : (
              <div className="text-xs text-accent-primary font-medium flex items-center gap-1">
                <Sparkles size={12} />
                <span>Buat folder baru: <strong>&quot;{result.folderDecision.newFolderName}&quot;</strong></span>
              </div>
            )}

            <p className="text-[11px] text-text-muted italic leading-relaxed pt-0.5">
              &quot;{result.folderDecision.reasoning}&quot;
            </p>
          </div>

          {/* 4. Tags */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Tag size={11} /> Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {tags.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-bg-hover text-text-primary border border-border-subtle text-[11px] font-medium">
                  #{t}
                </span>
              ))}
              {tags.length === 0 && <span className="text-text-muted text-[11px] italic">Tidak ada tags</span>}
            </div>
          </div>

          {/* 5. Aliases */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Layers size={11} /> Aliases
            </label>
            <div className="flex flex-wrap gap-1">
              {aliases.map((a, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-bg-hover text-text-secondary border border-border-subtle text-[11px]">
                  {a}
                </span>
              ))}
              {aliases.length === 0 && <span className="text-text-muted text-[11px] italic">Tidak ada alias</span>}
            </div>
          </div>
        </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Check size={13} className="text-accent-contrast" strokeWidth={2.5} />
            <span>Terapkan Hasil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
