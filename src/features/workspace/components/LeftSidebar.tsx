import React, { useState } from 'react';
import { X, Search, FileText, Folder, Hash, FolderTree, Bookmark, Star } from 'lucide-react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { twMerge } from 'tailwind-merge';
import { VaultData } from '../../../types/vault';
import { useLeftSidebarLogic } from '../hooks/useLeftSidebarLogic';
import { treeCollisionDetection } from '../hooks/useTreeDnd';
import { LeftSidebarContextMenu } from './LeftSidebarContextMenu';
import { DeleteNodeModal } from './DeleteNodeModal';
import { MoveNodeModal } from './MoveNodeModal';
import { RenameNodeModal } from './RenameNodeModal';
import { FileTree } from './FileTree';
import { TagExplorer } from './TagExplorer';
import { BookmarksExplorer } from './BookmarksExplorer';
import { FloatingActionPill } from './FloatingActionPill';
import { BookmarkModal } from './BookmarkModal';
import { ExportNoteModal } from '../../../components/modals/ExportNoteModal';
import { FileNode } from '../../../types/vault';

interface LeftSidebarProps {
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
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  vault,
  activeFileId,
  onSelectFile,
  onOpenInNewTab,
  onCreateNote,
  onCreateFolder,
  onRenameNode,
  onMoveNode,
  onDeleteNode,
  setNodeBookmark,
  isOpen: _isOpen,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    tagData,
    bookmarksData,
    expandedFolders,
    isTreeSearchOpen,
    setIsTreeSearchOpen,
    treeSearchQuery,
    setTreeSearchQuery,
    treeSearchInputRef,
    searchContainerRef,
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
    areAllFoldersExpanded: _areAllFoldersExpanded,
    areAllFoldersCollapsed,
    handleToggleExpandCollapseAll,
    getChildren,
    handleOpenMenu,
    closeActiveDialog,
    handleItemClick,
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
    matchesSearch,
    isPillHidden,
    sensors,
    activeDragNode,
    overFolderId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useLeftSidebarLogic({
    vault,
    activeFileId,
    onSelectFile,
    onOpenInNewTab,
    onCreateNote,
    onCreateFolder,
    onRenameNode,
    onMoveNode,
    onDeleteNode,
    setNodeBookmark,
    onCloseMobile,
  });

  const [isCreatingBookmarkGroup, setIsCreatingBookmarkGroup] = useState(false);
  const [exportingNode, setExportingNode] = useState<FileNode | null>(null);

