import React from 'react';
import { Plus, Zap, Mic, AudioLines, Radio } from 'lucide-react';
import { useNavigation } from '../../../context/NavigationContext';

interface EmptyStateProps {
  onCreateNote: () => void;
  onQuickCapture?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNote, onQuickCapture }) => {
  const { openModal } = useNavigation();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-primary px-6 text-center select-none relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-xl">
        {/* CSS Logo for Sophisticated Dark & Editorial Light */}
        <div className="w-16 h-16 bg-accent-primary rounded-md flex items-center justify-center rotate-45 shadow-[0_0_30px_rgba(197,163,106,0.3)] mb-8">
          <div className="w-8 h-8 border-2 border-accent-contrast -rotate-45"></div>
        </div>

        <h2 className="text-xl font-serif font-bold text-accent-primary tracking-tight mb-1.5">
          NOESIS VAULT
        </h2>
        <p className="text-xs text-text-muted max-w-xs leading-relaxed mb-12">
          Sistem siap. Pilih catatan yang ada atau gunakan aksi cepat di bawah ini.
        </p>

        {/* Action Hub (4 Buttons Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8 w-full max-w-[280px] sm:max-w-lg mx-auto">
          {/* 1. New Note Button */}
          <button
            type="button"
            onClick={onCreateNote}
            className="flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/5 flex items-center justify-center shadow-[0_0_15px_rgba(197,163,106,0.1)] group-hover:bg-accent-primary/20 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(197,163,106,0.2)] transition-all duration-200 mb-3">
              <Plus size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted group-hover:text-accent-primary transition-colors">
              Buat Catatan
            </span>
          </button>

          {/* 2. Quick Capture Button */}
          <button
            type="button"
            onClick={onQuickCapture || onCreateNote}
            className="flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/5 flex items-center justify-center shadow-[0_0_15px_rgba(197,163,106,0.1)] group-hover:bg-accent-primary/20 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(197,163,106,0.2)] transition-all duration-200 mb-3">
              <Zap size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted group-hover:text-accent-primary transition-colors">
              Tulis Cepat
            </span>
          </button>

          {/* 3. Voice to Note AI Button */}
          <button
            type="button"
            onClick={() => openModal('voice-note')}
            className="flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/5 flex items-center justify-center shadow-[0_0_15px_rgba(197,163,106,0.1)] group-hover:bg-accent-primary/20 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(197,163,106,0.2)] transition-all duration-200 mb-3">
              <AudioLines size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted group-hover:text-accent-primary transition-colors">
              AI Voice Transcript
            </span>
          </button>

          {/* 4. Voice Memo Button */}
          <button
            type="button"
            onClick={() => openModal('voice-memo')}
            className="flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer group outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/5 flex items-center justify-center shadow-[0_0_15px_rgba(197,163,106,0.1)] group-hover:bg-accent-primary/20 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(197,163,106,0.2)] transition-all duration-200 mb-3">
              <Mic size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted group-hover:text-accent-primary transition-colors">
              Voice Memo
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

