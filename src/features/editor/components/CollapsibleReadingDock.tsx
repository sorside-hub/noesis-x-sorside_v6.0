import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Minus,
  ArrowUp,
  Music,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';

const SPEED_STORAGE_KEY = 'noesis_autoscroll_speed';
const DOCK_OPEN_KEY = 'noesis_reading_dock_open';

interface CollapsibleReadingDockProps {
  hasChords: boolean;
  semitones: number;
  onTranspose: (delta: number) => void;
  onReset: () => void;
}

export const CollapsibleReadingDock: React.FC<CollapsibleReadingDockProps> = ({
  hasChords,
  semitones,
  onTranspose,
  onReset,
}) => {
  // Default is folded (closed) as requested
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DOCK_OPEN_KEY);
      // Default to false (folded) if not saved
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Auto-scroll playing state
  const [isPlaying, setIsPlaying] = useState(false);

  // Speed state (persisted to localStorage, increments in 0.5x)
  const [speed, setSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SPEED_STORAGE_KEY);
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 8) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return 1.5;
  });

  const [lockedTop, setLockedTop] = useState<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Save dock state to localStorage
  const toggleDock = (openState?: boolean) => {
    setIsOpen((prev) => {
      const next = typeof openState === 'boolean' ? openState : !prev;
      try {
        localStorage.setItem(DOCK_OPEN_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Save speed changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
    } catch {
      // ignore
    }
  }, [speed]);

  // Click outside to collapse
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        toggleDock(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  // Keep dock motionless on mobile when virtual keyboard appears
  useEffect(() => {
    const updatePosition = () => {
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

      if (isKeyboardOpen && lockedTop !== null) {
        return;
      }

      const normalHeight = vv ? Math.max(vv.height, window.innerHeight) : window.innerHeight;
      setLockedTop(Math.round(normalHeight * 0.44));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePosition);
      }
    };
  }, [lockedTop]);

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

  const displaySemitones = semitones > 0 ? `+${semitones}` : `${semitones}`;

  return (
    <div
      ref={dockRef}
      id="collapsible-reading-dock"
      style={{
        top: lockedTop !== null ? `${lockedTop}px` : '44lvh',
      }}
      className={`fixed right-0 -translate-y-1/2 z-40 flex items-center transition-transform duration-300 ease-out select-none ${
        isOpen ? 'translate-x-0' : 'translate-x-[48px]'
      }`}
    >
      {/* 
        TRIGGER TAB (Trapesium Siku-siku Vertikal)
        Menempel di sisi kiri panel dock. Saat dock terlipat (translate-x-[48px]),
        bagian dock bergeser keluar layar, dan trigger tab ini persis menempel
        di tepi kanan layar (right: 0).
        Tinggi dan icon beradaptasi dinamis:
        - Jika ada chord: h-[82px] dengan icon Auto-Scroll & Transpose.
        - Jika tidak ada chord: h-[54px] kompak hanya dengan icon Auto-Scroll.
      */}
      <button
        type="button"
        onClick={() => toggleDock()}
        className={`relative w-[30px] flex flex-col items-center justify-center cursor-pointer group focus:outline-hidden transition-all duration-300 active:scale-95 ${
          hasChords ? 'h-[82px]' : 'h-[54px]'
        }`}
        title={
          isOpen
            ? 'Lipat panel alat'
            : hasChords
            ? 'Buka panel alat (Auto-Scroll & Transpose)'
            : 'Buka Auto-Scroll'
        }
        aria-label="Toggle Reading Tools Dock"
      >
        {/* SVG Trapesium Siku-siku Vertikal */}
        {hasChords ? (
          <svg
            viewBox="0 0 30 82"
            className="absolute inset-0 w-full h-full drop-shadow-md overflow-visible transition-all"
          >
            <path
              d="M 30 0 L 14 14 Q 2 22 2 30 L 2 76 Q 2 82 7 82 L 30 82 Z"
              style={{
                fill: 'var(--bg-surface)',
                stroke: 'var(--border-default)',
              }}
              className="group-hover:opacity-90 transition-opacity"
              strokeWidth="1.2"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 30 54"
            className="absolute inset-0 w-full h-full drop-shadow-md overflow-visible transition-all"
          >
            <path
              d="M 30 0 L 14 12 Q 2 18 2 24 L 2 48 Q 2 54 7 54 L 30 54 Z"
              style={{
                fill: 'var(--bg-surface)',
                stroke: 'var(--border-default)',
              }}
              className="group-hover:opacity-90 transition-opacity"
              strokeWidth="1.2"
            />
          </svg>
        )}

        {/* Icon di dalam trigger */}
        {hasChords ? (
          <div className="relative z-10 flex flex-col items-center justify-between h-[52px] mt-4 pr-0.5 text-text-muted group-hover:text-text-primary transition-colors">
            {/* Icon 1: Auto-Scroll */}
            <div
              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                isPlaying
                  ? 'text-accent-primary animate-pulse'
                  : 'text-text-muted group-hover:text-text-primary'
              }`}
              title={isPlaying ? 'Auto-Scroll Aktif (Sedang Berjalan)' : 'Auto-Scroll'}
            >
              {isPlaying ? (
                <Pause size={12} />
              ) : (
                <Play size={12} className="translate-x-[0.5px]" />
              )}
            </div>

            {/* Separator Titik Halus */}
            <div className="w-1 h-1 rounded-full bg-border-default group-hover:bg-accent-primary/60 transition-colors" />

            {/* Icon 2: Transpose */}
            <div
              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                semitones !== 0
                  ? 'text-accent-primary font-bold'
                  : 'text-text-muted group-hover:text-text-primary'
              }`}
              title={
                semitones !== 0
                  ? `Transpose aktif (${displaySemitones})`
                  : 'Transpose Chord'
              }
            >
              <Music size={12} />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center h-full mt-2.5 pr-0.5 text-text-muted group-hover:text-text-primary transition-colors">
            {/* Hanya Icon Auto-Scroll saat tidak ada chord di catatan */}
            <div
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                isPlaying
                  ? 'text-accent-primary animate-pulse'
                  : 'text-text-muted group-hover:text-text-primary'
              }`}
              title={isPlaying ? 'Auto-Scroll Aktif (Sedang Berjalan)' : 'Auto-Scroll'}
            >
              {isPlaying ? (
                <Pause size={13} />
              ) : (
                <Play size={13} className="translate-x-[0.5px]" />
              )}
            </div>
          </div>
        )}
      </button>

      {/* 
        PANEL ALAT MEMBACA (DOCK BODY)
        Lebar terkunci 48px, tersusun rapi dalam satu kolom vertikal.
        Jika catatan memiliki chord -> menampilkan seksi Auto-Scroll dan Transpose.
        Jika catatan biasa tanpa chord -> HANYA menampilkan seksi Auto-Scroll (Transpose disembunyikan total).
      */}
      <div className="w-[48px] bg-bg-surface/95 backdrop-blur-md border-y border-l border-border-default rounded-l-2xl shadow-2xl p-1.5 flex flex-col items-center gap-1 transition-all">
        {/* Tombol Lipat / Tutup Kecil di Atas */}
        <button
          type="button"
          onClick={() => toggleDock(false)}
          className="w-7 h-5 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded transition-colors cursor-pointer"
          title="Lipat panel ke kanan"
          aria-label="Fold Dock"
        >
          <ChevronRight size={13} />
        </button>

        {/* =================================================== */}
        {/* SEKSI 1: AUTO-SCROLL CONTROLS                       */}
        {/* =================================================== */}

        {/* Play / Pause Toggle Button */}
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
            <Pause size={14} />
          ) : (
            <Play size={14} className="translate-x-[1px]" />
          )}
        </button>

        {/* Speed Up (+0.5x) */}
        <button
          type="button"
          onClick={() => setSpeed((s) => Math.min(8, Math.round((s + 0.5) * 10) / 10))}
          disabled={speed >= 8}
          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Percepat Auto-Scroll (+0.5x)"
          aria-label="Speed Up"
        >
          <Plus size={12} />
        </button>

        {/* Speed Display Badge */}
        <div
          className="w-full text-[9px] font-mono font-bold text-text-secondary text-center tracking-tight select-none"
          title={`Kecepatan: ${speed}x (Tersimpan otomatis)`}
        >
          {speed}x
        </div>

        {/* Speed Down (-0.5x) */}
        <button
          type="button"
          onClick={() => setSpeed((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))}
          disabled={speed <= 0.5}
          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Perlambat Auto-Scroll (-0.5x)"
          aria-label="Speed Down"
        >
          <Minus size={12} />
        </button>

        {/* Scroll To Top */}
        <button
          type="button"
          onClick={handleScrollToTop}
          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
          title="Ke Atas Halaman"
          aria-label="Scroll to Top"
        >
          <ArrowUp size={12} />
        </button>

        {/* =================================================== */}
        {/* SEKSI 2: TRANSPOSE CONTROLS (HANYA JIKA ADA CHORD)  */}
        {/* =================================================== */}
        {hasChords && (
          <>
            {/* Pemisah Rapi */}
            <div className="w-6 border-t border-border-default/70 my-0.5" />

            {/* Key Header Badge */}
            <div
              className="w-8 h-8 flex flex-col items-center justify-center rounded-xl border select-none transition-colors bg-accent-primary/10 border-accent-primary/20 text-accent-primary"
              title="Transpose Chord Musik"
            >
              <Music size={12} />
              <span className="text-[7px] font-extrabold uppercase tracking-tight leading-none mt-0.5">
                Key
              </span>
            </div>

            {/* Transpose Up (+1 Semitone) */}
            <button
              type="button"
              onClick={() => onTranspose(1)}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              title="Naikkan +1 Semitone (Setengah Nada)"
              aria-label="Transpose Up"
            >
              <Plus size={12} />
            </button>

            {/* Semitone Offset Indicator */}
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

            {/* Transpose Down (-1 Semitone) */}
            <button
              type="button"
              onClick={() => onTranspose(-1)}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              title="Turunkan -1 Semitone (Setengah Nada)"
              aria-label="Transpose Down"
            >
              <Minus size={12} />
            </button>

            {/* Reset Transpose */}
            <button
              type="button"
              onClick={onReset}
              disabled={semitones === 0}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors border-t border-border-default/60"
              title={semitones !== 0 ? 'Kembalikan Nada Asli' : 'Sudah di nada asli (0)'}
              aria-label="Reset Transpose"
            >
              <RotateCcw size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
