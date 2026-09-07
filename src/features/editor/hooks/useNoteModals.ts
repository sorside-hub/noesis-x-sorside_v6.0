import { useState, useRef } from 'react';
import { FileNode } from '../../../types/vault';

interface UseNoteModalsProps {
  activeNode: FileNode | null;
  nodes: Record<string, FileNode>;
  moveNode: (nodeId: string, targetParentId: string | null) => void;
  deleteNode: (nodeId: string) => void;
}

export const useNoteModals = ({
  activeNode,
  nodes,
  moveNode,
  deleteNode,
}: UseNoteModalsProps) => {
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [, setIsInputFocused] = useState(false);
  const folderSearchInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenMoveModal = () => {
    setFolderSearchQuery('');
    setIsMoveModalOpen(true);
    setTimeout(() => {
      folderSearchInputRef.current?.focus();
    }, 50);
  };

  const handleCloseMoveModal = () => {
    setIsMoveModalOpen(false);
  };

  const handleExecuteMove = (targetParentId: string | null) => {
    if (activeNode) {
      moveNode(activeNode.id, targetParentId);
    }
    setIsMoveModalOpen(false);
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (activeNode) {
      deleteNode(activeNode.id);
    }
    setIsDeleteModalOpen(false);
  };

  const getFolderPath = (folderId: string): string => {
    const parts: string[] = [];
    let currId: string | null = folderId;
    const visited = new Set<string>();

    while (currId && !visited.has(currId)) {
      visited.add(currId);
      const node = nodes[currId];
      if (node && node.type === 'folder') {
        parts.unshift(node.name);
        currId = node.parentId;
      } else {
        break;
      }
    }
    return parts.join(' / ');
  };

  const getAvailableFolders = (): { id: string; name: string; fullPath: string }[] => {
    const allNodes = Object.values(nodes) as FileNode[];
    const folders = allNodes.filter((n) => n.type === 'folder');

    const list = folders
      .map((f) => ({
        id: f.id,
        name: f.name,
        fullPath: getFolderPath(f.id),
      }))
      .sort((a, b) => a.fullPath.localeCompare(b.fullPath));

    if (!folderSearchQuery.trim()) {
      return list;
    }

    const query = folderSearchQuery.toLowerCase().trim();
    return list.filter((item) => item.fullPath.toLowerCase().includes(query));
  };

  return {
    isMoveModalOpen,
    isDeleteModalOpen,
    folderSearchQuery,
    setFolderSearchQuery,
    folderSearchInputRef,
    setIsInputFocused,
    handleOpenMoveModal,
    handleCloseMoveModal,
    handleExecuteMove,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    getAvailableFolders,
  };
};
