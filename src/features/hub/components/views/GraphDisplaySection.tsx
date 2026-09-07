import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DisplaySettings } from './GraphTypes';

interface GraphDisplaySectionProps {
  isOpen: boolean;
  onToggle: () => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (val: DisplaySettings) => void;
}

export const GraphDisplaySection: React.FC<GraphDisplaySectionProps> = ({
  isOpen,
  onToggle,
  displaySettings,
  setDisplaySettings,
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
          Tampilan
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-2 border-t border-border-subtle/50 space-y-3.5">
          {/* On/Off Ikon Panah */}
          <div
            onClick={() =>
              setDisplaySettings({
                ...displaySettings,
                showArrows: !displaySettings.showArrows,
              })
            }
            className="flex items-center justify-between cursor-pointer group select-none"
          >
            <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
              Ikon panah tautan
            </span>
            <div
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                displaySettings.showArrows ? 'bg-accent-primary' : 'bg-bg-hover'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                  displaySettings.showArrows
                    ? 'translate-x-4 bg-accent-contrast'
                    : 'translate-x-0 bg-text-muted'
                }`}
              />
            </div>
          </div>

          {/* Ambang pudar teks (-3.00 to 3.00) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Ambang pudar teks</span>
              <span className="text-text-muted font-mono">
                {displaySettings.textFadeThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="-3.00"
              max="3.00"
              step="0.10"
              value={displaySettings.textFadeThreshold}
              onChange={(e) =>
                setDisplaySettings({
                  ...displaySettings,
                  textFadeThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Ukuran titik (0.10 to 5.00) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Ukuran titik</span>
              <span className="text-text-muted font-mono">
                {displaySettings.nodeSizeScale.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="5.00"
              step="0.10"
              value={displaySettings.nodeSizeScale}
              onChange={(e) =>
                setDisplaySettings({
                  ...displaySettings,
                  nodeSizeScale: parseFloat(e.target.value),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Ketebalan tautan (0.10 to 5.00) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Ketebalan tautan</span>
              <span className="text-text-muted font-mono">
                {displaySettings.linkThickness.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="5.00"
              step="0.10"
              value={displaySettings.linkThickness}
              onChange={(e) =>
                setDisplaySettings({
                  ...displaySettings,
                  linkThickness: parseFloat(e.target.value),
                })
              }
              className="w-full accent-accent-primary h-1.5 bg-bg-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="pt-2.5 border-t border-border-subtle/50 space-y-2.5">
            {/* Label on/off */}
            <div
              onClick={() =>
                setDisplaySettings({
                  ...displaySettings,
                  showNodeLabels: !displaySettings.showNodeLabels,
                })
              }
              className="flex items-center justify-between cursor-pointer group select-none"
            >
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                Tampilkan label judul
              </span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  displaySettings.showNodeLabels ? 'bg-accent-primary' : 'bg-bg-hover'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                    displaySettings.showNodeLabels
                      ? 'translate-x-4 bg-accent-contrast'
                      : 'translate-x-0 bg-text-muted'
                  }`}
                />
              </div>
            </div>

            {/* Sembunyikan Orphan */}
            <div
              onClick={() =>
                setDisplaySettings({
                  ...displaySettings,
                  hideOrphans: !displaySettings.hideOrphans,
                })
              }
              className="flex items-center justify-between cursor-pointer group select-none"
            >
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                Sembunyikan orphan (tanpa link)
              </span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  displaySettings.hideOrphans ? 'bg-accent-primary' : 'bg-bg-hover'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                    displaySettings.hideOrphans
                      ? 'translate-x-4 bg-accent-contrast'
                      : 'translate-x-0 bg-text-muted'
                  }`}
                />
              </div>
            </div>

            {/* Link Semantik AI */}
            <div
              onClick={() =>
                setDisplaySettings({
                  ...displaySettings,
                  showSemanticLinks: !displaySettings.showSemanticLinks,
                })
              }
              className="flex items-center justify-between cursor-pointer group select-none"
            >
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                Tampilkan link semantik (AI)
              </span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  displaySettings.showSemanticLinks ? 'bg-accent-primary' : 'bg-bg-hover'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                    displaySettings.showSemanticLinks
                      ? 'translate-x-4 bg-accent-contrast'
                      : 'translate-x-0 bg-text-muted'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