  return (
    <div className="h-full w-full flex flex-col bg-bg-surface border-r border-border-default overflow-hidden select-none relative">
      {/* ----------------------------------------------------------- */}
      {/* TOP TAB SWITCHER: FILES vs TAGS vs BOOKMARKS (Obsidian Style) */}
      {/* ----------------------------------------------------------- */}
      <div className="px-2.5 pt-2.5 pb-1.5 flex items-center justify-between border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-0.5 bg-bg-primary p-0.5 rounded-lg border border-border-default w-full">
          {/* 1. Files Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={twMerge(
              'flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer border',
              activeTab === 'files'
                ? 'bg-bg-surface text-text-primary shadow-xs border-border-subtle/50'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            )}
          >
            <FolderTree size={13} className={activeTab === 'files' ? 'text-accent-primary' : 'opacity-70'} />
            <span className="truncate">Files</span>
          </button>

          {/* 2. Tags Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={twMerge(
              'flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer border',
              activeTab === 'tags'
                ? 'bg-bg-surface text-text-primary shadow-xs border-border-subtle/50'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            )}
          >
            <Hash size={13} className={activeTab === 'tags' ? 'text-accent-primary' : 'opacity-70'} />
            <span className="truncate">Tags</span>
            {tagData.totalUniqueTags > 0 && (
              <span className={twMerge(
                'ml-0.5 px-1 py-0.2 text-[9.5px] rounded-full tabular-nums',
                activeTab === 'tags' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-hover text-text-muted'
              )}>
                {tagData.totalUniqueTags}
              </span>
            )}
          </button>

          {/* 3. Bookmarks Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={twMerge(
              'flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer border',
              activeTab === 'bookmarks'
                ? 'bg-bg-surface text-text-primary shadow-xs border-border-subtle/50'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            )}
          >
            <Bookmark size={13} className={activeTab === 'bookmarks' ? 'text-accent-primary fill-accent-primary/30' : 'opacity-70'} />
            <span className="truncate">Bookmarks</span>
            {bookmarksData.totalBookmarksCount > 0 && (
              <span className={twMerge(
                'ml-0.5 px-1 py-0.2 text-[9.5px] rounded-full tabular-nums',
                activeTab === 'bookmarks' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-hover text-text-muted'
              )}>
                {bookmarksData.totalBookmarksCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* SHARED SEARCH BAR (Context-aware: Files, Tags, Bookmarks) */}
      {/* ----------------------------------------------------------- */}
      {isTreeSearchOpen && (
        <div ref={searchContainerRef} className="px-2.5 pt-2 pb-1.5 border-b border-border-subtle bg-bg-surface/90 shadow-xs z-10">
          <div className="relative">
            <Search
              size={13}
              className={twMerge(
                "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
                treeSearchQuery || isInputFocused ? "text-accent-primary" : "text-text-muted"
              )}
            />
            <input
              ref={treeSearchInputRef}
              type="text"
              value={treeSearchQuery}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChange={(e) => setTreeSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsTreeSearchOpen(false);
                  setTreeSearchQuery('');
                  setIsInputFocused(false);
                }
              }}
              placeholder={
                activeTab === 'bookmarks'
                  ? "Cari bookmark..."
                  : activeTab === 'tags'
                  ? "Cari tag / catatan..."
                  : "Cari file & folder..."
              }
              className="w-full pl-7 pr-6 py-1.5 bg-bg-primary border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/40 focus:border-accent-primary/60 transition-colors"
            />
            <button
              type="button"
              title="Close search"
              onClick={() => {
                setIsTreeSearchOpen(false);
                setTreeSearchQuery('');
                setIsInputFocused(false);
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* CONTENT AREA: FILE TREE OR TAG EXPLORER OR BOOKMARKS */}
      {/* ----------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-2 pb-16 space-y-0.5 custom-scrollbar">
        {activeTab === 'files' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={treeCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <FileTree
              getChildren={getChildren}
              matchesSearch={matchesSearch}
              treeSearchQuery={treeSearchQuery}
              expandedFolders={expandedFolders}
              activeFileId={activeFileId}
              overFolderId={overFolderId}
              activeDragNode={activeDragNode}
              handleItemClick={handleItemClick}
              handleOpenMenu={handleOpenMenu}
              onQuickCreateNoteInFolder={(folderId) => onCreateNote(folderId)}
            />

            <DragOverlay>
              {activeDragNode ? (
                <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-bg-primary border-2 border-accent-primary text-text-primary text-xs font-semibold shadow-2xl scale-105 opacity-95 pointer-events-none">
                  {activeDragNode.type === 'folder' ? (
                    <Folder size={14} className="text-accent-primary" />
                  ) : (
                    <FileText size={14} className="text-accent-primary" />
                  )}
                  <span className="truncate max-w-[160px]">{activeDragNode.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : activeTab === 'tags' ? (
          <TagExplorer
            flatTags={tagData.flatTags}
            tagTree={tagData.tagTree}
            searchQuery={treeSearchQuery}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCloseMobile={onCloseMobile}
          />
        ) : (
          <BookmarksExplorer
            vault={vault}
            bookmarks={bookmarksData.bookmarks}
            groups={bookmarksData.groups}
            searchQuery={treeSearchQuery}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCloseMobile={onCloseMobile}
            onRemoveBookmark={bookmarksData.removeBookmark}
            onOpenBookmarkModal={bookmarksData.openBookmarkModal}
            onUpdateBookmark={bookmarksData.updateBookmark}
            onCreateGroup={bookmarksData.createGroup}
            onRenameGroup={bookmarksData.renameGroup}
            onDeleteGroup={bookmarksData.deleteGroup}
            isCreatingGroupExternal={isCreatingBookmarkGroup}
            setIsCreatingGroupExternal={setIsCreatingBookmarkGroup}
          />
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* FLOATING ACTION PILL */}
      {/* ----------------------------------------------------------- */}
      <FloatingActionPill
        activeTab={activeTab}
        isPillHidden={isPillHidden}
        onCreateNote={onCreateNote}
        onCreateFolder={onCreateFolder}
        onCreateBookmarkGroup={() => {
          setIsCreatingBookmarkGroup(true);
        }}
        onCloseMobile={onCloseMobile}
        isTreeSearchOpen={isTreeSearchOpen}
        setIsTreeSearchOpen={setIsTreeSearchOpen}
        areAllFoldersCollapsed={areAllFoldersCollapsed}
        handleToggleExpandCollapseAll={handleToggleExpandCollapseAll}
      />

      {/* ----------------------------------------------------------- */}
      {/* CONTEXT MENU POPUP */}
      {/* ----------------------------------------------------------- */}
      <LeftSidebarContextMenu
        activeMenuNode={activeMenuNode}
        menuPosition={menuPosition}
        isBookmarked={activeMenuNode ? bookmarksData.isBookmarked(activeMenuNode.id) : false}
        onToggleBookmark={bookmarksData.openBookmarkModal}
        closeActiveDialog={closeActiveDialog}
        handleCreateNoteInFolder={handleCreateNoteInFolder}
        handleCreateSubfolderInFolder={handleCreateSubfolderInFolder}
        onOpenInNewTab={onOpenInNewTab}
        onCloseMobile={onCloseMobile}
        handleStartRename={handleStartRename}
        handleStartMove={handleStartMove}
        handleExportNote={(node) => setExportingNode(node)}
        handleDelete={handleDelete}
      />

      {/* ----------------------------------------------------------- */}
      {/* BOOKMARK MODAL (OBSIDIAN STYLE) */}
      {/* ----------------------------------------------------------- */}
      <BookmarkModal
        isOpen={bookmarksData.isBookmarkModalOpen}
        onClose={bookmarksData.closeBookmarkModal}
        targetNode={bookmarksData.modalTargetNode}
        vault={vault}
        groups={bookmarksData.groups}
        isBookmarked={
          bookmarksData.modalTargetNode
            ? bookmarksData.isBookmarked(bookmarksData.modalTargetNode.id)
            : false
        }
        onSaveBookmark={bookmarksData.saveBookmark}
        onRemoveBookmark={bookmarksData.removeBookmark}
        onCreateGroup={bookmarksData.createGroup}
      />

      {/* ----------------------------------------------------------- */}
      {/* RENAME NODE MODAL */}
      {/* ----------------------------------------------------------- */}
      {renamingNode && (
        <RenameNodeModal
          renamingNode={renamingNode}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          renameInputRef={renameInputRef}
          isRenameDuplicate={isRenameDuplicate}
          setIsInputFocused={setIsInputFocused}
          closeActiveDialog={closeActiveDialog}
          handleSaveRename={handleSaveRename}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* MOVE NODE MODAL */}
      {/* ----------------------------------------------------------- */}
      {movingNode && (
        <MoveNodeModal
          movingNode={movingNode}
          folderSearchQuery={folderSearchQuery}
          setFolderSearchQuery={setFolderSearchQuery}
          folderSearchInputRef={folderSearchInputRef}
          setIsInputFocused={setIsInputFocused}
          closeActiveDialog={closeActiveDialog}
          handleExecuteMove={handleExecuteMove}
          getAvailableFolders={getAvailableFolders}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* DELETE NODE MODAL */}
      {/* ----------------------------------------------------------- */}
      {nodeToDelete && (
        <DeleteNodeModal
          nodeToDelete={nodeToDelete}
          closeActiveDialog={closeActiveDialog}
          confirmDelete={confirmDelete}
        />
      )}

      {/* ----------------------------------------------------------- */}
      {/* EXPORT NOTE MODAL */}
      {/* ----------------------------------------------------------- */}
      {exportingNode && (
        <ExportNoteModal
          node={exportingNode}
          isOpen={!!exportingNode}
          onClose={() => setExportingNode(null)}
        />
      )}
    </div>
  );
};
