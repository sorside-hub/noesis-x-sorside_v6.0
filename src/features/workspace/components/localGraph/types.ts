import { FileNode } from '../../../../types/vault';

export type LocalGraphDepth = 1 | 2 | 3;

export type LocalLinkType = 'wikilink-out' | 'wikilink-in' | 'tag' | 'ai-related' | 'semantic';

export interface LocalGraphNode {
  id: string;
  name: string;
  type: string;
  isCenter: boolean;
  distance: number; // 0 = active note, 1 = direct neighbor, 2 = 2-hop, 3 = 3-hop
  val: number;
  color?: string;
  tags?: string[];
  x?: number;
  y?: number;
}

export interface LocalGraphLink {
  source: string | LocalGraphNode;
  target: string | LocalGraphNode;
  type: LocalLinkType;
  label?: string;
}

export interface LocalGraphFilterOptions {
  depth: LocalGraphDepth;
  showOutgoing: boolean;
  showBacklinks: boolean;
  showTags: boolean;
  showSemantic?: boolean;
}

export interface LocalGraphStats {
  totalNodes: number;
  directNeighbors: number;
  wikilinkCount: number;
  tagLinkCount: number;
  semanticCount?: number;
}
