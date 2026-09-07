import { useCallback } from 'react';
import { GraphNode, GraphCustomGroup, DisplaySettings } from './GraphTypes';
import { matchesGroupRule } from './useGraphDataExtraction';

interface UseGraphCanvasPainterOptions {
  activeNode: GraphNode | null;
  highlightNodes: Set<string>;
  highlightLinks: Set<any>;
  customGroups: GraphCustomGroup[];
  displaySettings: DisplaySettings;
}

export function useGraphCanvasPainter({
  activeNode,
  highlightNodes,
  highlightLinks,
  customGroups,
  displaySettings,
}: UseGraphCanvasPainterOptions) {
  // Custom Rendering: Nodes & Text Labels
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      const isActive = activeNode?.id === n.id;
      const isHighlighted = highlightNodes.has(n.id);
      const isDimmed = activeNode !== null && !isHighlighted;
      
      const isLight =
        document.documentElement.getAttribute('data-theme') === 'editorial-light' ||
        document.documentElement.getAttribute('data-theme') === 'warm-parchment' ||
        document.documentElement.classList.contains('light');

      // Dynamic Custom Group Color Palette
      let color = isLight ? '#57534E' : '#9CA3AF';

      // Evaluate Custom Groups (first match wins in true Obsidian fashion)
      for (const group of customGroups) {
        if (matchesGroupRule(n, group)) {
          color = group.color;
          break;
        }
      }

      // Size scaled by Obsidian Ukuran Titik slider
      const size = n.val * displaySettings.nodeSizeScale;
      const x = n.x || 0;
      const y = n.y || 0;

      ctx.save();
      
      if (isDimmed) {
        ctx.globalAlpha = 0.12;
      } else {
        ctx.globalAlpha = 1.0;
      }

      // 1. Draw Circle Node
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI, false);

      // Glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = isActive ? 18 : 6;
      ctx.fillStyle = color;
      ctx.fill();

      // Subtle border / Focus border
      if (isActive) {
        ctx.lineWidth = 2.5 / globalScale;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, size + 4 / globalScale, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1.5 / globalScale;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.stroke();
      } else if (isHighlighted && activeNode) {
        ctx.lineWidth = 1.8 / globalScale;
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
      } else {
        ctx.lineWidth = 1 / globalScale;
        ctx.strokeStyle = color;
        ctx.stroke();
      }

      // Reset shadow for text rendering
      ctx.shadowBlur = 0;

      // 2. Draw Text Label directly on Canvas with Text Fade Threshold
      const zoomLog = Math.log2(globalScale);
      const fadeDiff = zoomLog - displaySettings.textFadeThreshold;

      let textOpacity = 1;
      if (fadeDiff < 0) {
        textOpacity = Math.max(0, 1 + fadeDiff * 1.5);
      }
      if (isActive || isHighlighted) textOpacity = 1;

      const showLabel = (displaySettings.showNodeLabels && textOpacity > 0.05) || isActive || isHighlighted;

      if (showLabel && !isDimmed) {
        const fontSize = Math.max(11 / globalScale, 2.5);
        ctx.font = `${isActive ? '600' : '400'} ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const label = n.name || 'Untitled';
        const truncatedLabel =
          label.length > 20 && !isActive ? label.substring(0, 18) + '...' : label;

        const labelY = y + size + 4 / globalScale;

        // 2. Draw Clean Text Label directly on Canvas without background box (Obsidian style)
        if (isLight) {
          ctx.fillStyle = isActive
            ? '#d97706'
            : isHighlighted && activeNode 
            ? '#b45309'
            : `rgba(45, 42, 38, ${Math.min(1, textOpacity * 0.9 + 0.1)})`;
        } else {
          ctx.fillStyle = isActive
            ? '#fbbf24'
            : isHighlighted && activeNode
            ? '#fcd34d'
            : `rgba(220, 220, 225, ${Math.min(1, textOpacity * 0.9 + 0.1)})`;
        }

        ctx.fillText(truncatedLabel, x, labelY);
      }
      
      ctx.restore();
    },
    [activeNode, highlightNodes, customGroups, displaySettings]
  );

  // Custom Rendering: Links with subtle directional indicators and linkThickness
  const paintLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;

      if (typeof start !== 'object' || typeof end !== 'object') return;
      
      const isHighlightedLink = highlightLinks.has(link) || (activeNode && (start.id === activeNode.id || end.id === activeNode.id));
      const isDimmed = activeNode !== null && !isHighlightedLink;

      const isLight =
        document.documentElement.getAttribute('data-theme') === 'editorial-light' ||
        document.documentElement.getAttribute('data-theme') === 'warm-parchment' ||
        document.documentElement.classList.contains('light');

      const isSemantic = link.type === 'semantic';
      const isVirtual = link.type === 'virtual_filter';
      const thickness = displaySettings.linkThickness;
      
      ctx.save();
      
      if (isDimmed) {
        ctx.globalAlpha = 0.08;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      if (isHighlightedLink) {
        ctx.lineWidth = ((isSemantic || isVirtual ? 1.25 : 1.75) * thickness) / globalScale;
        ctx.strokeStyle = isLight ? 'rgba(245, 158, 11, 0.8)' : 'rgba(251, 191, 36, 0.8)';
      } else {
        ctx.lineWidth = ((isSemantic || isVirtual ? 0.75 : 1.25) * thickness) / globalScale;
        if (isVirtual) {
          ctx.setLineDash([3 / globalScale, 5 / globalScale]);
          ctx.strokeStyle = isLight
            ? 'rgba(14, 165, 233, 0.4)'
            : 'rgba(56, 189, 248, 0.3)';
        } else if (isSemantic) {
          ctx.setLineDash([4 / globalScale, 4 / globalScale]);
          ctx.strokeStyle = isLight
            ? 'rgba(124, 58, 237, 0.6)'
            : 'rgba(167, 139, 250, 0.5)';
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = isLight
            ? 'rgba(20, 20, 20, 0.22)'
            : 'rgba(209, 213, 219, 0.4)';
        }
      }
      
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Arrow if Show Arrows is enabled and it's not a mutual virtual link
      if (displaySettings.showArrows && !isDimmed && !isVirtual) {
        const arrowLength = 5 / globalScale;
        const arrowWidth = 3 / globalScale;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        const midX = start.x + dx * 0.55;
        const midY = start.y + dy * 0.55;

        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowLength, -arrowWidth);
        ctx.lineTo(-arrowLength * 0.7, 0);
        ctx.lineTo(-arrowLength, arrowWidth);
        ctx.closePath();
        
        if (isHighlightedLink) {
          ctx.fillStyle = isLight ? '#d97706' : '#fbbf24';
        } else {
          ctx.fillStyle = isSemantic
            ? isLight
              ? 'rgba(124, 58, 237, 0.8)'
              : 'rgba(167, 139, 250, 0.7)'
            : isLight
            ? 'rgba(20, 20, 20, 0.5)'
            : 'rgba(209, 213, 219, 0.7)';
        }
        ctx.fill();
      }
      
      ctx.restore();
    },
    [activeNode, highlightLinks, displaySettings]
  );

  return {
    paintNode,
    paintLink,
  };
}
