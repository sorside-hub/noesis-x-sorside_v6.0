export type PropertyType = 'text' | 'number' | 'date' | 'checkbox' | 'select';

export interface CustomProperty {
  id: string;
  key: string;
  type: PropertyType;
  value: any;
}

export interface BookmarkMeta {
  isBookmarked: boolean;
  title?: string;
  groupId?: string | null;
  bookmarkedAt?: number;
}

export interface NoteMetadata {
  noteType?: string;
  status?: string;
  tags?: string[];
  aliases?: string[];
  customProperties?: CustomProperty[];
  bookmark?: BookmarkMeta;
  [key: string]: unknown;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  metadata?: NoteMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  nodes: Record<string, FileNode>;
  openTabs: string[];
  activeTabId: string | null;
}
