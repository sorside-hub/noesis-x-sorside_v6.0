import React, { useState, useEffect } from 'react';
import { useVault } from '../../../hooks/useVault';
import { DeleteNodeModal } from '../../workspace/components/DeleteNodeModal';
import { MoveNodeModal } from '../../workspace/components/MoveNodeModal';
import { useNavigation } from '../../../context/NavigationContext';
import { useDrawerGestures } from '../hooks/useDrawerGestures';
import { useNoteEditorLogic } from '../hooks/useNoteEditorLogic';
import { useNoteModals } from '../hooks/useNoteModals';
import { DesktopLeftSidebar, DesktopRightSidebar, MobileDrawers } from './EditorSidebars';
import { EditorMainCanvas } from './EditorMainCanvas';
import { useBookmarks } from '../../workspace/hooks/useBookmarks';
import { BookmarkModal } from '../../workspace/components/BookmarkModal';

interface NoteEditorProps {
  vaultState?: ReturnType<typeof useVault>;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ vaultState: externalVaultState }) => {
  const internalVaultState = useVault();
  const {
    vault,
    activeNode,
    setActiveTabId: _setActiveTabId,
    openInNewTab,
    closeTab,
    createNote,
    createFolder,
    updateNoteContent,
    updateNodeTitle,
    updateNoteMetadata,
    setNodeBookmark,
    moveNode,
    deleteNode,
  } = externalVaultState || internalVaultState;

  const {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen: _setIsMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    isMobileRightSidebarOpen,
    setIsMobileRightSidebarOpen: _setIsMobileRightSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar,
    navigateToNote,
  } = useNavigation();

  // Bookmarks hook to sync header & note options bookmark status with Vault Metadata & Supabase
  const {
    isBookmarked,
    openBookmarkModal,
    closeBookmarkModal,
    isBookmarkModalOpen,
    modalTargetNode,
    saveBookmark,
    removeBookmark,
    groups,
    createGroup,
  } = useBookmarks(vault, setNodeBookmark);

  // Local selection state for mobile floating AI button
  const [hasSelection, setHasSelection] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

  const {
    leftDrawerRef,
    leftBackdropRef,
    rightDrawerRef,
    rightBackdropRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDrawerGestures({
    isMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    isMobileRightSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar,
  });

  // Scroll synchronization, wikilinks, headings, and title/content logic
  const {
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen: _setIsDesktopSidebarOpen,
    isDesktopRightSidebarOpen,
    setIsDesktopRightSidebarOpen,
    editorRef,
    currentTitle,
    currentContent,
    handleTitleChange,
    handleContentChange,
    handleCreateNewNote,
    handleQuickCapture,
    handleSelectFile,
    handleWikilinkClick,
    handleNavigateToHeading,
    handleLeftHeaderToggle,
    handleRightHeaderToggle,
  } = useNoteEditorLogic({
    vault,
    activeNode,
    updateNodeTitle,
    updateNoteContent,
    createNote,
    createFolder,
    navigateToNote,
    isMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    isMobileRightSidebarOpen,
    openMobileRightSidebar,
    closeMobileRightSidebar,
  });

  // Note Options (Move & Delete) Modals & State
  const {
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
  } = useNoteModals({
    activeNode,
    nodes: vault.nodes,
    moveNode,
    deleteNode,
  });

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleLeftHeaderToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLeftHeaderToggle]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className="flex h-full w-full overflow-hidden bg-bg-primary text-[length:var(--text-body-size)] select-text relative"
    >
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <DesktopLeftSidebar
        isOpen={isDesktopSidebarOpen}
        vault={vault}
        onSelectFile={handleSelectFile}
        openInNewTab={openInNewTab}
        onCreateNote={handleCreateNewNote}
        createFolder={createFolder}
        updateNodeTitle={updateNodeTitle}
        moveNode={moveNode}
        deleteNode={deleteNode}
        setNodeBookmark={setNodeBookmark}
      />

      {/* 2. MOBILE DRAWERS */}
      <MobileDrawers
        vault={vault}
        activeNode={activeNode}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        isDesktopRightSidebarOpen={isDesktopRightSidebarOpen}
        setIsDesktopRightSidebarOpen={setIsDesktopRightSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
        isMobileRightSidebarOpen={isMobileRightSidebarOpen}
        closeMobileRightSidebar={closeMobileRightSidebar}
        leftDrawerRef={leftDrawerRef}
        leftBackdropRef={leftBackdropRef}
        rightDrawerRef={rightDrawerRef}
        rightBackdropRef={rightBackdropRef}
        onSelectFile={handleSelectFile}
        openInNewTab={openInNewTab}
        onCreateNote={handleCreateNewNote}
        createFolder={createFolder}
        updateNodeTitle={updateNodeTitle}
        moveNode={moveNode}
        deleteNode={deleteNode}
        setNodeBookmark={setNodeBookmark}
        onUpdateMetadata={updateNoteMetadata}
        updateNoteContent={updateNoteContent}
        onNavigateToHeading={handleNavigateToHeading}
      />

      {/* 3. CENTER MAIN WORKSPACE CANVAS */}
      <EditorMainCanvas
        vault={vault}
        activeNode={activeNode}
        currentTitle={currentTitle}
        currentContent={currentContent}
        editorRef={editorRef}
        hasSelection={hasSelection}
        isAiMenuOpen={isAiMenuOpen}
        setHasSelection={setHasSelection}
        setIsAiMenuOpen={setIsAiMenuOpen}
        handleTitleChange={handleTitleChange}
        handleContentChange={handleContentChange}
        handleCreateNewNote={handleCreateNewNote}
        handleQuickCapture={handleQuickCapture}
        handleWikilinkClick={handleWikilinkClick}
        handleLeftHeaderToggle={handleLeftHeaderToggle}
        handleRightHeaderToggle={handleRightHeaderToggle}
        handleOpenMoveModal={handleOpenMoveModal}
        handleOpenDeleteModal={handleOpenDeleteModal}
        navigateToNote={navigateToNote}
        closeTab={closeTab}
        openInNewTab={openInNewTab}
        isBookmarked={activeNode ? isBookmarked(activeNode.id) : false}
        onToggleBookmark={() => {
          if (activeNode) {
            openBookmarkModal(activeNode.id);
          }
        }}
      />

      {/* 4. DESKTOP RIGHT SIDEBAR */}
      <DesktopRightSidebar
        isOpen={isDesktopRightSidebarOpen}
        onClose={() => setIsDesktopRightSidebarOpen(false)}
        vault={vault}
        activeNode={activeNode}
        onSelectFile={handleSelectFile}
        onUpdateMetadata={updateNoteMetadata}
        updateNoteContent={updateNoteContent}
        updateNodeTitle={updateNodeTitle}
        createFolder={createFolder}
        moveNode={moveNode}
        onNavigateToHeading={handleNavigateToHeading}
      />

      {/* 5. MODALS TRIGGERED FROM NOTE ACTIONS */}
      {isBookmarkModalOpen && (
        <BookmarkModal
          isOpen={isBookmarkModalOpen}
          onClose={closeBookmarkModal}
          targetNode={modalTargetNode || activeNode}
          vault={vault}
          groups={groups}
          isBookmarked={
            modalTargetNode
              ? isBookmarked(modalTargetNode.id)
              : activeNode
              ? isBookmarked(activeNode.id)
              : false
          }
          onSaveBookmark={saveBookmark}
          onRemoveBookmark={removeBookmark}
          onCreateGroup={createGroup}
        />
      )}

      {isMoveModalOpen && activeNode && (
        <MoveNodeModal
          movingNode={activeNode}
          folderSearchQuery={folderSearchQuery}
          setFolderSearchQuery={setFolderSearchQuery}
          folderSearchInputRef={folderSearchInputRef}
          setIsInputFocused={setIsInputFocused}
          closeActiveDialog={handleCloseMoveModal}
          handleExecuteMove={handleExecuteMove}
          getAvailableFolders={getAvailableFolders}
        />
      )}

      {isDeleteModalOpen && activeNode && (
        <DeleteNodeModal
          nodeToDelete={activeNode}
          closeActiveDialog={handleCloseDeleteModal}
          confirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
};
