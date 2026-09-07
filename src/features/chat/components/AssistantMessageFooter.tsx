import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  ExternalLink,
  Copy,
  Check,
  FilePlus,
  BookOpen,
  Info,
} from 'lucide-react';
import { ChatMessageRecord } from '../../../lib/db';
import { useNavigation } from '../../../context/NavigationContext';

interface AssistantMessageFooterProps {
  msg: ChatMessageRecord;
  activeTab: 'sources' | 'chunks' | null;
  isCopied: boolean;
  canCreateNote: boolean;
  onToggleTab: (tab: 'sources' | 'chunks') => void;
  onOpenLog: () => void;
  onCopy: () => void;
  onCreateNote: () => void;
}

export const AssistantMessageFooter: React.FC<AssistantMessageFooterProps> = ({
  msg,
  activeTab,
  isCopied,
  canCreateNote,
  onToggleTab,
  onOpenLog,
  onCopy,
  onCreateNote,
}) => {
  const { navigateToNote, navigateView } = useNavigation();

  if (msg.role !== 'assistant' || !msg.content) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border-subtle space-y-2">
      <div className="flex items-center justify-between gap-1.5 text-xs text-text-muted">
        {/* Left side: Toggles for Sumber & Inspeksi */}
        <div className="flex items-center gap-1.5">
          {msg.cascadeLog && msg.cascadeLog.length > 0 && (
            <button
              type="button"
              onClick={onOpenLog}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title="Riwayat Eksekusi AI"
            >
              <Info size={14} />
            </button>
          )}

          {msg.sources && msg.sources.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleTab('sources')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'sources'
                  ? 'bg-bg-hover text-text-heading border-border-default font-semibold'
                  : 'bg-bg-surface hover:bg-bg-hover border-border-subtle text-text-secondary hover:text-text-heading'
              }`}
            >
              <span>Sumber ({msg.sources.length})</span>
              {activeTab === 'sources' ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          )}

          {msg.chunks && msg.chunks.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleTab('chunks')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                activeTab === 'chunks'
                  ? 'bg-bg-hover text-text-heading border-border-default font-semibold'
                  : 'bg-bg-surface hover:bg-bg-hover border-border-subtle text-text-secondary hover:text-text-heading'
              }`}
            >
              <span>Inspeksi ({msg.chunks.length})</span>
              {activeTab === 'chunks' ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          )}
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            type="button"
            onClick={onCopy}
            className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-heading transition-colors cursor-pointer text-xs shadow-2xs"
            title={isCopied ? 'Tersalin!' : 'Salin balasan AI'}
          >
            {isCopied ? <Check size={13} className="text-accent-primary" /> : <Copy size={13} />}
          </button>

          {canCreateNote && (
            <button
              type="button"
              onClick={onCreateNote}
              className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-heading transition-colors cursor-pointer text-xs shadow-2xs"
              title="Jadikan balasan AI ini sebagai Catatan Baru di Vault"
            >
              <FilePlus size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Section 1: Sumber List */}
      {activeTab === 'sources' && msg.sources && msg.sources.length > 0 && (
        <div className="p-3 bg-bg-surface border border-border-default rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
          <div className="text-[11px] font-semibold text-text-muted border-b border-border-subtle pb-1.5 flex items-center gap-1.5">
            <BookOpen size={13} /> Catatan Vault Yang Dirujuk:
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {msg.sources.map((src, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  navigateToNote(src.noteId);
                  navigateView('vault');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-primary hover:bg-bg-hover border border-border-default text-text-secondary hover:text-text-heading transition-colors cursor-pointer text-xs font-medium shadow-2xs"
              >
                <span>{src.noteTitle}</span>
                <ExternalLink size={12} className="opacity-70" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Section 2: Chunks Inspection Box */}
      {activeTab === 'chunks' && msg.chunks && msg.chunks.length > 0 && (
        <div className="p-3 bg-bg-surface border border-border-default rounded-xl space-y-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted border-b border-border-subtle pb-1.5">
            <span className="flex items-center gap-1.5">
              <Layers size={13} /> Potongan Catatan Yang Digunakan AI
            </span>
            <span>{msg.chunks.length} Chunks</span>
          </div>

          <div className="space-y-2 pt-1">
            {msg.chunks.map((chunk, cIdx) => (
              <div
                key={cIdx}
                className="p-2.5 bg-bg-primary border border-border-subtle rounded-lg space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-text-heading truncate text-[11px]">
                    {chunk.noteTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigateToNote(chunk.noteId);
                      navigateView('vault');
                    }}
                    title="Buka Catatan"
                    className="text-text-muted hover:text-text-primary shrink-0 cursor-pointer"
                  >
                    <ExternalLink size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-text-secondary line-clamp-3 leading-relaxed font-mono">
                  {chunk.snippet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
