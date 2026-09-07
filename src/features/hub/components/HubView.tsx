import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Table2, 
  SquareKanban, 
  Waypoints, 
  Network, 
  Search, 
  Layers, 
  SlidersHorizontal,
  ChevronRight,
  Database,
  ArrowRight,
  X,
  Eye,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { VaultData, FileNode } from '../../../types/vault';
import { useNavigation } from '../../../context/NavigationContext';
import { HubSubView } from '../types';

import { useHubData } from '../hooks/useHubData';
import { TableView } from './views/TableView';
import { BoardView, getBoardColumns, BOARD_COLUMNS_STORAGE_KEY } from './views/BoardView';
import { ConceptsView } from './views/ConceptsView';

import { GraphView } from './views/GraphView';
import { HubFilterBar, DynamicFilter } from './HubFilterBar';
import { isSameOrDescendantTag } from '../../workspace/utils/tagUtils';

interface HubViewProps {
  vault: VaultData | null;
  vaultState?: any;
}

export const HubView: React.FC<HubViewProps> = ({ vault, vaultState }) => {
  const [activeSubView, setActiveSubView] = useState<HubSubView>('table');
  const [tabSearchQueries, setTabSearchQueries] = useState<Record<string, string>>({
    table: '',
    board: '',
    concepts: '',
    graph: ''
  });
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [tabFilters, setTabFilters] = useState<Record<string, DynamicFilter[]>>({
    table: [],
    board: [],
    concepts: [],
    graph: []
  });
  const { navigateToNote } = useNavigation();

  // Use Data Aggregator
  const { notes: allFiles, isLoading } = useHubData(vault);

  // Derive board columns dynamically
  const allBoardColumns = useMemo(() => {
    return getBoardColumns(allFiles);
  }, [allFiles]);

  // Board columns visibility state with local storage persistence
  const [boardVisibleColumns, setBoardVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(BOARD_COLUMNS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {
      console.error('Failed to load board columns from local storage', e);
    }
    return new Set(allBoardColumns);
  });

  const [isBoardColDropdownOpen, setIsBoardColDropdownOpen] = useState(false);
  const boardColDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BOARD_COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(boardVisibleColumns)));
    } catch (e) {
      console.error('Failed to save board columns to local storage', e);
    }
  }, [boardVisibleColumns]);

  // Close dropdown or empty search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (boardColDropdownRef.current && !boardColDropdownRef.current.contains(target)) {
        setIsBoardColDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        // If search input is empty or contains only whitespace, auto-close search on outside click
        const currentQuery = tabSearchQueries[activeSubView] || '';
        if (!currentQuery.trim()) {
          setIsMobileSearchOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [tabSearchQueries, activeSubView]);

  const toggleBoardColumn = (col: string) => {
    setBoardVisibleColumns(prev => {
      // If all are currently visible, solo mode: activate only this one
      if (prev.size === allBoardColumns.length) {
        return new Set([col]);
      }
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const toggleAllBoardColumns = () => {
    if (boardVisibleColumns.size === allBoardColumns.length) {
      setBoardVisibleColumns(new Set()); // Hide all
    } else {
      setBoardVisibleColumns(new Set(allBoardColumns)); // Show all
    }
  };

  // Filter notes by search query and dynamic properties
  const filteredNotes = React.useMemo(() => {
    let result = allFiles;

    const currentFilters = tabFilters[activeSubView] || [];
    if (currentFilters.length > 0) {
      result = result.filter(note => {
        return currentFilters.every(filter => {
          const propKey = filter.property;
          let val = note.properties?.[propKey];
          if (val === undefined || val === null) {
            val = (note as any)[propKey];
          }
          if ((val === undefined || val === null) && propKey === 'type') {
            val = note.type || note.properties?.['noteType'];
          }

          const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

          if (filter.value === '-') {
            return isEmpty;
          }

          if (isEmpty) return false;
          
          const filterValLower = filter.value.toLowerCase().trim().replace(/^#/, '');
          if (!filterValLower) return true;
          
          if (Array.isArray(val)) {
            if (propKey === 'tags') {
              return val.some(v => isSameOrDescendantTag(String(v), filterValLower));
            }
            return val.some(v => String(v).toLowerCase().includes(filterValLower));
          }
          if (typeof val === 'boolean') {
            return String(val).toLowerCase() === filterValLower;
          }
          return String(val).toLowerCase().includes(filterValLower);
        });
      });
    }

    const currentSearchQuery = tabSearchQueries[activeSubView] || '';
    if (currentSearchQuery.trim()) {
      const query = currentSearchQuery.toLowerCase().trim().replace(/^#/, '');
      result = result.filter(note => {
        const matchTitle = note.title.toLowerCase().includes(query);
        const matchTags = note.tags?.some(tag => tag.toLowerCase().includes(query) || isSameOrDescendantTag(tag, query));
        const matchSummary = note.summary?.toLowerCase().includes(query);
        const matchConcepts = note.concepts?.some(concept => concept.toLowerCase().includes(query));
        
        return matchTitle || matchTags || matchSummary || matchConcepts;
      });
    }

    return result;
  }, [allFiles, tabSearchQueries, tabFilters, activeSubView]);

  // Aggregate high-level stats (using unfiltered allFiles for global context)
  const stats = React.useMemo(() => {
    let tagCount = new Set<string>();
    let statusCounts: Record<string, number> = {};

    allFiles.forEach(file => {
      file.tags?.forEach(t => tagCount.add(t));
      if (file.status) {
        statusCounts[file.status] = (statusCounts[file.status] || 0) + 1;
      }
    });

    return {
      totalNotes: allFiles.length,
      totalTags: tagCount.size,
      statusCounts
    };
  }, [allFiles]);

  const navItems: { id: HubSubView; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; category: 'metadata' | 'discovery'; badge?: string }[] = [
    { id: 'table', label: 'Table Matrix', icon: Table2, category: 'metadata' },
    { id: 'board', label: 'Board / Kanban', icon: SquareKanban, category: 'metadata' },
    { id: 'concepts', label: 'Peta Konsep', icon: Waypoints, category: 'metadata' },
    { id: 'graph', label: 'Graph View', icon: Network, category: 'discovery' },
  ];

  return (
    <div className="flex-1 h-full flex flex-col lg:flex-row bg-bg-primary text-text-primary overflow-hidden select-none">
      {/* 1. Desktop Left Hub Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border-default bg-bg-surface/70 shrink-0 select-none">
        {/* Hub Header */}
        <div className="p-4 border-b border-border-default flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary">
            <Database size={16} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-text-heading">HUB Directory</h2>
            <p className="text-[11px] text-text-muted">Knowledge Matrix & Views</p>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Group 1: Metadata Views */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-text-muted/70 uppercase">
              Metadata & Views
            </div>
            <div className="space-y-0.5">
              {navItems.filter(i => i.category === 'metadata').map((item) => {
                const Icon = item.icon;
                const isActive = activeSubView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubView(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent-primary' : 'text-text-muted'} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={13} className="text-accent-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Knowledge Discovery (Future-Proof Modules) */}
          <div>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider text-text-muted/70 uppercase">
              Discovery & Visuals
            </div>
            <div className="space-y-0.5">
              {navItems.filter(i => i.category === 'discovery').map((item) => {
                const Icon = item.icon;
                const isActive = activeSubView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubView(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} strokeWidth={1.8} className="text-text-muted" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-bg-hover text-text-muted border border-border-subtle">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Vault Metric Footer */}
        <div className="p-3 border-t border-border-default bg-bg-surface/90 text-xs">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5">
            <span>Vault Total</span>
            <span className="font-semibold text-text-primary">{stats.totalNotes} Notes</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span>Indexed Tags</span>
            <span className="font-semibold text-text-primary">{stats.totalTags} Tags</span>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace / Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header / Action Bar */}
        <div className="relative z-30 px-4 lg:px-6 py-3 border-b border-border-default bg-bg-surface/50 backdrop-blur-md flex flex-row items-center justify-between gap-3 shrink-0">
          {/* Title - Hidden on mobile if search is open */}
          <div className={`flex items-center gap-2 ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
            <h1 className="text-base font-semibold text-text-heading capitalize">
              {navItems.find(i => i.id === activeSubView)?.label || 'HUB View'}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              {allFiles.length} item
            </span>
          </div>

          {/* Right Header Actions: Column settings (Board on mobile) + Search */}
          {activeSubView !== 'graph' && (
            <div className={`flex items-center justify-end gap-2 ${isMobileSearchOpen ? 'w-full sm:w-auto' : ''}`}>
              {/* Mobile Column Settings Dropdown (Only on Board view, hidden when mobile search is open) */}
              {activeSubView === 'board' && !isMobileSearchOpen && (
                <div className="lg:hidden relative z-50" ref={boardColDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBoardColDropdownOpen(!isBoardColDropdownOpen)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border-default text-[11px] font-medium text-text-secondary hover:text-text-primary hover:border-accent-primary/40 transition-colors shadow-xs"
                    title="Column Visibility"
                  >
                    <Eye size={13} className="text-accent-primary" />
                    <span>{boardVisibleColumns.size}/{allBoardColumns.length}</span>
                    <ChevronDown size={12} className={`transition-transform duration-150 ${isBoardColDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isBoardColDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-bg-surface border border-border-default rounded-xl shadow-2xl z-50 flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                      <button
                        type="button"
                        onClick={toggleAllBoardColumns}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors border-b border-border-subtle"
                      >
                        {boardVisibleColumns.size === allBoardColumns.length ? (
                          <CheckSquare size={14} className="text-accent-primary" />
                        ) : (
                          <Square size={14} className="text-text-muted" />
                        )}
                        Select All
                      </button>
                      
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {allBoardColumns.map(col => {
                          const isVisible = boardVisibleColumns.has(col);
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => toggleBoardColumn(col)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                              {isVisible ? (
                                <CheckSquare size={14} className="text-accent-primary shrink-0" />
                              ) : (
                                <Square size={14} className="text-text-muted shrink-0" />
                              )}
                              <span className="truncate">{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search Container with Auto-expand and Right-side Close Icon */}
              <div ref={searchContainerRef} className={`relative flex items-center ${isMobileSearchOpen ? 'w-full' : ''}`}>
                {!isMobileSearchOpen ? (
                  <>
                    {/* Mobile: Search Icon Only Button */}
                    <button 
                      type="button"
                      onClick={() => setIsMobileSearchOpen(true)}
                      className="sm:hidden p-2 rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors cursor-pointer"
                      title="Search"
                    >
                      <Search size={16} />
                    </button>

                    {/* Desktop: Standard Search Input */}
                    <div className="hidden sm:block relative w-48 focus-within:w-64 transition-all duration-200">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        value={tabSearchQueries[activeSubView] || ''}
                        onChange={(e) => setTabSearchQueries(prev => ({ ...prev, [activeSubView]: e.target.value }))}
                        placeholder={`Search ${activeSubView}...`}
                        className="w-full pl-8 pr-8 py-1.5 text-xs bg-bg-surface border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
                      />
                      {tabSearchQueries[activeSubView] && (
                        <button 
                          type="button"
                          onClick={() => setTabSearchQueries(prev => ({ ...prev, [activeSubView]: '' }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                          title="Clear search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  /* Mobile: Expanded Search Input with Right-aligned Close Button */
                  <div className="flex sm:hidden relative w-full items-center animate-in fade-in zoom-in-95 duration-150">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={tabSearchQueries[activeSubView] || ''}
                      onChange={(e) => setTabSearchQueries(prev => ({ ...prev, [activeSubView]: e.target.value }))}
                      placeholder={`Search ${activeSubView}...`}
                      autoFocus
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-bg-surface border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setTabSearchQueries(prev => ({ ...prev, [activeSubView]: '' }));
                        setIsMobileSearchOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                      title="Close search"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile Horizontal Sub-Navigation Tab Bar */}
        <div className="flex lg:hidden p-2 gap-1.5 border-b border-border-default bg-bg-surface/80 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => setActiveSubView(item.id)}
                className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-primary text-accent-contrast shadow-xs'
                    : 'bg-bg-hover text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              </button>
            );
          })}
        </div>

        {/* Independent Tab Filter Bar */}
        {activeSubView !== 'graph' && (
          <div className="px-4 lg:px-6 py-2 border-b border-border-default bg-bg-surface/30">
            <HubFilterBar 
              notes={allFiles} 
              filters={tabFilters[activeSubView] || []} 
              onChange={(newFilters) => setTabFilters(prev => ({ ...prev, [activeSubView]: newFilters }))} 
            />
          </div>
        )}

        {/* Sub-View Content Canvas Container */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col ${activeSubView === 'graph' ? 'p-2 lg:p-3' : 'p-4 lg:p-6'}`}>
          {/* Active View Container */}
          <div className={`w-full flex-1 flex flex-col ${activeSubView === 'graph' ? 'h-full' : 'max-w-7xl mx-auto space-y-4'}`}>

            {/* Active Sub-View Rendering */}
            <div className={`w-full flex-1 flex flex-col`}>
              {activeSubView === 'table' && (
                <TableView notes={filteredNotes} filters={tabFilters['table'] || []} onOpenNote={navigateToNote} />
              )}
              {activeSubView === 'board' && (
                <BoardView 
                  notes={filteredNotes} 
                  filters={tabFilters['board'] || []} 
                  visibleColumns={boardVisibleColumns}
                  onToggleColumn={toggleBoardColumn}
                  onToggleAll={toggleAllBoardColumns}
                  onOpenNote={navigateToNote}
                  onUpdateNoteProperty={(id, prop, val) => vaultState?.updateNoteMetadata(id, { [prop]: val })}
                />
              )}
              {activeSubView === 'concepts' && (
                <ConceptsView notes={filteredNotes} onOpenNote={navigateToNote} />
              )}
              {activeSubView === 'graph' && (
                <GraphView notes={filteredNotes} onOpenNote={navigateToNote} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
