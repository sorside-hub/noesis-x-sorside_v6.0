import { useState, useEffect } from 'react';
import { VaultData } from '../types/vault';
import { loadVault } from '../lib/storage';
import { useVaultTabs } from './vault/useVaultTabs';
import { useVaultOperations } from './vault/useVaultOperations';

export const useVault = () => {
  const [vault, setVault] = useState<VaultData | null>(null);

  // Initial load from IndexedDB
  useEffect(() => {
    const handleLoad = () => {
      loadVault().then((data) => {
        setVault(data);
      });
    };

    handleLoad();

    window.addEventListener('vault-updated', handleLoad);
    return () => window.removeEventListener('vault-updated', handleLoad);
  }, []);

  const activeNode = vault?.activeTabId ? vault.nodes[vault.activeTabId] : null;

  // Tabs Management Hook
  const { setActiveTabId, openInNewTab, closeTab } = useVaultTabs({ setVault });

  // Vault File & Folder CRUD Operations Hook
  const {
    createNote,
    createFolder,
    updateNoteContent,
    updateNodeTitle,
    moveNode,
    updateNoteMetadata,
    setNodeBookmark,
    deleteNode,
  } = useVaultOperations({ setVault });

  return {
    vault,
    activeNode,
    setActiveTabId,
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
  };
};
