import React, { useState, useEffect } from 'react';
import { VaultData, FileNode } from '../../../types/vault';

interface UseFolderTreeOptions {
  vault: VaultData;
  activeFileId: string | null;
}

export function useFolderTree({ vault, activeFileId }: UseFolderTreeOptions) {
  // Folders are collapsed by default ({}) unless explicitly expanded
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Auto-expand ancestor folders of the active note
  useEffect(() => {
    if (!activeFileId) return;
    let currNode = vault.nodes[activeFileId];
    const toExpand: Record<string, boolean> = {};
    while (currNode && currNode.parentId) {
      toExpand[currNode.parentId] = true;
      currNode = vault.nodes[currNode.parentId];
    }
    if (Object.keys(toExpand).length > 0) {
      setExpandedFolders((prev) => ({ ...prev, ...toExpand }));
    }
  }, [activeFileId, vault.nodes]);

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const allFolderNodes = (Object.values(vault.nodes) as FileNode[]).filter((n) => n.type === 'folder');
  const areAllFoldersExpanded = allFolderNodes.length > 0 && allFolderNodes.every((f) => !!expandedFolders[f.id]);
  const areAllFoldersCollapsed = allFolderNodes.length === 0 || allFolderNodes.every((f) => !expandedFolders[f.id]);

  const handleToggleExpandCollapseAll = () => {
    if (areAllFoldersExpanded) {
      // Collapse all
      setExpandedFolders({});
    } else {
      // Expand all
      const newExpanded: Record<string, boolean> = {};
      allFolderNodes.forEach((f) => {
        newExpanded[f.id] = true;
      });
      setExpandedFolders(newExpanded);
    }
  };

  const getChildrenCount = (folderId: string) => {
    const directChildren = (Object.values(vault.nodes) as FileNode[]).filter((n) => n.parentId === folderId);
    const notesCount = directChildren.filter((n) => n.type === 'file').length;
    const foldersCount = directChildren.filter((n) => n.type === 'folder').length;
    return { notes: notesCount, folders: foldersCount, total: directChildren.length };
  };

  const getChildren = (parentId: string | null): FileNode[] => {
    const allNodes = Object.values(vault.nodes) as FileNode[];
    return allNodes
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  };

  return {
    expandedFolders,
    setExpandedFolders,
    toggleFolder,
    areAllFoldersExpanded,
    areAllFoldersCollapsed,
    handleToggleExpandCollapseAll,
    getChildrenCount,
    getChildren,
  };
}
