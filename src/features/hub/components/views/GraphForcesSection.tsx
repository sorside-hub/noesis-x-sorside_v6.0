import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ForceSettings } from './GraphTypes';

interface GraphForcesSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  forceSettings: ForceSettings;
  setForceSettings: (val: ForceSettings) => void;
}

export const GraphForcesSection: React.FC<GraphForcesSectionProps> = ({
  isOpen,
  onToggle,
  forceSettings,
  setForceSettings,
}) => {
  return (
    <div className="rounded-xl bg-bg-surface border border-border-subtle overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={14} className="text-accent-primary" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
          Gaya
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-2 border-t border-border-subtle/50 space-y-3.5">
          {/* Gaya Pusat (0.00 to 1.00, def: 0.52) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Gaya pusat</span>
              <span className="text-text-muted font-mono">
                {forceSettings.centerForce.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max="1.00"
              step="0.01"
              value={forceSettings.centerForce}
              onChange={(e) =>
                setForceSettings({
                  ...forceSettings,
                  centerForce: parseFloat(e.target.value),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Gaya Tolak (0.00 to 20.00, def: 10.00) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Gaya tolak</span>
              <span className="text-text-muted font-mono">
                {forceSettings.repelForce.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max="20.00"
              step="0.10"
              value={forceSettings.repelForce}
              onChange={(e) =>
                setForceSettings({
                  ...forceSettings,
                  repelForce: parseFloat(e.target.value),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Gaya Tautan (0.00 to 1.00, def: 1.00) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Gaya tautan</span>
              <span className="text-text-muted font-mono">
                {forceSettings.linkForce.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max="1.00"
              step="0.01"
              value={forceSettings.linkForce}
              onChange={(e) =>
                setForceSettings({
                  ...forceSettings,
                  linkForce: parseFloat(e.target.value),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Jarak Tautan (30 to 500, def: 250) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Jarak tautan</span>
              <span className="text-text-muted font-mono">
                {Math.round(forceSettings.linkDistance)}
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="500"
              step="5"
              value={forceSettings.linkDistance}
              onChange={(e) =>
                setForceSettings({
                  ...forceSettings,
                  linkDistance: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
