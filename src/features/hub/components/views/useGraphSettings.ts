import { useState, useEffect } from 'react';
import { DisplaySettings, ForceSettings, GraphCustomGroup, GraphFilter, DEFAULT_DISPLAY_SETTINGS, DEFAULT_FORCE_SETTINGS } from './GraphTypes';

export function useGraphSettings() {
  const [showSettings, setShowSettings] = useState(false);
  const [openSections, setOpenSections] = useState({
    filters: false,
    groups: false,
    display: false,
    forces: false,
  });

  const toggleSection = (key: 'filters' | 'groups' | 'display' | 'forces') => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    try {
      const saved = localStorage.getItem('graph_display_settings');
      return saved ? { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(saved) } : DEFAULT_DISPLAY_SETTINGS;
    } catch {
      return DEFAULT_DISPLAY_SETTINGS;
    }
  });

  const [forceSettings, setForceSettings] = useState<ForceSettings>(() => {
    try {
      const saved = localStorage.getItem('graph_force_settings');
      return saved ? { ...DEFAULT_FORCE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_FORCE_SETTINGS;
    } catch {
      return DEFAULT_FORCE_SETTINGS;
    }
  });

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupProp, setNewGroupProp] = useState('status');
  const [newGroupVal, setNewGroupVal] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#4ade80');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const [customGroups, setCustomGroups] = useState<GraphCustomGroup[]>(() => {
    try {
      const saved = localStorage.getItem('graph_custom_groups_v2');
      if (saved) return JSON.parse(saved);
      
      const oldSaved = localStorage.getItem('graph_custom_groups');
      if (oldSaved) {
        const oldParsed = JSON.parse(oldSaved);
        if (Array.isArray(oldParsed)) {
          return oldParsed.map((og: any) => ({
            id: og.id || Math.random().toString(),
            property: 'any',
            value: og.query || '',
            color: og.color || '#4ade80'
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('graph_display_settings', JSON.stringify(displaySettings));
    } catch {}
  }, [displaySettings]);

  useEffect(() => {
    try {
      localStorage.setItem('graph_force_settings', JSON.stringify(forceSettings));
    } catch {}
  }, [forceSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('graph_custom_groups_v2', JSON.stringify(customGroups));
    } catch {}
  }, [customGroups]);

  const [customFilters, setCustomFilters] = useState<GraphFilter[]>(() => {
    try {
      const saved = localStorage.getItem('graph_custom_filters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('graph_custom_filters', JSON.stringify(customFilters));
    } catch {}
  }, [customFilters]);

  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilterProp, setNewFilterProp] = useState('any');
  const [newFilterVal, setNewFilterVal] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const handleAddFilter = () => {
    if (!newFilterVal.trim()) return;
    const newFilter: GraphFilter = {
      id: Math.random().toString(),
      property: newFilterProp,
      value: newFilterVal.trim(),
    };
    setCustomFilters([newFilter, ...customFilters]);
    setNewFilterVal('');
    setIsAddingFilter(false);
  };

  const handleResetSettings = () => {
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    setForceSettings(DEFAULT_FORCE_SETTINGS);
    setCustomFilters([]);
  };

  const handleAddGroup = () => {
    if (!newGroupVal.trim()) return;
    const newGroup: GraphCustomGroup = {
      id: Math.random().toString(),
      property: newGroupProp,
      value: newGroupVal.trim(),
      color: newGroupColor
    };
    setCustomGroups([newGroup, ...customGroups]);
    setNewGroupVal('');
    setIsAddingGroup(false);
  };

  return {
    showSettings, setShowSettings,
    openSections, toggleSection,
    displaySettings, setDisplaySettings,
    forceSettings, setForceSettings,
    isAddingGroup, setIsAddingGroup,
    newGroupProp, setNewGroupProp,
    newGroupVal, setNewGroupVal,
    newGroupColor, setNewGroupColor,
    showGroupDropdown, setShowGroupDropdown,
    customGroups, setCustomGroups,
    customFilters, setCustomFilters,
    isAddingFilter, setIsAddingFilter,
    newFilterProp, setNewFilterProp,
    newFilterVal, setNewFilterVal,
    showFilterDropdown, setShowFilterDropdown,
    handleResetSettings,
    handleAddGroup,
    handleAddFilter
  };
}
