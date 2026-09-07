import React from 'react';
import { ChevronRight, ChevronDown, Plus, X, Filter } from 'lucide-react';
import { GraphFilter, DisplaySettings } from './GraphTypes';

export interface GraphFiltersSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  customFilters: GraphFilter[];
  setCustomFilters: (val: GraphFilter[]) => void;
  isAddingFilter: boolean;
  setIsAddingFilter: (val: boolean) => void;
  newFilterProp: string;
  setNewFilterProp: (val: string) => void;
  newFilterVal: string;
  setNewFilterVal: (val: string) => void;
  showFilterDropdown: boolean;
  setShowFilterDropdown: (val: boolean) => void;
  availableProperties: any[];
  propertyValuesMap: any;
  handleAddFilter: () => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (val: DisplaySettings) => void;
}

export const GraphFiltersSection: React.FC<GraphFiltersSectionProps> = ({
  isOpen,
  onToggle,
  customFilters,
  setCustomFilters,
  isAddingFilter,
  setIsAddingFilter,
  newFilterProp,
  setNewFilterProp,
  newFilterVal,
  setNewFilterVal,
  showFilterDropdown,
  setShowFilterDropdown,
  availableProperties,
  propertyValuesMap,
  handleAddFilter,
  displaySettings,
  setDisplaySettings,
}) => {
  return (
    <div className="bg-bg-primary/50 border border-border-default rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-bg-surface border border-border-default flex items-center justify-center text-text-muted">
            <Filter size={12} />
          </div>
          <span className="text-xs font-semibold text-text-primary tracking-wide">
            Filter Graph
          </span>
        </div>
        <div className="flex items-center gap-2">
          {customFilters.length > 0 && (
            <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-hover font-mono">
              {customFilters.length}
            </span>
          )}
          {isOpen ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-2 border-t border-border-subtle/50 space-y-3">
          {customFilters.length > 1 && (
            <div className="flex items-center justify-between px-2 py-1.5 bg-black/20 rounded-md">
              <span className="text-[10px] text-text-muted font-medium">Logika Kombinasi:</span>
              <div className="flex items-center gap-1 bg-bg-surface p-0.5 rounded border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setDisplaySettings({ ...displaySettings, filterMatchMode: 'all' })}
                  className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                    displaySettings.filterMatchMode === 'all'
                      ? 'bg-accent-primary text-accent-contrast font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ALL (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setDisplaySettings({ ...displaySettings, filterMatchMode: 'any' })}
                  className={`px-2 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                    displaySettings.filterMatchMode === 'any'
                      ? 'bg-accent-primary text-accent-contrast font-medium'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ANY (OR)
                </button>
              </div>
            </div>
          )}

          {/* Pills List */}
          {customFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customFilters.map((filter) => {
                const label =
                  availableProperties.find((p) => p.key === filter.property)?.label ||
                  filter.property;
                return (
                  <div
                    key={filter.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border-default bg-black/40 text-[10px]"
                  >
                    <span className="text-text-muted font-medium">{label}:</span>
                    <span className="text-text-primary font-semibold truncate max-w-[100px]">
                      {filter.value}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomFilters(customFilters.filter((f) => f.id !== filter.id))
                      }
                      className="ml-1 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingFilter && (
              <p className="text-[10px] text-text-muted italic leading-relaxed">
                Belum ada filter. Klik "+ Tambah Filter" untuk menyembunyikan node.
              </p>
            )
          )}

          {/* Add Filter Form */}
          {isAddingFilter ? (
            <div className="p-2.5 rounded-xl bg-bg-surface border border-border-default shadow-md space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <select
                  value={newFilterProp}
                  onChange={(e) => {
                    setNewFilterProp(e.target.value);
                    setNewFilterVal('');
                  }}
                  className="flex-1 bg-bg-primary border border-border-default rounded-md px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="any">Semua Properti</option>
                  <optgroup label="Core Properties">
                    {availableProperties
                      .filter((p) => p.group === 'Core Properties')
                      .map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Analysis Properties">
                    {availableProperties
                      .filter((p) => p.group === 'Analysis Properties')
                      .map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                  </optgroup>
                  {availableProperties.some((p) => p.group === 'Custom Properties') && (
                    <optgroup label="Custom Properties">
                      {availableProperties
                        .filter((p) => p.group === 'Custom Properties')
                        .map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={newFilterVal}
                  onChange={(e) => setNewFilterVal(e.target.value)}
                  onFocus={() => setShowFilterDropdown(true)}
                  onBlur={() => setTimeout(() => setShowFilterDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilterVal.trim()) {
                      handleAddFilter();
                    }
                  }}
                  placeholder="Ketik nilai..."
                  className="w-full px-2.5 py-1.5 text-[11px] bg-bg-primary border border-border-default hover:border-border-hover focus:border-accent-primary rounded-md text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />
                {showFilterDropdown &&
                  (propertyValuesMap[newFilterProp] || propertyValuesMap.any || []).length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-32 overflow-y-auto bg-bg-surface border border-border-default rounded-md shadow-xl py-1 custom-scrollbar">
                      {(propertyValuesMap[newFilterProp] || propertyValuesMap.any || [])
                        .filter((v: string) =>
                          v.toLowerCase().includes(newFilterVal.toLowerCase())
                        )
                        .map((v: string) => (
                          <button
                            key={v}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewFilterVal(v);
                              setShowFilterDropdown(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-text-primary hover:bg-bg-hover hover:text-accent-primary transition-colors cursor-pointer"
                          >
                            {v}
                          </button>
                        ))}
                    </div>
                  )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFilter(false);
                    setNewFilterVal('');
                  }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddFilter}
                  disabled={!newFilterVal.trim()}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-accent-primary text-accent-contrast disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Simpan Filter
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingFilter(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-border-default border-dashed hover:border-border-hover"
            >
              <Plus size={14} className="text-accent-primary" /> Tambah Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
