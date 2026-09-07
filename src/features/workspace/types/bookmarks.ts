export interface BookmarkItem {
  id: string; // Unique bookmark ID
  nodeId: string; // Vault FileNode ID
  type: 'file' | 'folder';
  title?: string; // Optional custom display title
  groupId?: string | null; // ID of the bookmark group/folder, or null for root
  createdAt: number;
  order?: number;
}

export interface BookmarkGroup {
  id: string; // Unique group ID
  name: string; // Group display name (e.g. "Proyek Aktif", "Referensi")
  createdAt: number;
  order?: number;
}

export interface BookmarksState {
  bookmarks: BookmarkItem[];
  groups: BookmarkGroup[];
}
