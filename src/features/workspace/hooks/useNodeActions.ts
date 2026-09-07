import React, { useState, useRef, useEffect } from 'react';
import { VaultData, FileNode } from '../../../types/vault';
import { isNodeNameDuplicate } from '../../../lib/vaultUtils';
import { useNavigation } from '../../../context/NavigationContext';

interface UseNodeActionsOptions {
  vault: VaultData;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onCreateNote: (parentId?: string | null) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onRenameNode: (id: string, newName: string) => void;
  onMoveNode: (id: string, targetParentId: string | null) => void;
  onDeleteNode: (id: string) => void;
}

export function useNodeActions({
  vault,
  setExpandedFolders,
  onCreateNote,
  onCreateFolder,
  onRenameNode,
  onMoveNode,
  onDeleteNode,
}: UseNodeActionsOptions) {
  const { activeModal, openModal, closeModal } = useNavigation();

  // Context Menu / Action Popup State
  const [activeMenuNode, setActiveMenuNode] = useState<FileNode | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Rename Dialog Modal State
  const [renamingNode, setRenamingNode] = useState<FileNode | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Move Modal State & Search Query
  const [movingNode, setMovingNode] = useState<FileNode | null>(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState<string>('');
  const folderSearchInputRef = useRef<HTMLInputElement>(null);

  // Delete Dialog Modal State
  const [nodeToDelete, setNodeToDelete] = useState<FileNode | null>(null);

  // Focus state for inputs
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  // Touch long press state
  const touchTimerRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; startX: number; startY: number }>({
    timer: null,
    startX: 0,
    startY: 0,
  });

  // Synchronize modal closures from back button popstate
  useEffect(() => {
    if (!activeModal) {
      setActiveMenuNode(null);
      setRenamingNode(null);
      setMovingNode(null);
      setNodeToDelete(null);
    }
  }, [activeModal]);

  // Focus rename input when modal opens
  useEffect(() => {
    if (renamingNode && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNode]);

  // Focus search input and reset query when move modal opens
  useEffect(() => {
    if (movingNode) {
      setFolderSearchQuery('');
      setTimeout(() => {
        folderSearchInputRef.current?.focus();
      }, 50);
    }
  }, [movingNode]);

  const openActionPopup = (node: FileNode, targetRect: DOMRect) => {
    const menuWidth = 192;
    const menuHeight = 250;
    
    // Align menu to the right of the button
    let posX = targetRect.right - menuWidth;
    if (posX < 8) posX = 8;
    if (posX + menuWidth > window.innerWidth - 8) {
      posX = window.innerWidth - menuWidth - 8;
    }

    let posY = targetRect.bottom + 4;
    if (posY + menuHeight > window.innerHeight - 8) {
      posY = Math.max(8, targetRect.top - menuHeight - 4);
    }

    setMenuPosition({ x: posX, y: posY });
    setActiveMenuNode(node);
  };

  const handleOpenMenu = (node: FileNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openActionPopup(node, rect);
  };

  const closeActiveDialog = () => {
    setActiveMenuNode(null);
    setRenamingNode(null);
    setMovingNode(null);
    setNodeToDelete(null);
    setIsInputFocused(false);
    closeModal();
  };

  const handleStartRename = (node: FileNode) => {
    setActiveMenuNode(null);
    setRenamingNode(node);
    setRenameValue(node.name);
    openModal('rename');
  };

  const isRenameDuplicate = renamingNode
    ? isNodeNameDuplicate(renameValue, renamingNode.parentId, renamingNode.type, vault.nodes, renamingNode.id)
    : false;

  const handleSaveRename = () => {
    if (renamingNode && renameValue.trim() && !isRenameDuplicate) {
      onRenameNode(renamingNode.id, renameValue.trim());
      closeActiveDialog();
    }
  };

  const handleStartMove = (node: FileNode) => {
    setActiveMenuNode(null);
    setMovingNode(node);
    openModal('move');
  };

  const handleExecuteMove = (targetParentId: string | null) => {
    if (movingNode) {
      onMoveNode(movingNode.id, targetParentId);
    }
    closeActiveDialog();
  };

  const handleDelete = (node: FileNode) => {
    setActiveMenuNode(null);
    setNodeToDelete(node);
    openModal('delete');
  };

  const confirmDelete = () => {
    if (nodeToDelete) {
      onDeleteNode(nodeToDelete.id);
    }
    closeActiveDialog();
  };

  const handleCreateNoteInFolder = (node: FileNode) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [node.id]: true,
    }));
    setActiveMenuNode(null);
    onCreateNote(node.id);
  };

  const handleCreateSubfolderInFolder = (node: FileNode) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [node.id]: true,
    }));
    closeActiveDialog();
    onCreateFolder(node.id);
  };

  const getFolderPath = (folderId: string): string => {
    const parts: string[] = [];
    let currId: string | null = folderId;
    const visited = new Set<string>();

    while (currId && !visited.has(currId)) {
      visited.add(currId);
      const node = vault.nodes[currId];
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
    const allNodes = Object.values(vault.nodes) as FileNode[];
    const folders = allNodes.filter((n) => n.type === 'folder');

    let validFolders = folders;

    if (movingNode && movingNode.type === 'folder') {
      const invalidIds = new Set<string>([movingNode.id]);
      const findDescendants = (parentId: string) => {
        folders.forEach((f) => {
          if (f.parentId === parentId) {
            invalidIds.add(f.id);
            findDescendants(f.id);
          }
        });
      };
      findDescendants(movingNode.id);
      validFolders = folders.filter((f) => !invalidIds.has(f.id));
    }

    const list = validFolders
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
    activeMenuNode,
    menuPosition,
    renamingNode,
    renameValue,
    setRenameValue,
    renameInputRef,
    movingNode,
    folderSearchQuery,
    setFolderSearchQuery,
    folderSearchInputRef,
    nodeToDelete,
    isInputFocused,
    setIsInputFocused,
    handleOpenMenu,
    closeActiveDialog,
    handleStartRename,
    isRenameDuplicate,
    handleSaveRename,
    handleStartMove,
    handleExecuteMove,
    handleDelete,
    confirmDelete,
    handleCreateNoteInFolder,
    handleCreateSubfolderInFolder,
    getAvailableFolders,
  };
}
