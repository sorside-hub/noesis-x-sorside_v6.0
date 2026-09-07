import React from 'react';
import { Plus, Minus, LocateFixed, Wand2, Settings2 } from 'lucide-react';

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleAnimate: () => void;
  isAnimating: boolean;
  showSettings: boolean;
  onToggleSettings: () => void;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleAnimate,
  isAnimating,
  showSettings,
  onToggleSettings,
}) => {
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 p-1 rounded-xl bg-bg-surface/85 backdrop-blur-xl border border-border-default shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <button
        onClick={onZoomIn}
        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        title="Perbesar (Zoom In)"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        title="Perkecil (Zoom Out)"
      >
        <Minus size={16} />
      </button>
      <div className="w-full h-px bg-border-subtle my-0.5" />
      <button
        onClick={onResetZoom}
        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        title="Paskan ke Layar (Fit Center)"
      >
        <LocateFixed size={16} />
      </button>
      <button
        onClick={onToggleAnimate}
        className={`p-2 rounded-lg transition-all cursor-pointer ${
          isAnimating
            ? 'text-accent-contrast bg-accent-primary font-bold shadow-[0_0_12px_rgba(197,163,106,0.5)]'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
        }`}
        title={isAnimating ? 'Hentikan Animasi' : 'Mulai Animasi'}
      >
        <Wand2 size={16} className={isAnimating ? 'animate-pulse' : ''} />
      </button>
      <button
        onClick={onToggleSettings}
        className={`p-2 rounded-lg transition-colors cursor-pointer ${
          showSettings
            ? 'bg-accent-primary text-accent-contrast font-semibold'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
        }`}
        title="Pengaturan Graph"
      >
        <Settings2 size={16} />
      </button>
    </div>
  );
};
