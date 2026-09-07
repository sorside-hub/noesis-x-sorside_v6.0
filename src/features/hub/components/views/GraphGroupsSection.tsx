import React from 'react';
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { GraphCustomGroup } from './GraphTypes';

interface GraphGroupsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  customGroups: GraphCustomGroup[];
  setCustomGroups: (val: GraphCustomGroup[]) => void;
  isAddingGroup: boolean;
  setIsAddingGroup: (val: boolean) => void;
  newGroupProp: string;
  setNewGroupProp: (val: string) => void;
  newGroupVal: string;
  setNewGroupVal: (val: string) => void;
  newGroupColor: string;
  setNewGroupColor: (val: string) => void;
  showGroupDropdown: boolean;
  setShowGroupDropdown: (val: boolean) => void;
  availableProperties: any[];
  propertyValuesMap: any;
  handleAddGroup: () => void;
  groupMatchCounts: Record<string, number>;
}

export const GraphGroupsSection: React.FC<GraphGroupsSectionProps> = ({
  isOpen,
  onToggle,
  customGroups,
  setCustomGroups,
  isAddingGroup,
  setIsAddingGroup,
  newGroupProp,
  setNewGroupProp,
  newGroupVal,
  setNewGroupVal,
  newGroupColor,
  setNewGroupColor,
  showGroupDropdown,
  setShowGroupDropdown,
  availableProperties,
  propertyValuesMap,
  handleAddGroup,
  groupMatchCounts,
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
          Grup
        </span>
        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-hover font-mono">
          {customGroups.length}
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-2 border-t border-border-subtle/50 space-y-3">
          {/* Pills List */}
          {customGroups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customGroups.map((group) => {
                const matchCount = groupMatchCounts[group.id] || 0;
                const label =
                  availableProperties.find((p) => p.key === group.property)?.label ||
                  group.property;
                return (
                  <div
                    key={group.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border-default bg-black/40 text-[10px]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-text-muted font-medium">{label}:</span>
                    <span className="text-text-primary font-semibold truncate max-w-[100px]">
                      {group.value}
                    </span>
                    <span className="text-text-muted/50 ml-0.5">({matchCount})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomGroups(customGroups.filter((g) => g.id !== group.id))
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
            !isAddingGroup && (
              <p className="text-[10px] text-text-muted italic leading-relaxed">
                Belum ada grup warna. Klik "+ Tambah Grup" untuk mewarnai berdasarkan properti.
              </p>
            )
          )}

          {/* Add Group Form */}
          {isAddingGroup ? (
            <div className="p-2.5 rounded-xl bg-bg-surface border border-border-default shadow-md space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <select
                  value={newGroupProp}
                  onChange={(e) => {
                    setNewGroupProp(e.target.value);
                    setNewGroupVal('');
                  }}
                  className="flex-1 bg-bg-primary border border-border-default rounded-md px-2 py-1.5 text-[11px] text-text-primary focus:outline-none focus:border-accent-primary"
                >
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

                <div
                  className="relative shrink-0 w-7 h-7 rounded-md overflow-hidden cursor-pointer border border-border-default"
                  title="Pilih Warna"
                >
                  <input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                  />
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={newGroupVal}
                  onChange={(e) => setNewGroupVal(e.target.value)}
                  onFocus={() => setShowGroupDropdown(true)}
                  onBlur={() => setTimeout(() => setShowGroupDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newGroupVal.trim()) {
                      handleAddGroup();
                    }
                  }}
                  placeholder="Ketik nilai..."
                  className="w-full px-2.5 py-1.5 text-[11px] bg-bg-primary border border-border-default hover:border-border-hover focus:border-accent-primary rounded-md text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />

                {showGroupDropdown &&
                  (propertyValuesMap[newGroupProp] || propertyValuesMap.any || []).length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-32 overflow-y-auto bg-bg-surface border border-border-default rounded-md shadow-xl py-1 custom-scrollbar">
                      {(propertyValuesMap[newGroupProp] || propertyValuesMap.any || [])
                        .filter((v: string) =>
                          v.toLowerCase().includes(newGroupVal.toLowerCase())
                        )
                        .map((v: string) => (
                          <button
                            key={v}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewGroupVal(v);
                              setShowGroupDropdown(false);
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
                    setIsAddingGroup(false);
                    setNewGroupVal('');
                  }}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  disabled={!newGroupVal.trim()}
                  className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-accent-primary text-accent-contrast disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Simpan Grup
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingGroup(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-border-default border-dashed hover:border-border-hover"
            >
              <Plus size={14} className="text-accent-primary" /> Tambah Grup
            </button>
          )}
        </div>
      )}
    </div>
  );
};
