import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ChatMode } from '../hooks/useChatLogic';

interface ChatSettingsSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  topK: number;
  setTopK: (val: number) => void;
  threshold?: number;
  setThreshold?: (val: number) => void;
  
  activeNodeName?: string;
  className?: string;
}

export const ChatSettingsSidebar: React.FC<ChatSettingsSidebarProps> = ({
  isOpen,
  onClose,
  mode,
  setMode,
  topK,
  setTopK,
  threshold = 0.55,
  setThreshold,
  
  activeNodeName,
  className
}) => {
  return (
    <aside
      className={className || "h-full w-full bg-bg-surface flex flex-col overflow-hidden relative select-none"}
    >
      {/* Header Right Sidebar */}
      <div className="h-14 px-4 border-b border-border-default flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-accent-primary" /> Chat Settings
        </span>
      </div>

      {/* Settings Controls */}
      <div className="flex-1 overflow-y-auto p-5 space-y-7 text-xs">
        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="block font-semibold text-text-heading uppercase tracking-wider text-[11px] pt-1">
            Sumber Konteks Chat
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-bg-primary border border-border-default rounded-xl">
            <button
              type="button"
              onClick={() => setMode('rag')}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center ${
                mode === 'rag'
                  ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Seluruh Vault
            </button>
            <button
              type="button"
              onClick={() => setMode('current')}
              className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-center ${
                mode === 'current'
                  ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              Catatan Aktif
            </button>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed pt-0.5">
            {mode === 'rag'
              ? `Mencari benang merah dan wawasan dari seluruh catatan di Vault Anda.`
              : activeNodeName
              ? `Fokus mendalam hanya pada catatan yang sedang dibuka ("${activeNodeName}").`
              : 'Fokus mendalam hanya pada catatan yang sedang dibuka (tidak ada catatan aktif).'}
          </p>
        </div>

        {/* RAG Settings */}
        {mode === 'rag' && (
          <div className="space-y-6 pt-2 border-t border-border-default">
            {/* RAG Retrieval Depth (Top-K) */}
            <div className="space-y-3 pt-2">
              <label className="block font-semibold text-text-heading uppercase tracking-wider text-[11px]">
                Kedalaman Konteks (Top-K)
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTopK(num)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      topK === num
                        ? 'bg-accent-primary text-accent-contrast border-accent-primary shadow-xs'
                        : 'bg-bg-primary border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover'
                    }`}
                  >
                    {num} Chunks
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pt-0.5">
                Jumlah potongan catatan paling relevan yang akan diberikan ke AI.
              </p>
            </div>

            {/* Threshold Filter (Noise Control) */}
            {setThreshold && (
              <div className="space-y-3 pt-4 border-t border-border-default">
                <label className="block font-semibold text-text-heading uppercase tracking-wider text-[11px]">
                  Filter Presisi Relevansi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Longgar', val: 0.40, sub: '0.40' },
                    { label: 'Seimbang', val: 0.55, sub: '0.55' },
                    { label: 'Ketat', val: 0.70, sub: '0.70' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setThreshold(item.val)}
                      className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                        threshold === item.val
                          ? 'bg-accent-primary text-accent-contrast border-accent-primary shadow-xs'
                          : 'bg-bg-primary border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover'
                      }`}
                    >
                      <span className="text-xs font-semibold leading-tight">{item.label}</span>
                      <span className={`text-[10px] leading-tight font-mono ${
                        threshold === item.val ? 'text-accent-contrast/80 font-medium' : 'text-text-muted'
                      }`}>
                        ({item.sub})
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed pt-0.5">
                  {threshold <= 0.40
                    ? 'Toleransi luas. Menangkap catatan yang terkait secara kontekstual.'
                    : threshold >= 0.70
                    ? 'Presisi sangat tinggi. Hanya mengambil catatan yang sangat spesifik dan akurat.'
                    : 'Standar seimbang untuk BGE-M3 (direkomendasikan untuk sebagian besar percakapan).'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
