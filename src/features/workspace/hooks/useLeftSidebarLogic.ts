import { useState, useMemo, useEffect } from 'react';
import { VaultData, FileNode } from '../../../types/vault';
import { useVirtualKeyboard } from '../../../hooks/useVirtualKeyboard';
import { useFolderTree } from './useFolderTree';
import { useTreeSearch } from './useTreeSearch';
import { useNodeActions } from './useNodeActions';
import { useTreeDnd } from './useTreeDnd';
import { extractAllTagsFromVault } from '../utils/tagUtils';
import { useBookmarks } from './useBookmarks';

export type SidebarTabMode = 'files' | 'tags' | 'bookmarks';

interface UseLeftSidebarLogicProps {
  vault: VaultData;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onOpenInNewTab: (id: string) => void;
  onCreateNote: (parentId?: string | null) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onRenameNode: (id: string, newName: string) => void;
  onMoveNode: (id: string, targetParentId: string | null) => void;
  onDeleteNode: (id: string) => void;
  setNodeBookmark?: (nodeId: string, bookmark: import('../../../types/vault').BookmarkMeta | null) => void;
  onCloseMobile: () => void;
}

export function useLeftSidebarLogic({
  vault,
  activeFileId,
  onSelectFile,
  onCreateNote,
  onCreateFolder,
  onRenameNode,
  onMoveNode,
  onDeleteNode,
  setNodeBookmark,
  onCloseMobile,
}: UseLeftSidebarLogicProps) {
  const { isKeyboardOpen } = useVirtualKeyboard();

  // Active tab: 'files' | 'tags' | 'bookmarks'
  const [activeTab, setActiveTab] = useState<SidebarTabMode>('files');

  // Switch to tags tab if a tag navigation event is received
  useEffect(() => {
    const handleOpenTag = (e: any) => {
      if (e.detail?.tag) {
        setActiveTab('tags');
      }
    };
    window.addEventListener('open-tag-in-sidebar', handleOpenTag);
    return () => window.removeEventListener('open-tag-in-sidebar', handleOpenTag);
  }, []);

  // 1. Folder Tree Hierarchy & Expand/Collapse
  const folderTree = useFolderTree({
    vault,
    activeFileId,
  });

  // 2. Tree Search & Filtering
  const treeSearch = useTreeSearch({
    getChildren: folderTree.getChildren,
  });

  // 3. Node Action Modals (Context Menu, Rename, Move, Delete)
  const nodeActions = useNodeActions({
    vault,
    setExpandedFolders: folderTree.setExpandedFolders,
    onCreateNote,
    onCreateFolder,
    onRenameNode,
    onMoveNode,
    onDeleteNode,
  });

  // 4. Drag and Drop Tree Operations
  const treeDnd = useTreeDnd({
    vault,
    onMoveNode,
    setExpandedFolders: folderTree.setExpandedFolders,
  });

  // 5. Extract Tags for Tag Explorer
  const tagData = useMemo(() => {
    return extractAllTagsFromVault(vault);
  }, [vault]);

  // 6. Bookmarks Hook
  const bookmarksData = useBookmarks(vault, setNodeBookmark);

  // Navigation click
  const handleItemClick = (node: FileNode) => {
    if (node.type === 'folder') {
      folderTree.toggleFolder(node.id);
    } else {
      onSelectFile(node.id);
      onCloseMobile();
    }
  };

  const isPillHidden = isKeyboardOpen || !!nodeActions.renamingNode || !!nodeActions.movingNode || !!treeDnd.activeDragNode;

  return {
    activeTab,
    setActiveTab,
    tagData,
    bookmarksData,
    ...folderTree,
    ...treeSearch,
    ...nodeActions,
    ...treeDnd,
    handleItemClick,
    isPillHidden,
  };
}
