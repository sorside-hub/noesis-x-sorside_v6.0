import React, { useRef, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { LocalGraphNode, LocalGraphLink } from './types';

interface LocalGraphCanvasProps {
  nodes: LocalGraphNode[];
  links: LocalGraphLink[];
  dimensions: { width: number; height: number };
  fgRef: React.RefObject<any>;
  onSelectNode: (id: string) => void;
}

export const LocalGraphCanvas: React.FC<LocalGraphCanvasProps> = ({
  nodes,
  links,
  dimensions,
  fgRef,
  onSelectNode,
}) => {
  const [hoverNode, setHoverNode] = useState<LocalGraphNode | null>(null);

  // Custom Node Painter
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isCenter = !!node.isCenter;
      const isHovered = hoverNode?.id === node.id;
      
      // Node radius scales inversely with sqrt(globalScale) so nodes grow gracefully
      const baseRadius = isCenter ? 8 : Math.max(4.5, 7.5 - (node.distance || 1));
      const radius = baseRadius / Math.sqrt(globalScale);

      const x = node.x || 0;
      const y = node.y || 0;

      // Draw Center Node Glow
      if (isCenter) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4 / Math.sqrt(globalScale), 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(197, 163, 106, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius + 2 / Math.sqrt(globalScale), 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(197, 163, 106, 0.4)';
        ctx.fill();
      }

      // Main Circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      if (isCenter) {
        ctx.fillStyle = '#C5A36A'; // Primary gold accent
      } else if (isHovered) {
        ctx.fillStyle = '#FFFFFF';
      } else if (node.distance === 1) {
        ctx.fillStyle = '#818cf8'; // Indigo for direct neighbor
      } else {
        ctx.fillStyle = '#64748b'; // Slate for 2-hop / 3-hop
      }
      ctx.fill();

      // Border outline
      ctx.lineWidth = Math.max(0.8 / Math.sqrt(globalScale), 0.4);
      ctx.strokeStyle = isCenter ? '#fff' : 'rgba(0,0,0,0.4)';
      ctx.stroke();

      // 2. Dynamic Text Label Rendering with Zoom Log Fade Threshold (Obsidian Style)
      const zoomLog = Math.log2(globalScale);
      // Default textFadeThreshold is 0.0 (fades smoothly when zoomed out, crisp when zoomed in, always 1 for hovered/center)
      const fadeDiff = zoomLog - 0.0;
      let textOpacity = 1;
      if (fadeDiff < 0) {
        textOpacity = Math.max(0, 1 + fadeDiff * 1.5);
      }
      if (isHovered || isCenter) {
        textOpacity = 1;
      }

      if (textOpacity > 0.05 && node.name) {
        // Font size is divided by globalScale so screen font size stays constant/compact when zooming in!
        const baseFontSize = isCenter ? 11 : 9.5;
        const fontSize = Math.max(baseFontSize / globalScale, 2);
        ctx.font = `${isCenter || isHovered ? '600' : '400'} ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const label = node.name;
        const truncatedLabel =
          label.length > 22 && !isHovered && !isCenter ? label.substring(0, 20) + '...' : label;

        const isLight =
          document.documentElement.getAttribute('data-theme') === 'editorial-light' ||
          document.documentElement.getAttribute('data-theme') === 'warm-parchment' ||
          document.documentElement.classList.contains('light');

        // Obsidian style clean text directly on Canvas
        if (isLight) {
          ctx.fillStyle = isCenter
            ? '#141414'
            : isHovered
            ? '#000000'
            : `rgba(45, 42, 38, ${Math.min(1, textOpacity * 0.9 + 0.1)})`;
        } else {
          ctx.fillStyle = isCenter
            ? '#F5E8D2'
            : isHovered
            ? '#FFFFFF'
            : `rgba(220, 220, 225, ${Math.min(1, textOpacity * 0.9 + 0.1)})`;
        }

        const labelY = y + radius + 3 / globalScale;
        ctx.fillText(truncatedLabel, x, labelY);
      }
    },
    [hoverNode]
  );

  // Custom Link Painter with distinct color coding per connection type
  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const isTag = link.type === 'tag';
    const isOutgoing = link.type === 'wikilink-out';
    const isBacklink = link.type === 'wikilink-in';
    const isAi = link.type === 'ai-related';

    // Color palette per connection type:
    // - Outgoing Wikilinks: Crisp Cyan-Blue (#38bdf8)
    // - Backlinks: Emerald Green (#34d399)
    // - Shared Tags: Warm Amber/Orange (#fbbf24) with dashes
    // - AI Smart Related: Vivid Purple/Violet (#a855f7) with dots
    if (isTag) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'; // Amber
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
    } else if (isBacklink) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)'; // Emerald
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
    } else if (isAi) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)'; // Purple
      ctx.lineWidth = 1.4;
      ctx.setLineDash([2, 3]);
    } else {
      // Outgoing Wikilinks (Default)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'; // Cyan
      ctx.lineWidth = 1.6;
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  if (dimensions.width === 0 || dimensions.height === 0) return null;

  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing bg-bg-base/30">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes: [...nodes], links: [...links] }}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        linkCanvasObject={paintLink}
        onNodeClick={(node: any) => node?.id && onSelectNode(node.id)}
        onNodeHover={(node: any) => setHoverNode(node || null)}
        backgroundColor="transparent"
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        cooldownTicks={100}
        minZoom={0.1}
        maxZoom={5}
        enableNodeDrag={true}
      />
    </div>
  );
};
