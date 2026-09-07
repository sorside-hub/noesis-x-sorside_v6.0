import React from 'react';
import { twMerge } from 'tailwind-merge';
import { useDroppable } from '@dnd-kit/core';
import { CornerDownRight } from 'lucide-react';
import { FileNode } from '../../../types/vault';
import { FileTreeItem } from './FileTreeItem';

interface FileTreeProps {
  parentId?: string | null;
  depth?: number;
  getChildren: (parentId: string | null) => FileNode[];
  matchesSearch: (node: FileNode) => boolean;
  treeSearchQuery: string;
  expandedFolders: Record<string, boolean>;
  activeFileId: string | null;
  overFolderId?: string | null;
  activeDragNode?: FileNode | null;
  handleItemClick: (node: FileNode) => void;
  handleOpenMenu: (node: FileNode, e: React.MouseEvent) => void;
  onQuickCreateNoteInFolder?: (folderId: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  parentId = null,
  depth = 0,
  getChildren,
  matchesSearch,
  treeSearchQuery,
  expandedFolders,
  activeFileId,
  overFolderId,
  activeDragNode,
  handleItemClick,
  handleOpenMenu,
  onQuickCreateNoteInFolder,
}) => {
  const rawChildren = getChildren(parentId);
  const children = treeSearchQuery.trim() ? rawChildren.filter(matchesSearch) : rawChildren;

  // Droppable area for Root Vault (at depth 0)
  // Only active and visible when an item from inside a folder/subfolder is actively being dragged
  const isEligibleForRootDrop = depth === 0 && Boolean(activeDragNode && activeDragNode.parentId !== null);

  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: '__ROOT_DROP_ZONE__',
  });

  if (children.length === 0 && depth === 0) {
    return (
      <div 
        ref={setRootDropRef}
        className={twMerge(
          "px-4 py-8 text-center text-text-muted text-xs rounded-xl border border-dashed transition-all",
          isOverRoot || overFolderId === '__ROOT__' ? "border-accent-primary bg-accent-primary/10 text-text-primary" : "border-border-default/40"
        )}
      >
        {treeSearchQuery.trim() ? (
          <p>Tidak ada hasil untuk &quot;{treeSearchQuery}&quot;</p>
        ) : (
          <p>Vault masih kosong</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ul className={twMerge('space-y-0.5 select-none', depth > 0 && 'ml-3 pl-2.5 border-l border-border-default/70')}>
        {children.map((node) => {
          const isFolder = node.type === 'folder';
          const isExpanded = isFolder && (Boolean(treeSearchQuery.trim()) || Boolean(expandedFolders[node.id]));
          const isSelected = !isFolder && activeFileId === node.id;
          const subChildren = isFolder ? getChildren(node.id) : [];
          const subCount = subChildren.length;
          const isOverThisFolder = isFolder && overFolderId === node.id;

          return (
            <li key={node.id} className="select-none">
              <FileTreeItem
                node={node}
                isFolder={isFolder}
                isExpanded={isExpanded}
                isSelected={isSelected}
                subCount={subCount}
                isOverThisFolder={isOverThisFolder}
                handleItemClick={handleItemClick}
                handleOpenMenu={handleOpenMenu}
              />

              {/* Recursive Children */}
              {isFolder && isExpanded && (
                <FileTree
                  parentId={node.id}
                  depth={depth + 1}
                  getChildren={getChildren}
                  matchesSearch={matchesSearch}
                  treeSearchQuery={treeSearchQuery}
                  expandedFolders={expandedFolders}
                  activeFileId={activeFileId}
                  overFolderId={overFolderId}
                  activeDragNode={activeDragNode}
                  handleItemClick={handleItemClick}
                  handleOpenMenu={handleOpenMenu}
                  onQuickCreateNoteInFolder={onQuickCreateNoteInFolder}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Bottom Root Drop Zone (Shown ONLY when dragging an item currently in a subfolder) */}
      {isEligibleForRootDrop && (
        <div
          ref={setRootDropRef}
          className={twMerge(
            "mt-2.5 py-2.5 px-3 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-semibold select-none",
            isOverRoot || overFolderId === '__ROOT__'
              ? "bg-accent-primary/20 border-accent-primary text-accent-primary shadow-lg scale-[1.01]"
              : "border-accent-primary/40 bg-accent-primary/5 text-accent-primary/90 hover:border-accent-primary"
          )}
        >
          <CornerDownRight size={14} className={isOverRoot ? "animate-pulse" : ""} />
          <span>Lepas di sini untuk pindah ke Root Vault</span>
        </div>
      )}
    </div>
  );
};
