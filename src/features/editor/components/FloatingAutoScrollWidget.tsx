import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Minus, ArrowUp } from 'lucide-react';

const STORAGE_KEY = 'noesis_autoscroll_speed';

export const FloatingAutoScrollWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 8) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return 1.5; // default speed
  });
  
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Simpan settingan kecepatan ke localStorage setiap kali diubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(speed));
    } catch {
      // ignore
    }
  }, [speed]);

  // Auto-scroll loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const findScrollableContainer = (): HTMLElement | null => {
      const editorCanvas = document.querySelector('.prose')?.closest('.overflow-y-auto');
      if (editorCanvas instanceof HTMLElement) return editorCanvas;

      const anyScrollable = document.querySelector('main .overflow-y-auto');
      if (anyScrollable instanceof HTMLElement) return anyScrollable;

      return document.documentElement;
    };

    const step = (time: DOMHighResTimeStamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const container = findScrollableContainer();
      if (container) {
        const pxToScroll = speed * 25 * deltaTime;
        container.scrollTop += pxToScroll;

        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
          setIsPlaying(false);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, speed]);

  const handleScrollToTop = () => {
    const editorCanvas = document.querySelector('.prose')?.closest('.overflow-y-auto');
    if (editorCanvas instanceof HTMLElement) {
      editorCanvas.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="floating-autoscroll-widget"
      className="fixed top-[4rem] right-3 z-40 w-[44px] flex flex-col items-center gap-1 p-1.5 bg-bg-surface/90 backdrop-blur-md border border-border-default rounded-2xl shadow-xl select-none animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Play / Pause Toggle Button (Fixed w-8 h-8 so size NEVER changes) */}
      <button
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-colors cursor-pointer shadow-2xs ${
          isPlaying
            ? 'bg-accent-primary border-accent-primary text-accent-contrast shadow-sm'
            : 'bg-bg-canvas hover:bg-bg-hover text-text-primary border-border-default'
        }`}
        title={isPlaying ? 'Jeda Auto-Scroll' : 'Mulai Auto-Scroll'}
        aria-label="Toggle Auto-Scroll"
      >
        {isPlaying ? (
          <Pause size={15} />
        ) : (
          <Play size={15} className="translate-x-[1px]" />
        )}
      </button>

      {/* Speed Up (+0.5) */}
      <button
        type="button"
        onClick={() => setSpeed((s) => Math.min(8, Math.round((s + 0.5) * 10) / 10))}
        disabled={speed >= 8}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
        title="Percepat Auto-Scroll (+0.5x)"
        aria-label="Speed Up"
      >
        <Plus size={13} />
      </button>

      {/* Speed Display Badge */}
      <div
        className="w-full text-[9px] font-mono font-bold text-text-secondary text-center tracking-tight select-none"
        title={`Kecepatan: ${speed}x`}
      >
        {speed}x
      </div>

      {/* Speed Down (-0.5) */}
      <button
        type="button"
        onClick={() => setSpeed((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))}
        disabled={speed <= 0.5}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
        title="Perlambat Auto-Scroll (-0.5x)"
        aria-label="Speed Down"
      >
        <Minus size={13} />
      </button>

      {/* Scroll to Top */}
      <button
        type="button"
        onClick={handleScrollToTop}
        className="w-7 h-7 flex items-center justify-center mt-0.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer border-t border-border-default/60"
        title="Ke Atas Halaman"
        aria-label="Scroll to Top"
      >
        <ArrowUp size={13} />
      </button>
    </div>
  );
};
