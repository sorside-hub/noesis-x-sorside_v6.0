import { useState, useRef, useEffect } from 'react';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';
import { useNoteProperties } from './useNoteProperties';
import { useAutoDetect } from './useAutoDetect';
import { useDistilLogic } from './useDistilLogic';
import { useRagSync } from './useRagSync';
import { useNoteLinksAndOutline } from './useNoteLinksAndOutline';

export type RightSidebarTab = 'PROPERTIES' | 'LOCAL_GRAPH' | 'TASKS' | 'DISTIL' | 'CHAT' | 'LINKS' | 'OUTLINE';

interface UseRightSidebarLogicOptions {
  vault: VaultData;
  activeNode: FileNode | null;
  onSelectFile: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
  updateNoteContent?: (id: string, content: string) => void;
  updateNodeTitle?: (id: string, title: string) => void;
  createFolder?: (parentId: string | null, name: string) => string | null;
  moveNode?: (id: string, targetParentId: string | null) => void;
  onNavigateToHeading?: (lineIndex: number, text: string) => void;
}

export function useRightSidebarLogic({
  vault,
  activeNode,
  onSelectFile,
  onUpdateMetadata,
  updateNoteContent,
  updateNodeTitle,
  createFolder,
  moveNode,
}: UseRightSidebarLogicOptions) {
  // Tabs Navigation State
  const [activeTab, setActiveTab] = useState<RightSidebarTab>('PROPERTIES');
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const tabMenuRef = useRef<HTMLDivElement>(null);

  // Close tab menu when clicked outside
  useEffect(() => {
    if (!isTabMenuOpen) return;
    const handleClickOutside = (e: Event) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(e.target as Node)) {
        setIsTabMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTabMenuOpen]);

  // 1. Properties & Metadata
  const properties = useNoteProperties({
    vault,
    activeNode,
    onUpdateMetadata,
  });

  // 2. Auto-Detect AI
  const autoDetect = useAutoDetect({
    vault,
    activeNode,
    noteType: properties.noteType,
    existingTags: properties.existingTags,
    existingNoteTypes: properties.existingNoteTypes,
    onUpdateMetadata,
    updateNodeTitle,
    createFolder,
    moveNode,
  });

  // 3. Distil AI
  const distil = useDistilLogic({
    vault,
    activeNode,
    onSelectFile,
    onUpdateMetadata,
  });

  // 4. RAG Sync & Brain Status
  const ragSync = useRagSync({
    activeNode,
  });

  // 5. Links & Outline
  const linksAndOutline = useNoteLinksAndOutline({
    vault,
    activeNode,
  });

  return {
    // Navigation
    activeTab,
    setActiveTab,
    isTabMenuOpen,
    setIsTabMenuOpen,
    tabMenuRef,

    // Properties Tab
    ...properties,

    // Distil Tab
    ...distil,

    // RAG Tab
    ...ragSync,

    // Links & Outline
    ...linksAndOutline,

    // Tasks Tab Content Updater
    handleUpdateContent: (newContent: string) => {
      if (activeNode && updateNoteContent) {
        updateNoteContent(activeNode.id, newContent);
      }
    },

    // Auto-Detect
    ...autoDetect,
  };
}
