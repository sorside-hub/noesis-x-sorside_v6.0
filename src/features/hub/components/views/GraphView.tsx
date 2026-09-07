import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphViewProps, GraphNode, PRESET_COLORS } from './GraphTypes';
import { useGraphSettings } from './useGraphSettings';
import { GraphSettingsPanel } from './GraphSettingsPanel';
import { GraphToolbar } from './GraphToolbar';
import { useGraphDataExtraction, matchesGroupRule } from './useGraphDataExtraction';
import { useGraphCanvasPainter } from './useGraphCanvasPainter';
import { useGraphPhysicsAnimation } from './useGraphPhysicsAnimation';

export const GraphView: React.FC<GraphViewProps> = ({ notes, onOpenNote }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [dragNode, setDragNode] = useState<GraphNode | null>(null);

  const activeNode = dragNode || hoverNode;

  // Settings & Custom Groups Hook
  const {
    showSettings,
    setShowSettings,
    openSections,
    toggleSection,
    displaySettings,
    setDisplaySettings,
    forceSettings,
    setForceSettings,
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
    handleResetSettings,
    handleAddGroup,
    handleAddFilter,
  } = useGraphSettings();

  // Dynamic Properties Extraction
  const { availableProperties, propertyValuesMap } = useGraphDataExtraction(notes);

  // Physics Simulation & Timelapse Animation Hook
  const {
    fgRef,
    fullGraphData,
    renderedGraphData,
    isAnimating,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleToggleAnimate,
  } = useGraphPhysicsAnimation({
    notes,
    displaySettings,
    forceSettings,
    customFilters,
    dimensions,
  });

  // Compute Highlighted Nodes and Links for Focus/Fade effect
  const { highlightNodes, highlightLinks } = useMemo(() => {
    const nodes = new Set<string>();
    const links = new Set<any>();

    if (activeNode) {
      nodes.add(activeNode.id);
      renderedGraphData.links.forEach((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === activeNode.id) {
          nodes.add(targetId);
          links.add(link);
        } else if (targetId === activeNode.id) {
          nodes.add(sourceId);
          links.add(link);
        }
      });
    }
    return { highlightNodes: nodes, highlightLinks: links };
  }, [activeNode, renderedGraphData.links]);

  // Canvas Node & Link Painters
  const { paintNode, paintLink } = useGraphCanvasPainter({
    activeNode,
    highlightNodes,
    highlightLinks,
    customGroups,
    displaySettings,
  });

  // Compute matched node count per group for real-time UI indicator badge
  const groupMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    customGroups.forEach((group) => {
      counts[group.id] = fullGraphData.nodes.filter((n) => matchesGroupRule(n, group)).length;
    });
    return counts;
  }, [customGroups, fullGraphData.nodes]);

  // Responsive container sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
        
        // When the container is hidden (e.g. navigated away), clear any lingering interactions
        if (width === 0 || height === 0) {
          setHoverNode(null);
          setDragNode(null);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Ensure hover/drag state is clean on mount and container mouseleave
  useEffect(() => {
    setHoverNode(null);
    setDragNode(null);
    const el = containerRef.current;
    if (!el) return;
    const handleMouseLeave = () => {
      setHoverNode(null);
      setDragNode(null);
    };
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mouseleave', handleMouseLeave);
      setHoverNode(null);
      setDragNode(null);
    };
  }, []);

  // Interaction Handlers
  const handleNodeClick = useCallback(
    (node: any) => {
      setHoverNode(null);
      setDragNode(null);
      if (node && node.id) {
        onOpenNote(node.id);
      }
    },
    [onOpenNote]
  );

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleNodeHover = useCallback((node: any) => {
    if (isTouchDevice) return;
    setHoverNode(node ? (node as GraphNode) : null);
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = node ? 'pointer' : 'grab';
    }
  }, [isTouchDevice]);

  // Clean up state when component unmounts or before navigating
  useEffect(() => {
    return () => {
      setHoverNode(null);
      setDragNode(null);
    };
  }, []);

  return (
    <div
      className="flex-1 w-full flex flex-col relative rounded-xl border border-border-default overflow-hidden bg-bg-primary min-h-[400px]"
      ref={containerRef}
    >
      {/* Background Texture (Dark Dot Grid) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Action Toolbar */}
      <GraphToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleAnimate={handleToggleAnimate}
        isAnimating={isAnimating}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      {/* Settings Panel */}
      <GraphSettingsPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        openSections={openSections}
        toggleSection={toggleSection as any}
        handleResetSettings={handleResetSettings}
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
        customGroups={customGroups}
        setCustomGroups={setCustomGroups}
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
        handleAddFilter={handleAddFilter}
        availableProperties={availableProperties}
        propertyValuesMap={propertyValuesMap}
        handleAddGroup={handleAddGroup}
        displaySettings={displaySettings}
        setDisplaySettings={setDisplaySettings}
        forceSettings={forceSettings}
        setForceSettings={setForceSettings}
        PRESET_COLORS={PRESET_COLORS}
        groupMatchCounts={groupMatchCounts}
      />

      {/* Force Graph Canvas */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div className="absolute inset-0">
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={renderedGraphData}
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            nodeLabel={isTouchDevice ? () => '' : 'name'}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onBackgroundClick={() => {
              setHoverNode(null);
              setDragNode(null);
            }}
            onNodeDrag={(node) => setDragNode(node ? (node as GraphNode) : null)}
            onNodeDragEnd={() => setDragNode(null)}
            linkDirectionalParticles={link => {
              if (activeNode) {
                return highlightLinks.has(link) ? 3 : 0;
              }
              return displaySettings.showArrows ? 2 : 0;
            }}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            backgroundColor="rgba(0,0,0,0)"
            d3VelocityDecay={0.25}
            warmupTicks={60}
            cooldownTicks={120}
            minZoom={0.05}
            maxZoom={8}
          />
        </div>
      )}

      {/* State Indicator */}
      <div className="absolute top-4 right-4 pointer-events-none px-3 py-1.5 rounded-lg bg-bg-surface/50 backdrop-blur-md border border-border-subtle text-[10px] text-text-muted flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
        {renderedGraphData.nodes.length} Nodes &bull; {renderedGraphData.links.length} Links
      </div>
    </div>
  );
};
