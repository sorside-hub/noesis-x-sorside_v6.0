import { useRef, useCallback, useEffect } from 'react';
import { LocalGraphNode } from './types';

interface UseLocalGraphPhysicsOptions {
  nodes: LocalGraphNode[];
  dimensions: { width: number; height: number };
  activeNodeId?: string;
}

export function useLocalGraphPhysics({
  nodes,
  dimensions,
  activeNodeId,
}: UseLocalGraphPhysicsOptions) {
  const fgRef = useRef<any>(null);

  const smartAutoFit = useCallback(
    (duration = 400) => {
      if (!fgRef.current || nodes.length === 0) return;

      const centerNode = nodes.find((n) => n.isCenter);
      const cx = centerNode?.x ?? 0;
      const cy = centerNode?.y ?? 0;

      if (nodes.length === 1) {
        if (typeof fgRef.current.centerAt === 'function') {
          fgRef.current.centerAt(cx, cy, duration);
        }
        if (typeof fgRef.current.zoom === 'function') {
          fgRef.current.zoom(1.2, duration);
        }
        return;
      }

      // Calculate bounds
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let validCount = 0;

      nodes.forEach((n) => {
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
          fgRef.current.zoomToFit(duration, 40);
        }
        return;
      }

      const graphW = Math.max(maxX - minX, 260);
      const graphH = Math.max(maxY - minY, 260);
      const padding = 45;

      const availW = Math.max(dimensions.width - padding * 2, 120);
      const availH = Math.max(dimensions.height - padding * 2, 120);

      const scale = Math.min(availW / graphW, availH / graphH);
      const clampedK = Math.min(Math.max(scale, 0.2), 1.15);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      if (typeof fgRef.current.centerAt === 'function') {
        fgRef.current.centerAt(midX, midY, duration);
      }
      if (typeof fgRef.current.zoom === 'function') {
        fgRef.current.zoom(clampedK, duration);
      }
    },
    [nodes, dimensions]
  );

  // Apply spacious physics forces for local graph
  useEffect(() => {
    if (fgRef.current && typeof fgRef.current.d3Force === 'function') {
      // 1. Charge force / Repel (Push nodes apart so they don't crowd each other)
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(-280);
        chargeForce.distanceMax(350);
      }

      // 2. Link force & distance (Give cables enough room to breathe)
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(95);
        linkForce.strength(0.6);
      }

      // Reheat simulation slightly to spread nodes smoothly
      if (typeof fgRef.current.d3ReheatSimulation === 'function') {
        fgRef.current.d3ReheatSimulation();
      }
    }
  }, [nodes.length]);

  // Auto-fit on node count / active note change
  useEffect(() => {
    if (nodes.length > 0 && dimensions.width > 0 && dimensions.height > 0) {
      const timer = setTimeout(() => {
        smartAutoFit(300);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeNodeId, nodes.length, smartAutoFit, dimensions.width, dimensions.height]);

  const handleZoomIn = () => {
    if (!fgRef.current) return;
    const current = fgRef.current.zoom ? fgRef.current.zoom() : 1;
    fgRef.current.zoom(Math.min(current * 1.3, 4), 200);
  };

  const handleZoomOut = () => {
    if (!fgRef.current) return;
    const current = fgRef.current.zoom ? fgRef.current.zoom() : 1;
    fgRef.current.zoom(Math.max(current / 1.3, 0.1), 200);
  };

  const handleResetZoom = () => {
    smartAutoFit(400);
  };

  return {
    fgRef,
    smartAutoFit,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  };
}
