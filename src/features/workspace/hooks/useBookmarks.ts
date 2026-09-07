import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BookmarkItem, BookmarkGroup, BookmarksState } from '../types/bookmarks';
import { VaultData, FileNode, BookmarkMeta } from '../../../types/vault';
import { db } from '../../../lib/db';
import { pushBookmarkGroupsToCloud } from '../../../lib/cloudSync';

const STORAGE_KEY_GROUPS = 'noesis_vault_bookmark_groups';

interface UseBookmarksProps {
  vault: VaultData | null;
  setNodeBookmark?: (nodeId: string, bookmark: BookmarkMeta | null) => void;
}

export function useBookmarks(
  vault: VaultData | null,
  setNodeBookmark?: (nodeId: string, bookmark: BookmarkMeta | null) => void
) {
  const isInitializedRef = useRef(false);
  const isRemoteUpdateRef = useRef(false);

  // Bookmark Groups state
  const [groups, setGroups] = useState<BookmarkGroup[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          isInitializedRef.current = true;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[useBookmarks] Error loading bookmark groups from localStorage:', e);
    }
    return [];
  });

  const groupsRef = useRef<BookmarkGroup[]>(groups);
  groupsRef.current = groups;

  // Load groups from IndexedDB settings on mount and listen to cross-device / sync events
  useEffect(() => {
    let isMounted = true;

    db.settings
      .get('bookmarkGroups')
      .then((setting) => {
        if (!isMounted) return;
        if (setting?.value) {
          try {
            const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
            if (Array.isArray(parsed)) {
              if (JSON.stringify(groupsRef.current) !== JSON.stringify(parsed)) {
                isRemoteUpdateRef.current = true;
                setGroups(parsed);
              }
              localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn('[useBookmarks] Error parsing bookmarkGroups from DB:', e);
          }
        }
        isInitializedRef.current = true;
      })
      .catch((e) => {
        console.warn('[useBookmarks] Failed to load bookmarkGroups from IndexedDB:', e);
        if (isMounted) isInitializedRef.current = true;
      });

    // Handle remote realtime sync updates or full pull sync updates
    const handleGroupsUpdated = (e: any) => {
      const incoming = e.detail;
      if (incoming && Array.isArray(incoming)) {
        if (JSON.stringify(groupsRef.current) === JSON.stringify(incoming)) {
          return;
        }
        // Mark as remote or external update so useEffect doesn't re-push to cloud
        isRemoteUpdateRef.current = true;
        setGroups(incoming);
      } else {
        db.settings.get('bookmarkGroups').then((setting) => {
          if (!isMounted || !setting?.value) return;
          try {
            const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
            if (Array.isArray(parsed) && JSON.stringify(groupsRef.current) !== JSON.stringify(parsed)) {
              isRemoteUpdateRef.current = true;
              setGroups(parsed);
            }
          } catch (err) {
            console.warn('[useBookmarks] Error parsing groups on update:', err);
          }
        });
      }
    };

    window.addEventListener('bookmark-groups-updated', handleGroupsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('bookmark-groups-updated', handleGroupsUpdated);
    };
  }, []);

  // Save groups to IndexedDB, localStorage, and Supabase Cloud when changed
  useEffect(() => {
    // Guard against cold-start wipe: Do not push empty groups before storage is read
    if (!isInitializedRef.current) {
      const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (!raw && groups.length === 0) {
        return;
      }
      isInitializedRef.current = true;
    }

    // If update came from remote realtime sync or another component's local event,
    // do not re-push to cloud (avoids infinite echo loop)
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    try {
      const groupsJson = JSON.stringify(groups);
      localStorage.setItem(STORAGE_KEY_GROUPS, groupsJson);
      db.settings
        .put({ key: 'bookmarkGroups', value: groupsJson })
        .catch((err) => console.warn('[useBookmarks] Error saving groups to IndexedDB:', err));
      
      // Auto-sync bookmark groups to Supabase Cloud
      pushBookmarkGroupsToCloud(groups).catch((err) =>
        console.warn('[useBookmarks] Error pushing groups to Supabase:', err)
      );
    } catch (e) {
      console.warn('[useBookmarks] Error saving bookmark groups:', e);
    }
  }, [groups]);

  // Helper to notify other component instances (e.g. LeftSidebar <-> NoteEditor) of group updates
  const notifyGroupChange = useCallback((updatedGroups: BookmarkGroup[]) => {
    try {
      const groupsJson = JSON.stringify(updatedGroups);
      localStorage.setItem(STORAGE_KEY_GROUPS, groupsJson);
      db.settings
        .put({ key: 'bookmarkGroups', value: groupsJson })
        .catch((err) => console.warn('[useBookmarks] Error saving groups to IndexedDB:', err));
      window.dispatchEvent(
        new CustomEvent('bookmark-groups-updated', { detail: updatedGroups })
      );
    } catch (e) {
      console.warn('[useBookmarks] Error notifying group changes:', e);
    }
  }, []);

  // Modal State for Obsidian-Style Bookmark Dialog
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [modalTargetNode, setModalTargetNode] = useState<FileNode | null>(null);

  // Derive bookmarks list reactively from vault.nodes (100% real-time from vault state & IndexedDB/Supabase metadata)
  const bookmarks = useMemo<BookmarkItem[]>(() => {
    if (!vault || !vault.nodes) return [];

    const result: BookmarkItem[] = [];
    Object.values(vault.nodes).forEach((node) => {
      const bm = node.metadata?.bookmark;
      if (bm && bm.isBookmarked) {
        result.push({
          id: `bm_${node.id}`,
          nodeId: node.id,
          type: node.type,
          title: bm.title || node.name,
          groupId: bm.groupId || null,
          createdAt: bm.bookmarkedAt || node.updatedAt || Date.now(),
        });
      }
    });

    // Sort by creation time
    return result.sort((a, b) => a.createdAt - b.createdAt);
  }, [vault]);

  // Check if a node is bookmarked
  const isBookmarked = useCallback(
    (nodeId: string): boolean => {
      if (!vault || !vault.nodes[nodeId]) return false;
      return !!vault.nodes[nodeId].metadata?.bookmark?.isBookmarked;
    },
    [vault]
  );

  // Get bookmark metadata for a node
  const getBookmarkMeta = useCallback(
    (nodeId: string): BookmarkMeta | undefined => {
      if (!vault || !vault.nodes[nodeId]) return undefined;
      return vault.nodes[nodeId].metadata?.bookmark;
    },
    [vault]
  );

  // Open Bookmark Modal for a specific node (Obsidian Style)
  const openBookmarkModal = useCallback(
    (nodeId: string) => {
      if (!vault || !vault.nodes[nodeId]) return;
      setModalTargetNode(vault.nodes[nodeId]);
      setIsBookmarkModalOpen(true);
    },
    [vault]
  );

  // Close Bookmark Modal
  const closeBookmarkModal = useCallback(() => {
    setIsBookmarkModalOpen(false);
    setModalTargetNode(null);
  }, []);

  // Save Bookmark (Sets metadata, writes to IndexedDB and pushes to Supabase)
  const saveBookmark = useCallback(
    (nodeId: string, customTitle?: string, targetGroupId?: string | null) => {
      if (!vault || !vault.nodes[nodeId]) return;
      const targetNode = vault.nodes[nodeId];

      const bookmarkPayload: BookmarkMeta = {
        isBookmarked: true,
        title: customTitle?.trim() || targetNode.name,
        groupId: targetGroupId || null,
        bookmarkedAt: targetNode.metadata?.bookmark?.bookmarkedAt || Date.now(),
      };

      if (setNodeBookmark) {
        setNodeBookmark(nodeId, bookmarkPayload);
      }
    },
    [vault, setNodeBookmark]
  );

  // Remove Bookmark (Removes metadata, updates IndexedDB and Supabase)
  const removeBookmark = useCallback(
    (nodeIdOrBookmarkId: string) => {
      if (!vault) return;
      // Handle either bookmark id (`bm_xxx`) or direct node id
      const nodeId = nodeIdOrBookmarkId.startsWith('bm_')
        ? nodeIdOrBookmarkId.replace(/^bm_/, '')
        : nodeIdOrBookmarkId;

      if (setNodeBookmark) {
        setNodeBookmark(nodeId, null);
      }
    },
    [vault, setNodeBookmark]
  );

  // Toggle bookmark directly or open modal
  const toggleBookmark = useCallback(
    (nodeId: string) => {
      openBookmarkModal(nodeId);
    },
    [openBookmarkModal]
  );

  // Update bookmark title or move to group
  const updateBookmark = useCallback(
    (bookmarkId: string, updates: Partial<Pick<BookmarkItem, 'title' | 'groupId'>>) => {
      const nodeId = bookmarkId.startsWith('bm_') ? bookmarkId.replace(/^bm_/, '') : bookmarkId;
      if (!vault || !vault.nodes[nodeId]) return;

      const node = vault.nodes[nodeId];
      const current = node.metadata?.bookmark;
      if (!current) return;

      const updatedPayload: BookmarkMeta = {
        ...current,
        title: updates.title !== undefined ? updates.title : current.title,
        groupId: updates.groupId !== undefined ? updates.groupId : current.groupId,
      };

      if (setNodeBookmark) {
        setNodeBookmark(nodeId, updatedPayload);
      }
    },
    [vault, setNodeBookmark]
  );

  // Create new Bookmark Group
  const createGroup = useCallback((name: string): string | undefined => {
    const trimmed = name.trim();
    if (!trimmed) return undefined;
    const newGroup: BookmarkGroup = {
      id: `bmg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: trimmed,
      createdAt: Date.now(),
      order: groups.length,
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    notifyGroupChange(updated);
    return newGroup.id;
  }, [groups, notifyGroupChange]);

  // Rename Bookmark Group
  const renameGroup = useCallback((groupId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = groups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g));
    setGroups(updated);
    notifyGroupChange(updated);
  }, [groups, notifyGroupChange]);

  // Delete Bookmark Group (moves bookmarks in that group to root)
  const deleteGroup = useCallback(
    (groupId: string) => {
      const updated = groups.filter((g) => g.id !== groupId);
      setGroups(updated);
      notifyGroupChange(updated);

      // Update any bookmarked node in this group to have groupId: null
      if (vault && setNodeBookmark) {
        Object.values(vault.nodes).forEach((node) => {
          if (node.metadata?.bookmark?.groupId === groupId) {
            setNodeBookmark(node.id, {
              ...node.metadata.bookmark,
              groupId: null,
            });
          }
        });
      }
    },
    [groups, notifyGroupChange, vault, setNodeBookmark]
  );

  return {
    bookmarks,
    groups,
    isBookmarked,
    getBookmarkMeta,
    openBookmarkModal,
    closeBookmarkModal,
    isBookmarkModalOpen,
    modalTargetNode,
    saveBookmark,
    toggleBookmark,
    removeBookmark,
    updateBookmark,
    createGroup,
    renameGroup,
    deleteGroup,
    totalBookmarksCount: bookmarks.length,
  };
}
