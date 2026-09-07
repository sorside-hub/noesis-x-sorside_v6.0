import { EnrichedNoteItem } from '../../types';
import { GraphNode } from '../../utils/graphEngine';

export type { GraphNode };

export interface GraphViewProps {
  notes: EnrichedNoteItem[];
  onOpenNote: (id: string) => void;
}

export interface GraphCustomGroup {
  id: string;
  property: string; // 'tag' | 'status' | 'type' | 'emotion' | 'title' | or custom property key (e.g. 'priority')
  value: string;
  color: string;
}

export interface GraphFilter {
  id: string;
  property: string;
  value: string;
}

export interface DisplaySettings {
  showArrows: boolean;
  textFadeThreshold: number; // -3.00 to 3.00, def: 0.00
  nodeSizeScale: number; // 0.10 to 5.00, def: 1.00
  linkThickness: number; // 0.10 to 5.00, def: 1.00
  showNodeLabels: boolean;
  hideOrphans: boolean;
  showSemanticLinks: boolean;
  filterMatchMode: 'all' | 'any';
}

export interface ForceSettings {
  centerForce: number; // 0.00 to 1.00, def: 0.52
  repelForce: number; // 0.00 to 20.00, def: 10.00
  linkForce: number; // 0.00 to 1.00, def: 1.00
  linkDistance: number; // 30 to 500, def: 250
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showArrows: false,
  textFadeThreshold: 0.0,
  nodeSizeScale: 1.0,
  linkThickness: 1.0,
  showNodeLabels: true,
  hideOrphans: false,
  showSemanticLinks: true,
  filterMatchMode: 'all',
};

export const DEFAULT_FORCE_SETTINGS: ForceSettings = {
  centerForce: 0.52,
  repelForce: 10.0,
  linkForce: 1.0,
  linkDistance: 250,
};

export const PRESET_COLORS = [
  '#4ade80', // Green
  '#60a5fa', // Blue
  '#fbbf24', // Yellow/Gold
  '#f87171', // Red
  '#c084fc', // Purple
  '#38bdf8', // Sky
  '#fb923c', // Orange
  '#f472b6', // Pink
  '#34d399', // Emerald
];
