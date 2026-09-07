import React from 'react';
import { LeftSidebar } from '../../workspace/components/LeftSidebar';
import { RightSidebar } from '../../workspace/components/RightSidebar';
import { MobileDrawer } from './MobileDrawer';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';

interface EditorSidebarsProps {
  vault: VaultData;
  activeNode: FileNode | null;
  isDesktopSidebarOpen: boolean;
  isDesktopRightSidebarOpen: boolean;
  setIsDesktopRightSidebarOpen: (val: boolean) => void;
  isMobileSidebarOpen: boolean;
  closeMobileSidebar: () => void;
  isMobileRightSidebarOpen: boolean;
  closeMobileRightSidebar: () => void;
  leftDrawerRef: React.RefObject<HTMLDivElement | null>;
  leftBackdropRef: React.RefObject<HTMLDivElement | null>;
  rightDrawerRef: React.RefObject<HTMLDivElement | null>;
  rightBackdropRef: React.RefObject<HTMLDivElement | null>;
  onSelectFile: (id: string) => void;
  openInNewTab: (id: string) => void;
  onCreateNote: (parentId?: string | null) => void;
  createFolder: (parentId?: string | null, name?: string) => string;
  updateNodeTitle: (id: string, name: string) => void;
  moveNode: (id: string, parentId: string | null) => void;
  deleteNode: (id: string) => void;
  setNodeBookmark?: (id: string, bookmark: import('../../../types/vault').BookmarkMeta | null) => void;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
  updateNoteContent: (id: string, content: string) => void;
  onNavigateToHeading: (lineIndex: number, text: string) => void;
}

export const DesktopLeftSidebar: React.FC<{
  isOpen: boolean;
  vault: VaultData;
  onSelectFile: (id: string) => void;
  openInNewTab: (id: string) => void;
  onCreateNote: (parentId?: string | null) => void;
  createFolder: (parentId?: string | null, name?: string) => string;
  updateNodeTitle: (id: string, name: string) => void;
  moveNode: (id: string, parentId: string | null) => void;
  deleteNode: (id: string) => void;
  setNodeBookmark?: (id: string, bookmark: import('../../../types/vault').BookmarkMeta | null) => void;
}> = ({
  isOpen,
  vault,
  onSelectFile,
  openInNewTab,
  onCreateNote,
  createFolder,
  updateNodeTitle,
  moveNode,
  deleteNode,
  setNodeBookmark,
}) => {
  return (
    <div
      className={`hidden lg:flex flex-col h-full border-r border-border-default bg-bg-surface transition-[width,opacity] duration-200 ease-in-out shrink-0 overflow-hidden ${
        isOpen ? 'w-72 xl:w-80 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
      }`}
    >
      <LeftSidebar
        vault={vault}
        activeFileId={vault.activeTabId}
        onSelectFile={onSelectFile}
        onOpenInNewTab={openInNewTab}
        onCreateNote={onCreateNote}
        onCreateFolder={createFolder}
        onRenameNode={updateNodeTitle}
        onMoveNode={moveNode}
        onDeleteNode={deleteNode}
        setNodeBookmark={setNodeBookmark}
        isOpen={isOpen}
        onCloseMobile={() => {}}
      />
    </div>
  );
};

export const DesktopRightSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vault: VaultData;
  activeNode: FileNode | null;
  onSelectFile: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
  updateNoteContent: (id: string, content: string) => void;
  updateNodeTitle: (id: string, name: string) => void;
  createFolder: (parentId?: string | null, name?: string) => string;
  moveNode: (id: string, parentId: string | null) => void;
  onNavigateToHeading: (lineIndex: number, text: string) => void;
}> = ({
  isOpen,
  onClose,
  vault,
  activeNode,
  onSelectFile,
  onUpdateMetadata,
  updateNoteContent,
  updateNodeTitle,
  createFolder,
  moveNode,
  onNavigateToHeading,
}) => {
  return (
    <div
      className={`hidden lg:flex flex-col h-full border-l border-border-default bg-bg-surface transition-[width,opacity] duration-200 ease-in-out shrink-0 overflow-hidden ${
        isOpen ? 'w-80 xl:w-96 opacity-100' : 'w-0 opacity-0 border-l-0 pointer-events-none'
      }`}
    >
      <RightSidebar
        isOpen={isOpen}
        onClose={onClose}
        vault={vault}
        activeNode={activeNode}
        onSelectFile={onSelectFile}
        onUpdateMetadata={onUpdateMetadata}
        updateNoteContent={updateNoteContent}
        updateNodeTitle={updateNodeTitle}
        createFolder={createFolder}
        moveNode={moveNode}
        onNavigateToHeading={onNavigateToHeading}
      />
    </div>
  );
};

export const MobileDrawers: React.FC<EditorSidebarsProps> = ({
  vault,
  activeNode,
  isMobileSidebarOpen,
  closeMobileSidebar,
  isMobileRightSidebarOpen,
  closeMobileRightSidebar,
  leftDrawerRef,
  leftBackdropRef,
  rightDrawerRef,
  rightBackdropRef,
  onSelectFile,
  openInNewTab,
  onCreateNote,
  createFolder,
  updateNodeTitle,
  moveNode,
  deleteNode,
  setNodeBookmark,
  onUpdateMetadata,
  updateNoteContent,
  onNavigateToHeading,
}) => {
  return (
    <>
      <MobileDrawer
        side="left"
        backdropRef={leftBackdropRef}
        drawerRef={leftDrawerRef}
        onClose={closeMobileSidebar}
      >
        <LeftSidebar
          vault={vault}
          activeFileId={vault.activeTabId}
          onSelectFile={onSelectFile}
          onOpenInNewTab={openInNewTab}
          onCreateNote={onCreateNote}
          onCreateFolder={createFolder}
          onRenameNode={updateNodeTitle}
          onMoveNode={moveNode}
          onDeleteNode={deleteNode}
          setNodeBookmark={setNodeBookmark}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
      </MobileDrawer>

      <MobileDrawer
        side="right"
        backdropRef={rightBackdropRef}
        drawerRef={rightDrawerRef}
        onClose={closeMobileRightSidebar}
      >
        <RightSidebar
          isOpen={isMobileRightSidebarOpen}
          onClose={closeMobileRightSidebar}
          vault={vault}
          activeNode={activeNode}
          onSelectFile={onSelectFile}
          onUpdateMetadata={onUpdateMetadata}
          updateNoteContent={updateNoteContent}
          updateNodeTitle={updateNodeTitle}
          createFolder={createFolder}
          moveNode={moveNode}
          onNavigateToHeading={onNavigateToHeading}
        />
      </MobileDrawer>
    </>
  );
};
