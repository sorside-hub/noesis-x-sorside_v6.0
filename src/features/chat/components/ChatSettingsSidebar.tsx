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
            {/* RAG Retrieval Depth (Top-K Slider) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-text-heading uppercase tracking-wider text-[11px]">
                  Kedalaman Konteks (Top-K)
                </label>
                <span className="px-2 py-0.5 rounded-md bg-accent-primary/15 text-accent-primary font-mono text-xs font-bold">
                  {topK} Chunks
                </span>
              </div>

              {/* Slider Range 3 - 16 */}
              <input
                type="range"
                min={3}
                max={16}
                step={1}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full h-1.5 bg-bg-surface border border-border-default rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[
                  { label: '3', desc: 'Ringkas', val: 3 },
                  { label: '6', desc: 'Standar', val: 6 },
                  { label: '10', desc: 'Dalam', val: 10 },
                  { label: '16', desc: 'Maks', val: 16 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTopK(item.val)}
                    className={`py-1.5 px-1 rounded-md border text-center transition-colors cursor-pointer ${
                      topK === item.val
                        ? 'bg-accent-primary text-accent-contrast border-accent-primary font-bold shadow-2xs'
                        : 'bg-bg-primary border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover'
                    }`}
                  >
                    <div className="text-[11px] font-mono leading-tight">{item.label}</div>
                    <div className={`text-[9px] leading-tight ${topK === item.val ? 'text-accent-contrast/80' : 'text-text-muted'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed pt-0.5">
                Estimasi ~{(topK * 220).toLocaleString()} token konteks. Sangat aman dan responsif untuk Gemini Flash.
              </p>
            </div>

            {/* Threshold Filter (Noise Control Slider) */}
            {setThreshold && (
              <div className="space-y-3 pt-4 border-t border-border-default">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-text-heading uppercase tracking-wider text-[11px]">
                    Filter Presisi Relevansi
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-accent-primary/15 text-accent-primary font-mono text-xs font-bold">
                    {threshold.toFixed(2)}
                  </span>
                </div>

                {/* Slider Range 0.30 - 0.85 */}
                <input
                  type="range"
                  min={0.30}
                  max={0.85}
                  step={0.05}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-bg-surface border border-border-default rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { label: 'Longgar', val: 0.40 },
                    { label: 'Seimbang', val: 0.55 },
                    { label: 'Ketat', val: 0.70 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setThreshold(item.val)}
                      className={`py-1.5 px-1 rounded-md border text-center transition-colors cursor-pointer ${
                        Math.abs(threshold - item.val) < 0.02
                          ? 'bg-accent-primary text-accent-contrast border-accent-primary font-semibold shadow-2xs'
                          : 'bg-bg-primary border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover'
                      }`}
                    >
                      <div className="text-[11px] leading-tight">{item.label}</div>
                      <div className={`text-[9px] font-mono leading-tight ${Math.abs(threshold - item.val) < 0.02 ? 'text-accent-contrast/80' : 'text-text-muted'}`}>
                        {item.val.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed pt-0.5">
                  {threshold <= 0.45
                    ? 'Toleransi luas. Menangkap catatan yang terkait secara kontekstual dan wawasan umum.'
                    : threshold > 0.65
                    ? 'Presisi tinggi. Hanya mengambil catatan dengan kemiripan kata dan topik sangat spesifik.'
                    : 'Standar seimbang untuk BGE-M3 (keseimbangan terbaik antara akurasi & kelengkapan).'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
