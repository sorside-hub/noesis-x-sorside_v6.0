import { useState, useRef } from 'react';
import { FileNode, VaultData, NoteMetadata } from '../../../types/vault';
import { EditorCoreRef } from '../components/EditorCore';
import { useNavigation } from '../../../context/NavigationContext';

interface UseNoteEditorLogicProps {
  vault: VaultData;
  activeNode: FileNode | null;
  updateNodeTitle: (id: string, title: string) => void;
  updateNoteContent: (id: string, content: string) => void;
  createNote: (parentId: string | null, name: string, initialMetadata?: Partial<NoteMetadata>) => string | null;
  createFolder: (parentId: string | null, name: string) => string | null;
  navigateToNote: (id: string) => void;
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  isMobileRightSidebarOpen: boolean;
  openMobileRightSidebar: () => void;
  closeMobileRightSidebar: () => void;
}

export function useNoteEditorLogic({
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
}: UseNoteEditorLogicProps) {
  // Desktop sidebar states
  const { isDesktopSidebarOpen, setIsDesktopSidebarOpen } = useNavigation();

  const [isDesktopRightSidebarOpen, setIsDesktopRightSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return false;
  });

  const editorRef = useRef<EditorCoreRef>(null);

  const currentTitle = activeNode?.name || '';
  const currentContent = activeNode?.content || '';

  const handleTitleChange = (newTitle: string) => {
    if (activeNode) {
      updateNodeTitle(activeNode.id, newTitle);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (activeNode) {
      updateNoteContent(activeNode.id, newContent);
    }
  };

  const handleCreateNewNote = (parentId: string | null = null) => {
    const newId = createNote(parentId, 'Untitled');
    if (newId) {
      navigateToNote(newId);
    }
    closeMobileSidebar();
  };

  const handleQuickCapture = () => {
    const allNodes = Object.values(vault.nodes) as FileNode[];
    let inboxFolder = allNodes.find(
      (n) => n.type === 'folder' && n.parentId === null && (n.name.toLowerCase() === '00-inbox' || n.name.toLowerCase() === '00 - inbox' || n.name.toLowerCase() === 'inbox')
    );

    let inboxFolderId: string | null = inboxFolder ? inboxFolder.id : null;

    if (!inboxFolderId) {
      inboxFolderId = createFolder(null, '00-Inbox');
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    const captureName = `Capture ${dateStr} ${timeStr}`;

    const newId = createNote(inboxFolderId, captureName, { status: 'Inbox' });
    if (newId) {
      navigateToNote(newId);
    }
    closeMobileSidebar();
  };

  const handleSelectFile = (fileId: string) => {
    navigateToNote(fileId);
  };

  const handleWikilinkClick = (targetName: string) => {
    const rawTarget = targetName.split('|')[0].trim();
    const cleanTarget = rawTarget.toLowerCase();
    if (!cleanTarget) return;

    const allNodes = Object.values(vault.nodes) as FileNode[];
    const existing = allNodes.find(
      (n: FileNode) =>
        n.type === 'file' &&
        (n.name.toLowerCase() === cleanTarget ||
          (n.metadata?.aliases || []).some((al) => al.toLowerCase() === cleanTarget))
    );

    if (existing) {
      navigateToNote(existing.id);
    } else {
      const newId = createNote(null, rawTarget);
      if (newId) {
        navigateToNote(newId);
      }
    }
  };

  const handleNavigateToHeading = (lineIndex: number, text: string) => {
    if (window.innerWidth < 1024) {
      closeMobileRightSidebar();
    }
    editorRef.current?.scrollToHeading(lineIndex, text);
  };

  const handleLeftHeaderToggle = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen((prev) => !prev);
    } else {
      if (isMobileSidebarOpen) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    }
  };

  const handleRightHeaderToggle = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopRightSidebarOpen((prev) => !prev);
    } else {
      if (isMobileRightSidebarOpen) {
        closeMobileRightSidebar();
      } else {
        openMobileRightSidebar();
      }
    }
  };

  return {
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
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
  };
}
