import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, 
  AlignLeft, 
  MessageSquare, 
  Globe, 
  Maximize,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
  Check,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EditorActionType, useAiActions } from '../hooks/useAiActions';

interface AiContextMenuProps {
  position?: { top: number; left: number };
  selectedText: string;
  onActionComplete: (result: string) => void;
  onClose: () => void;
}

type Step = 'preview' | 'loading' | 'result';

export const AiContextMenu: React.FC<AiContextMenuProps> = ({ 
  selectedText, 
  onActionComplete, 
  onClose 
}) => {
  const { isLoading, error, actionLog, executeAction } = useAiActions();
  const [showLog, setShowLog] = useState(false);
  const [step, setStep] = useState<Step>('preview');
  const [aiResult, setAiResult] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeAction, setActiveAction] = useState<EditorActionType | 'custom' | null>(null);
  const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside of the drawer contents
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 200);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  const handleAction = async (action: EditorActionType, extraContext?: string) => {
    setShowLog(false);
      setActiveAction(action);
    setShowLog(false);
      setStep('loading');
    const result = await executeAction(action, selectedText, extraContext);
    if (result) {
      setAiResult(result);
      setStep('result');
    } else {
      // If error or null, go back to preview to let them try again
      setStep('preview');
    }
    setActiveAction(null);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleAction('custom', customPrompt);
  };

  // Drawer / Modal Structure
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center sm:p-4 bg-bg-primary/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-bg-elevated border-t sm:border border-border-default/60 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 transition-all duration-300 ease-out origin-bottom mt-auto sm:mb-auto"
        style={{ maxHeight: '85dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default/50 bg-bg-surface/50">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-primary" />
            <h3 className="font-semibold text-text-primary">
              {step === 'preview' ? 'AI Actions' : step === 'loading' ? 'Processing...' : 'Review Result'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          
          {/* Preview State */}
          {step === 'preview' && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Selected Text</span>
                <div className="p-3 bg-bg-surface border border-border-default rounded-xl text-sm text-text-secondary max-h-48 overflow-y-auto italic">
                  "{selectedText}"
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2 overflow-hidden">
                {isToneMenuOpen ? (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 fade-in duration-200">
                    <div className="flex items-center gap-2 mb-1">
                      <button 
                        type="button"
                        onClick={() => setIsToneMenuOpen(false)}
                        className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        <ArrowRight size={14} className="rotate-180" />
                      </button>
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Pilih Gaya Bahasa</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button onClick={() => { setIsToneMenuOpen(false); handleAction('tone', 'Profesional'); }} className="flex items-center justify-start gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        💼 Profesional
                      </button>
                      <button onClick={() => { setIsToneMenuOpen(false); handleAction('tone', 'Santai'); }} className="flex items-center justify-start gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        ☕ Santai
                      </button>
                      <button onClick={() => { setIsToneMenuOpen(false); handleAction('tone', 'Ringkas'); }} className="flex items-center justify-start gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        ✂️ Ringkas
                      </button>
                      <button onClick={() => { setIsToneMenuOpen(false); handleAction('tone', 'Kreatif'); }} className="flex items-center justify-start gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        🎨 Kreatif
                      </button>
                      <button onClick={() => { setIsToneMenuOpen(false); handleAction('tone', 'Puitis'); }} className="flex items-center justify-start gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        🌌 Puitis
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-left-4 fade-in duration-200">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Aksi Cepat</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button onClick={() => handleAction('grammar')} className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        <Wand2 size={14} className="text-text-muted" /> Tata Bahasa
                      </button>
                      <button onClick={() => handleAction('summarize')} className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        <AlignLeft size={14} className="text-text-muted" /> Ringkas
                      </button>
                      <button onClick={() => setIsToneMenuOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        <MessageSquare size={14} className="text-text-muted" /> Gaya Bahasa
                      </button>
                      <button onClick={() => handleAction('translate')} className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        <Globe size={14} className="text-text-muted" /> Terjemahkan
                      </button>
                      <button onClick={() => handleAction('expand')} className="flex items-center justify-center gap-2 px-3 py-2 bg-bg-surface hover:bg-bg-hover border border-border-default rounded-lg text-xs font-medium text-text-primary transition-colors cursor-pointer">
                        <Maximize size={14} className="text-text-muted" /> Kembangkan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <form onSubmit={handleSubmitCustom} className="flex items-center gap-2 bg-bg-surface border border-border-default focus-within:border-accent-primary/50 rounded-xl px-3 py-2 transition-colors">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Atau ketik instruksi khusus untuk AI..."
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none w-full"
                  />
                  <button 
                    type="submit" 
                    disabled={!customPrompt.trim()}
                    className="p-1.5 rounded-lg bg-accent-primary text-accent-contrast hover:opacity-90 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Loading State */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-accent-primary" size={32} />
              <div className="text-sm font-medium text-text-secondary">
                {activeAction === 'grammar' && 'Fixing grammar...'}
                {activeAction === 'summarize' && 'Summarizing text...'}
                {activeAction === 'tone' && 'Adjusting tone...'}
                {activeAction === 'translate' && 'Translating text...'}
                {activeAction === 'expand' && 'Expanding text...'}
                {activeAction === 'custom' && 'Applying custom instruction...'}
                {!activeAction && 'Processing...'}
              </div>
            </div>
          )}

          {/* Result State */}
          {step === 'result' && (
            <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Original</span>
                <div className="p-3 bg-bg-surface/50 border border-border-default/50 rounded-xl text-sm text-text-muted max-h-24 overflow-y-auto italic line-through opacity-70">
                  "{selectedText}"
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-accent-primary uppercase tracking-wider">
                    {showLog ? 'Riwayat Eksekusi AI' : 'AI Suggestion'}
                  </span>
                  
                  {actionLog && actionLog.length > 0 && (
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

                {showLog && actionLog ? (
                  <div className="p-3 bg-bg-surface border border-border-default rounded-xl space-y-3 max-h-48 overflow-y-auto">
                    {actionLog.map((attempt, idx) => (
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
                ) : (
                  <div className="p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-xl text-sm text-text-primary max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {aiResult}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-default/50">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border-default text-text-primary font-medium hover:bg-bg-hover transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onActionComplete(aiResult)}
                  className="flex-1 py-2.5 rounded-xl bg-accent-primary text-accent-contrast font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Apply Changes
                </button>
              </div>
            </div>
          )}

          {error && step !== 'loading' && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                {error}
              </div>
              {actionLog && actionLog.length > 0 && (
                <div className="p-3 bg-bg-surface border border-border-default rounded-xl space-y-3 max-h-48 overflow-y-auto mt-2">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">Riwayat Eksekusi AI</span>
                  {actionLog.map((attempt, idx) => (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
