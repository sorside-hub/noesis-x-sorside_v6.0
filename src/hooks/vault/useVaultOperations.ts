import { useCallback } from 'react';
import { VaultData, FileNode, NoteMetadata } from '../../types/vault';
import { saveNode, deleteNodes, saveOpenTabs, saveActiveTabId } from '../../lib/storage';
import { getUniqueNodeName } from '../../lib/vaultUtils';

interface UseVaultOperationsProps {
  setVault: React.Dispatch<React.SetStateAction<VaultData | null>>;
}

export const useVaultOperations = ({ setVault }: UseVaultOperationsProps) => {
  const createNote = useCallback(
    (parentId: string | null = null, name: string = 'Untitled', initialMetadata?: Partial<NoteMetadata>) => {
      const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      setVault((prev) => {
        if (!prev) return prev;

        const uniqueName = getUniqueNodeName(name, parentId, 'file', prev.nodes);
        const newNote: FileNode = {
          id,
          name: uniqueName,
          type: 'file',
          parentId,
          content: '',
          metadata: {
            ...initialMetadata,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveNode(newNote); // Async save

        // When creating a note, we replace the currently active Empty tab if it exists
        let newOpenTabs = [...prev.openTabs];
        if (prev.activeTabId && prev.activeTabId.startsWith('empty_')) {
          const idx = newOpenTabs.indexOf(prev.activeTabId);
          if (idx !== -1) {
            newOpenTabs[idx] = id;
          } else {
            newOpenTabs.push(id);
          }
        } else if (!newOpenTabs.includes(id)) {
          newOpenTabs.push(id);
        }

        saveOpenTabs(newOpenTabs);
        saveActiveTabId(id);

        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: newNote,
          },
          openTabs: newOpenTabs,
          activeTabId: id,
        };
      });

      return id;
    },
    [setVault]
  );

  const createFolder = useCallback(
    (parentId: string | null = null, name: string = 'New Folder') => {
      const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      setVault((prev) => {
        if (!prev) return prev;
        const uniqueName = getUniqueNodeName(name, parentId, 'folder', prev.nodes);

        const newFolder: FileNode = {
          id,
          name: uniqueName,
          type: 'folder',
          parentId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveNode(newFolder); // Async save
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: newFolder,
          },
        };
      });
      return id;
    },
    [setVault]
  );

  const updateNoteContent = useCallback(
    (id: string, content: string) => {
      setVault((prev) => {
        if (!prev) return prev;
        const node = prev.nodes[id];
        if (!node || node.type !== 'file' || node.content === content) return prev;

        const updatedNode = {
          ...node,
          content,
          updatedAt: Date.now(),
        };

        saveNode(updatedNode); // Async save

        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: updatedNode,
          },
        };
      });
    },
    [setVault]
  );

  const updateNodeTitle = useCallback(
    (id: string, name: string) => {
      setVault((prev) => {
        if (!prev) return prev;
        const node = prev.nodes[id];
        if (!node || node.name === name) return prev;

        const updatedNode = {
          ...node,
          name,
          updatedAt: Date.now(),
        };
        saveNode(updatedNode); // Async save
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: updatedNode,
          },
        };
      });
    },
    [setVault]
  );

  const moveNode = useCallback(
    (id: string, targetParentId: string | null) => {
      setVault((prev) => {
        if (!prev) return prev;
        const node = prev.nodes[id];
        if (!node) return prev;
        // Prevent moving a folder into itself or its own subchildren
        if (node.type === 'folder') {
          let curr = targetParentId;
          while (curr) {
            if (curr === id) {
              return prev; // Invalid circular move
            }
            curr = prev.nodes[curr]?.parentId || null;
          }
        }
        if (node.parentId === targetParentId) return prev;

        // Ensure unique name in target destination
        const uniqueName = getUniqueNodeName(node.name, targetParentId, node.type, prev.nodes, id);

        const updatedNode = {
          ...node,
          name: uniqueName,
          parentId: targetParentId,
          updatedAt: Date.now(),
        };
        saveNode(updatedNode); // Async save
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: updatedNode,
          },
        };
      });
    },
    [setVault]
  );

  const updateNoteMetadata = useCallback(
    (id: string, metadata: Partial<FileNode['metadata']>) => {
      setVault((prev) => {
        if (!prev) return prev;
        const node = prev.nodes[id];
        if (!node) return prev;

        const updatedNode: FileNode = {
          ...node,
          metadata: {
            ...(node.metadata || {}),
            ...metadata,
          },
          updatedAt: Date.now(),
        };
        saveNode(updatedNode); // Async save to IndexedDB & Supabase cloudSync
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: updatedNode,
          },
        };
      });
    },
    [setVault]
  );

  const setNodeBookmark = useCallback(
    (id: string, bookmark: FileNode['metadata'] extends undefined ? any : import('../../types/vault').BookmarkMeta | null) => {
      setVault((prev) => {
        if (!prev) return prev;
        const node = prev.nodes[id];
        if (!node) return prev;

        const currentMeta = node.metadata || {};
        const updatedMeta = { ...currentMeta };
        if (bookmark && bookmark.isBookmarked) {
          updatedMeta.bookmark = bookmark;
        } else {
          delete updatedMeta.bookmark;
        }

        const updatedNode: FileNode = {
          ...node,
          metadata: updatedMeta,
          updatedAt: Date.now(),
        };
        saveNode(updatedNode); // Async save to IndexedDB and push to Supabase
        return {
          ...prev,
          nodes: {
            ...prev.nodes,
            [id]: updatedNode,
          },
        };
      });
    },
    [setVault]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setVault((prev) => {
        if (!prev) return prev;
        const nextNodes = { ...prev.nodes };

        // Helper to recursively collect all child IDs if it's a folder
        const idsToDelete = [id];
        const collectChildren = (parentId: string) => {
          (Object.values(nextNodes) as FileNode[]).forEach((n) => {
            if (n.parentId === parentId) {
              idsToDelete.push(n.id);
              if (n.type === 'folder') {
                collectChildren(n.id);
              }
            }
          });
        };
        collectChildren(id);
        idsToDelete.forEach((nodeId) => {
          delete nextNodes[nodeId];
        });

        deleteNodes(idsToDelete); // Async bulk delete

        // Cleanup openTabs
        let newOpenTabs = prev.openTabs.filter((tabId) => !idsToDelete.includes(tabId));
        let nextActiveId = prev.activeTabId;

        if (idsToDelete.includes(prev.activeTabId || '')) {
          nextActiveId = newOpenTabs.length > 0 ? newOpenTabs[newOpenTabs.length - 1] : null;
        }

        if (newOpenTabs.length !== prev.openTabs.length) {
          saveOpenTabs(newOpenTabs);
        }
        if (nextActiveId !== prev.activeTabId) {
          saveActiveTabId(nextActiveId);
        }

        return {
          ...prev,
          nodes: nextNodes,
          openTabs: newOpenTabs,
          activeTabId: nextActiveId,
        };
      });
    },
    [setVault]
  );

  return {
    createNote,
    createFolder,
    updateNoteContent,
    updateNodeTitle,
    moveNode,
    updateNoteMetadata,
    setNodeBookmark,
    deleteNode,
  };
};
