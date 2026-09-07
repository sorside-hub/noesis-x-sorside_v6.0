import React, { useRef, useState, useEffect } from 'react';
import { Network, Link2, Layers } from 'lucide-react';
import { VaultData, FileNode } from '../../../../types/vault';
import { useLocalGraphControls } from './useLocalGraphControls';
import { useLocalGraphData } from './useLocalGraphData';
import { useLocalGraphPhysics } from './useLocalGraphPhysics';
import { LocalGraphHeader } from './LocalGraphHeader';
import { LocalGraphCanvas } from './LocalGraphCanvas';

interface LocalGraphTabProps {
  vault: VaultData;
  activeNode: FileNode | null;
  onSelectFile: (id: string) => void;
}

export const LocalGraphTab: React.FC<LocalGraphTabProps> = ({
  vault,
  activeNode,
  onSelectFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Controls & Filter State
  const {
    filters,
    setDepth,
    toggleOutgoing,
    toggleBacklinks,
    toggleTags,
    toggleSemantic,
    isFilterMenuOpen,
    setIsFilterMenuOpen,
  } = useLocalGraphControls();

  // 2. Data Traversal Hook
  const { nodes, links, stats } = useLocalGraphData({
    vault,
    activeNode,
    filters,
  });

  // 3. Physics & Camera Hook
  const {
    fgRef,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  } = useLocalGraphPhysics({
    nodes,
    dimensions,
    activeNodeId: activeNode?.id,
  });

  // 4. Responsive Container Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!activeNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-text-muted">
        <Network size={28} className="text-text-muted/40 mb-2" />
        <span className="text-xs">Select a note to view its local connections</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-bg-surface/50">
      {/* 1. Header (Top) */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-surface/90 border-b border-border-default select-none">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
          <Layers size={14} className="text-accent-primary" />
          <span>Local Graph</span>
        </div>
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20">
          {stats.totalNodes} {stats.totalNodes === 1 ? 'node' : 'nodes'}
        </span>
      </div>

      {/* 2. Canvas Area (Middle) */}
      <div ref={containerRef} className="flex-1 w-full relative min-h-[300px] overflow-hidden">
        {stats.totalNodes <= 1 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pointer-events-none text-center bg-bg-surface/30 backdrop-blur-2xs">
            <div className="p-3 bg-accent-primary/5 rounded-full border border-accent-primary/15 text-accent-primary mb-2">
              <Link2 size={20} />
            </div>
            <p className="text-xs font-medium text-text-secondary max-w-[220px]">
              No connections found for this note yet.
            </p>
            <p className="text-[11px] text-text-muted mt-1 max-w-[220px]">
              Add <span className="text-accent-primary font-mono">[[Wikilinks]]</span> or <span className="text-amber-400 font-mono">#tags</span> in the editor to link notes.
            </p>
          </div>
        )}

        <LocalGraphCanvas
          nodes={nodes}
          links={links}
          dimensions={dimensions}
          fgRef={fgRef}
          onSelectNode={onSelectFile}
        />
      </div>

      {/* 3. Controls Bar: Depth, Filters, Zoom in 1 single row (Bottom) */}
      <LocalGraphHeader
        filters={filters}
        stats={stats}
        onSetDepth={setDepth}
        onToggleOutgoing={toggleOutgoing}
        onToggleBacklinks={toggleBacklinks}
        onToggleTags={toggleTags}
        onToggleSemantic={toggleSemantic}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        isFilterOpen={isFilterMenuOpen}
        onToggleFilter={() => setIsFilterMenuOpen((prev) => !prev)}
        onCloseFilter={() => setIsFilterMenuOpen(false)}
      />
    </div>
  );
};
