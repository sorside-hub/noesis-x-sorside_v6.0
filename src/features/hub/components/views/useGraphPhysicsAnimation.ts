import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { EnrichedNoteItem } from '../../types';
import { generateGraphData } from '../../utils/graphEngine';
import { DisplaySettings, ForceSettings, GraphFilter } from './GraphTypes';
import { matchesGroupRule } from './useGraphDataExtraction';

interface UseGraphPhysicsAnimationOptions {
  notes: EnrichedNoteItem[];
  displaySettings: DisplaySettings;
  forceSettings: ForceSettings;
  customFilters: GraphFilter[];
  dimensions: { width: number; height: number };
}

export function useGraphPhysicsAnimation({
  notes,
  displaySettings,
  forceSettings,
  customFilters,
  dimensions,
}: UseGraphPhysicsAnimationOptions) {
  const fgRef = useRef<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleNodeCount, setVisibleNodeCount] = useState<number | null>(null);
  const animationTimerRef = useRef<any>(null);
  const hasAutoFittedInitialRef = useRef<boolean>(false);

  // Clean up animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);

  // Sort notes chronologically (oldest to newest) for true Obsidian playback
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return timeA - timeB;
    });
  }, [notes]);

  // Initialize graph data with dynamic grouping, optional filtering & timelapse slicing
  const fullGraphData = useMemo(() => {
    // 0. Base Graph Generation
    const rawData = generateGraphData(sortedNotes, 'type');
    
    // 1. Filter Nodes based on customFilters
    let finalNodes = rawData.nodes;
    if (customFilters.length > 0) {
      finalNodes = finalNodes.filter((node) => {
        if (displaySettings.filterMatchMode === 'all') {
          // AND logic: must match ALL filters
          return customFilters.every((filter) => matchesGroupRule(node, filter as any));
        } else {
          // OR logic: must match ANY filter
          return customFilters.some((filter) => matchesGroupRule(node, filter as any));
        }
      });
    }

    // 2. Filter Links (Keep links where BOTH source and target exist in finalNodes)
    const validNodeIds = new Set(finalNodes.map((n) => n.id));
    let finalLinks = rawData.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    });

    if (!displaySettings.showSemanticLinks) {
      finalLinks = finalLinks.filter((l) => l.type !== 'semantic');
    }

    // 2.5 Inject Virtual Filter Links
    if (customFilters.length > 0) {
      const virtualLinks: any[] = [];
      const virtualLinkSet = new Set<string>();

      customFilters.forEach((filter) => {
        // Find nodes matching this specific filter
        const matchingNodes = finalNodes.filter((node) => matchesGroupRule(node, filter as any));
        
        // Fully connect all nodes that match this same filter
        for (let i = 0; i < matchingNodes.length; i++) {
          for (let j = i + 1; j < matchingNodes.length; j++) {
            const sourceId = matchingNodes[i].id;
            const targetId = matchingNodes[j].id;
            // Order-independent link key to prevent duplicates
            const linkKey = [sourceId, targetId].sort().join('::');
            
            if (!virtualLinkSet.has(linkKey)) {
              virtualLinkSet.add(linkKey);
              virtualLinks.push({
                source: sourceId,
                target: targetId,
                type: 'virtual_filter',
              });
            }
          }
        }
      });
      
      finalLinks = [...finalLinks, ...virtualLinks];
    }

    // 3. Filter Nodes (Orphans)
    if (displaySettings.hideOrphans) {
      const linkedNodeIds = new Set<string>();
      finalLinks.forEach((l) => {
        linkedNodeIds.add(typeof l.source === 'object' ? (l.source as any).id : l.source);
        linkedNodeIds.add(typeof l.target === 'object' ? (l.target as any).id : l.target);
      });
      finalNodes = finalNodes.filter((n) => linkedNodeIds.has(n.id));
    }

    return { nodes: finalNodes, links: finalLinks };
  }, [sortedNotes, displaySettings.hideOrphans, displaySettings.showSemanticLinks, displaySettings.filterMatchMode, customFilters]);

  // Active graph data rendered on canvas (supports progressive emergence animation)
  const renderedGraphData = useMemo(() => {
    if (visibleNodeCount === null) {
      return fullGraphData;
    }

    const activeNodes = fullGraphData.nodes.slice(0, visibleNodeCount);
    const activeNodeIdSet = new Set(activeNodes.map((n) => n.id));

    // Only include links whose BOTH endpoints are currently present
    const activeLinks = fullGraphData.links.filter((l) => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return activeNodeIdSet.has(sourceId) && activeNodeIdSet.has(targetId);
    });
    return { nodes: activeNodes, links: activeLinks };
  }, [fullGraphData, visibleNodeCount]);

  // Physics tuning driven by Obsidian Forces sliders
  useEffect(() => {
    if (fgRef.current && typeof fgRef.current.d3Force === 'function') {
      // 1. Charge force / Repel force
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        const strength = -1 * (forceSettings.repelForce * 20);
        chargeForce.strength(strength);
        chargeForce.distanceMax(forceSettings.linkDistance * 1.5);
      }

      // 2. Link force & distance
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(forceSettings.linkDistance);
        linkForce.strength(forceSettings.linkForce * 0.8);
      }

      // 3. Center Force / Center Gravity
      fgRef.current.d3Force('centerGravity', () => {
        const currentNodes = renderedGraphData.nodes || [];
        const gravityMult = forceSettings.centerForce * 0.012;
        currentNodes.forEach((node: any) => {
          node.vx = (node.vx || 0) - (node.x || 0) * gravityMult;
          node.vy = (node.vy || 0) - (node.y || 0) * gravityMult;
        });
      });

      // Reheat simulation slightly to apply new forces smoothly
      if (typeof fgRef.current.d3ReheatSimulation === 'function') {
        fgRef.current.d3ReheatSimulation();
      }
    }
  }, [renderedGraphData, forceSettings]);

  // Smart Bounded Auto-Fit Zoom Calculation (Calculated against a specific node list or fullGraphData)
  const smartAutoFit = useCallback((targetNodes?: any[], duration = 500) => {
    if (!fgRef.current) return;
    const nodesToFit = targetNodes || (fullGraphData.nodes.length > 0 ? fullGraphData.nodes : renderedGraphData.nodes) || [];
    if (nodesToFit.length === 0) {
      if (typeof fgRef.current.centerAt === 'function') fgRef.current.centerAt(0, 0, duration);
      if (typeof fgRef.current.zoom === 'function') fgRef.current.zoom(1.0, duration);
      return;
    }

    if (nodesToFit.length === 1) {
      // Exactly 1 note: Center at the note coordinates and clamp zoom to standard 1.0x (not huge!)
      const singleNode = nodesToFit[0] as any;
      const nx = typeof singleNode.x === 'number' ? singleNode.x : 0;
      const ny = typeof singleNode.y === 'number' ? singleNode.y : 0;
      if (typeof fgRef.current.centerAt === 'function') fgRef.current.centerAt(nx, ny, duration);
      if (typeof fgRef.current.zoom === 'function') fgRef.current.zoom(1.0, duration);
      return;
    }

    // Multiple nodes: Calculate true bounding box with virtual minimum size guard
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let validCount = 0;

    nodesToFit.forEach((n: any) => {
      if (typeof n.x === 'number' && !isNaN(n.x) && typeof n.y === 'number' && !isNaN(n.y)) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
        validCount++;
      }
    });

    if (validCount === 0 || minX === Infinity) {
      if (typeof fgRef.current.zoomToFit === 'function') {
        fgRef.current.zoomToFit(duration, 80);
      }
      return;
    }

    const rawW = maxX - minX;
    const rawH = maxY - minY;
    // Enforce virtual minimum bounding box size (450px) so small/few notes never over-zoom
    const minBounding = 450;
    const graphW = Math.max(rawW, minBounding);
    const graphH = Math.max(rawH, minBounding);

    const padding = 80;
    const availW = Math.max((dimensions.width || 800) - padding * 2, 200);
    const availH = Math.max((dimensions.height || 600) - padding * 2, 200);

    const scaleX = availW / graphW;
    const scaleY = availH / graphH;

    // Clamp zoom: max 1.0 (natural size, never blown up) and min 0.1 (hundreds of notes fit in 1 screen)
    const targetK = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 1.0);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    if (typeof fgRef.current.centerAt === 'function') fgRef.current.centerAt(centerX, centerY, duration);
    if (typeof fgRef.current.zoom === 'function') fgRef.current.zoom(targetK, duration);
  }, [dimensions, fullGraphData.nodes, renderedGraphData.nodes]);

  // Pre-calculate and lock camera BEFORE emergence animation begins
  const prepareInitialCamera = useCallback(() => {
    if (!fgRef.current || fullGraphData.nodes.length === 0) return;
    smartAutoFit(fullGraphData.nodes, 0); // 0ms instant positioning
  }, [fullGraphData.nodes, smartAutoFit]);

  // Perform initial auto-fit on mount once dimensions and nodes are available
  useEffect(() => {
    if (hasAutoFittedInitialRef.current) return;
    if (dimensions.width > 0 && dimensions.height > 0 && fullGraphData.nodes.length > 0) {
      hasAutoFittedInitialRef.current = true;
      // Slight delay to allow d3 force simulation to warm up initial coordinates
      const timer = setTimeout(() => {
        smartAutoFit(fullGraphData.nodes, 400);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [dimensions.width, dimensions.height, fullGraphData.nodes, smartAutoFit]);

  // Zoom Controls Handlers
  const handleZoomIn = () => {
    if (fgRef.current && typeof fgRef.current.zoom === 'function') {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.3, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current && typeof fgRef.current.zoom === 'function') {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.3, 300);
    }
  };

  const handleResetZoom = () => {
    smartAutoFit(undefined, 500);
  };

  // TRUE OBSIDIAN ANIMATION: Progressive Timeline Emergence (0 -> 1 -> 2 ... -> All Nodes)
  const handleToggleAnimate = () => {
    if (isAnimating) {
      // If already playing, stop animation immediately and show full graph
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      setIsAnimating(false);
      setVisibleNodeCount(null);
      setTimeout(() => smartAutoFit(fullGraphData.nodes, 400), 50);
      return;
    }

    const totalNodes = fullGraphData.nodes.length;
    if (totalNodes === 0) return;

    // Lock camera framing before clearing canvas so there's no zoom-jump
    prepareInitialCamera();

    // 1. Reset visible count to 0
    setIsAnimating(true);
    setVisibleNodeCount(0);
    let currentCount = 0;
    const intervalMs = Math.max(70, Math.min(250, Math.floor(3500 / Math.max(totalNodes, 1))));
    if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    animationTimerRef.current = setInterval(() => {
      currentCount += 1;
      if (currentCount <= totalNodes) {
        setVisibleNodeCount(currentCount);
        if (fgRef.current?.d3ReheatSimulation) {
          fgRef.current.d3ReheatSimulation();
        }
      } else {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
        setIsAnimating(false);
        setVisibleNodeCount(null);
        setTimeout(() => {
          smartAutoFit(fullGraphData.nodes, 400);
        }, 80);
      }
    }, intervalMs);
  };

  return {
    fgRef,
    fullGraphData,
    renderedGraphData,
    isAnimating,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleToggleAnimate,
  };
}
