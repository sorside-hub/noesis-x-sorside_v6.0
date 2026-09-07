import React, { useState, useEffect } from 'react';
import { Music, Plus, Minus, RotateCcw } from 'lucide-react';

interface FloatingTransposeWidgetProps {
  hasChords: boolean;
  semitones: number;
  onTranspose: (delta: number) => void;
  onReset: () => void;
}

export const FloatingTransposeWidget: React.FC<FloatingTransposeWidgetProps> = ({
  hasChords,
  semitones,
  onTranspose,
  onReset,
}) => {
  const [lockedTop, setLockedTop] = useState<number | null>(null);

  // Keep transpose widget motionless on mobile when virtual keyboard appears
  useEffect(() => {
    const updatePosition = () => {
      // Check if user is actively focusing an input / editor
      const activeEl = document.activeElement;
      const isEditing = Boolean(
        activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.closest('.ProseMirror') ||
            activeEl.getAttribute('contenteditable') === 'true')
      );

      const vv = window.visualViewport;
      const screenH = window.screen?.availHeight || window.screen?.height || 800;
      const isKeyboardOpen = isEditing || (vv && vv.height < screenH * 0.72);

      // When virtual keyboard opens on mobile, DO NOT move - stay frozen at current position
      if (isKeyboardOpen && lockedTop !== null) {
        return;
      }

      // Normal viewport height when keyboard is closed
      const normalHeight = vv ? Math.max(vv.height, window.innerHeight) : window.innerHeight;
      setLockedTop(Math.round(normalHeight / 2));
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    const handleOrientation = () => {
      setTimeout(updatePosition, 150);
    };
    window.addEventListener('orientationchange', handleOrientation);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('orientationchange', handleOrientation);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePosition);
      }
    };
  }, [lockedTop]);

  if (!hasChords) return null;

  const displaySemitones = semitones > 0 ? `+${semitones}` : `${semitones}`;

  return (
    <div
      id="floating-transpose-widget"
      style={{
        top: lockedTop !== null ? `${lockedTop}px` : '50lvh',
      }}
      className="fixed right-3 -translate-y-1/2 z-40 w-[44px] flex flex-col items-center gap-1 p-1.5 bg-bg-surface/90 backdrop-blur-md border border-border-default rounded-2xl shadow-xl select-none animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Icon & Label Header (Fixed w-8 h-8 matching AutoScroll top button) */}
      <div className="w-8 h-8 flex flex-col items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary select-none">
        <Music size={13} />
        <span className="text-[7.5px] font-extrabold uppercase tracking-tight text-accent-primary leading-none mt-0.5">
          Key
        </span>
      </div>

      {/* Transpose +1 Button */}
      <button
        type="button"
        onClick={() => onTranspose(1)}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
        title="Naikkan +1 Semitone (Setengah Nada)"
        aria-label="Transpose Up"
      >
        <Plus size={13} />
      </button>

      {/* Semitones Offset Indicator Badge (Fixed width, never expands or twitches) */}
      <div
        className={`w-full text-[10px] font-mono font-bold text-center py-0.5 rounded select-none transition-colors ${
          semitones !== 0
            ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
            : 'text-text-secondary'
        }`}
        title={`Offset nada dasar: ${displaySemitones} semitone`}
      >
        {displaySemitones}
      </div>

      {/* Transpose -1 Button */}
      <button
        type="button"
        onClick={() => onTranspose(-1)}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
        title="Turunkan -1 Semitone (Setengah Nada)"
        aria-label="Transpose Down"
      >
        <Minus size={13} />
      </button>

      {/* Reset Button (Always present with fixed height so widget never twitches in height) */}
      <button
        type="button"
        onClick={onReset}
        disabled={semitones === 0}
        className="w-7 h-7 flex items-center justify-center mt-0.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors border-t border-border-default/60"
        title={semitones !== 0 ? 'Kembalikan Nada Asli' : 'Sudah di nada asli (0)'}
        aria-label="Reset Transpose"
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
};
