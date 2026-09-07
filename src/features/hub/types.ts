import { FileNode } from '../../types/vault';

export type HubSubView = 'table' | 'board' | 'concepts' | 'graph';

export interface HubFilterState {
  searchQuery: string;
  selectedType: string | null;
  selectedStatus: string | null;
  selectedTag: string | null;
  selectedConcept: string | null;
  selectedEmotion: string | null;
}

export interface EnrichedNoteItem {
  id: string;
  node: FileNode;
  title: string;
  type: string;
  status: string;
  tags: string[];
  aliases: string[];
  summary?: string;
  keywords?: string[];
  concepts?: string[];
  emotion?: string;
  properties: Record<string, any>;
  customProperties?: Record<string, any>;
  updatedAt: number;
  createdAt: number;
}
