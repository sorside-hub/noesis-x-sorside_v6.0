import React from 'react';
import { Settings2, RotateCcw, X } from 'lucide-react';
import { GraphCustomGroup, GraphFilter, DisplaySettings, ForceSettings } from './GraphTypes';
import { GraphFiltersSection } from './GraphFiltersSection';
import { GraphGroupsSection } from './GraphGroupsSection';
import { GraphDisplaySection } from './GraphDisplaySection';
import { GraphForcesSection } from './GraphForcesSection';

export interface GraphSettingsPanelProps {
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  openSections: any;
  toggleSection: (key: string) => void;
  handleResetSettings: () => void;
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
  customGroups: GraphCustomGroup[];
  setCustomGroups: (val: GraphCustomGroup[]) => void;
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
  handleAddFilter: () => void;
  availableProperties: any[];
  propertyValuesMap: any;
  handleAddGroup: () => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (val: DisplaySettings) => void;
  forceSettings: ForceSettings;
  setForceSettings: (val: ForceSettings) => void;
  PRESET_COLORS: string[];
  groupMatchCounts: Record<string, number>;
}

export const GraphSettingsPanel: React.FC<GraphSettingsPanelProps> = ({
  showSettings,
  setShowSettings,
  openSections,
  toggleSection,
  handleResetSettings,
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
  customGroups,
  setCustomGroups,
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
  handleAddFilter,
  availableProperties,
  propertyValuesMap,
  handleAddGroup,
  displaySettings,
  setDisplaySettings,
  forceSettings,
  setForceSettings,
  groupMatchCounts,
}) => {
  if (!showSettings) return null;

  return (
    <div className="absolute top-4 left-16 right-4 sm:right-auto sm:w-80 z-20 rounded-2xl bg-bg-surface/95 backdrop-blur-2xl border border-border-default shadow-[0_16px_64px_rgba(0,0,0,0.8)] flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 pt-4 pb-3 border-b border-border-subtle z-10 bg-bg-surface/80">
        <div className="flex items-center gap-2">
          <Settings2 size={15} className="text-accent-primary" />
          <h3 className="text-xs font-bold text-text-primary tracking-wide">PENGATURAN GRAPH</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetSettings}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            title="Reset ke Default"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">
        {/* SECTION 0: FILTERS */}
        <GraphFiltersSection
          isOpen={openSections.filters}
          onToggle={() => toggleSection('filters')}
          customFilters={customFilters}
          setCustomFilters={setCustomFilters}
          isAddingFilter={isAddingFilter}
          setIsAddingFilter={setIsAddingFilter}
          newFilterProp={newFilterProp}
          setNewFilterProp={setNewFilterProp}
          newFilterVal={newFilterVal}
          setNewFilterVal={setNewFilterVal}
          showFilterDropdown={showFilterDropdown}
          setShowFilterDropdown={setShowFilterDropdown}
          availableProperties={availableProperties}
          propertyValuesMap={propertyValuesMap}
          handleAddFilter={handleAddFilter}
          displaySettings={displaySettings}
          setDisplaySettings={setDisplaySettings}
        />
        {/* SECTION 1: GRUP */}
        <GraphGroupsSection
          isOpen={openSections.groups}
          onToggle={() => toggleSection('groups')}
          customGroups={customGroups}
          setCustomGroups={setCustomGroups}
          isAddingGroup={isAddingGroup}
          setIsAddingGroup={setIsAddingGroup}
          newGroupProp={newGroupProp}
          setNewGroupProp={setNewGroupProp}
          newGroupVal={newGroupVal}
          setNewGroupVal={setNewGroupVal}
          newGroupColor={newGroupColor}
          setNewGroupColor={setNewGroupColor}
          showGroupDropdown={showGroupDropdown}
          setShowGroupDropdown={setShowGroupDropdown}
          availableProperties={availableProperties}
          propertyValuesMap={propertyValuesMap}
          handleAddGroup={handleAddGroup}
          groupMatchCounts={groupMatchCounts}
        />

        {/* SECTION 2: TAMPILAN (DISPLAY) */}
        <GraphDisplaySection
          isOpen={openSections.display}
          onToggle={() => toggleSection('display')}
          displaySettings={displaySettings}
          setDisplaySettings={setDisplaySettings}
        />

        {/* SECTION 3: GAYA (FORCES) */}
        <GraphForcesSection
          isOpen={openSections.forces}
          onToggle={() => toggleSection('forces')}
          forceSettings={forceSettings}
          setForceSettings={setForceSettings}
        />
      </div>
    </div>
  );
};
