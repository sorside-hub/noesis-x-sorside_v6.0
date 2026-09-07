import { useCallback } from 'react';
import { VaultData } from '../../types/vault';
import { saveActiveTabId, saveOpenTabs } from '../../lib/storage';
import { isNodeRecentlyDeleted } from '../../lib/sync/syncHelpers';

interface UseVaultTabsProps {
  setVault: React.Dispatch<React.SetStateAction<VaultData | null>>;
}

export const useVaultTabs = ({ setVault }: UseVaultTabsProps) => {
  const setActiveTabId = useCallback((id: string | null) => {
    setVault((prev) => {
      if (!prev) return prev;

      // Safe check: If targeting a specific note that does not exist in vault or was deleted
      if (id && !id.startsWith('empty_')) {
        const nodeExists = Boolean(prev.nodes[id]) && !isNodeRecentlyDeleted(id);
        if (!nodeExists) {
          // Ghost note targeted! Prune it from openTabs immediately and switch to a valid tab
          const prunedTabs = prev.openTabs.filter((tabId) => tabId !== id);
          const nextActiveId = prunedTabs.length > 0 ? prunedTabs[prunedTabs.length - 1] : null;
          saveOpenTabs(prunedTabs);
          saveActiveTabId(nextActiveId);
          return {
            ...prev,
            openTabs: prunedTabs,
            activeTabId: nextActiveId,
          };
        }
      }

      saveActiveTabId(id);

      let newOpenTabs = prev.openTabs;

      if (id && !newOpenTabs.includes(id)) {
        if (prev.activeTabId) {
          const activeIdx = newOpenTabs.indexOf(prev.activeTabId);
          if (activeIdx !== -1) {
            newOpenTabs = [...newOpenTabs];
            newOpenTabs[activeIdx] = id;
          } else {
            newOpenTabs = [...newOpenTabs, id];
          }
        } else {
          newOpenTabs = [...newOpenTabs, id];
        }
        saveOpenTabs(newOpenTabs);
      }

      return {
        ...prev,
        openTabs: newOpenTabs,
        activeTabId: id,
      };
    });
  }, [setVault]);

  const openInNewTab = useCallback((id: string | null) => {
    const tabId = id || `empty_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setVault((prev) => {
      if (!prev) return prev;

      // Safe check: if opening a specific note that doesn't exist or was deleted, ignore
      if (id && !id.startsWith('empty_') && (!prev.nodes[id] || isNodeRecentlyDeleted(id))) {
        return prev;
      }

      // If the file is already open, just switch to it (don't open a duplicate unless it's empty)
      if (id && prev.openTabs.includes(id)) {
        saveActiveTabId(id);
        return {
          ...prev,
          activeTabId: id,
        };
      }

      const newOpenTabs = [...prev.openTabs, tabId];
      saveOpenTabs(newOpenTabs);
      saveActiveTabId(tabId);

      return {
        ...prev,
        openTabs: newOpenTabs,
        activeTabId: tabId,
      };
    });
  }, [setVault]);

  const closeTab = useCallback((idToClose: string) => {
    setVault((prev) => {
      if (!prev) return prev;

      const idx = prev.openTabs.indexOf(idToClose);
      if (idx === -1) return prev; // Not open

      const newOpenTabs = [...prev.openTabs];
      newOpenTabs.splice(idx, 1);
      saveOpenTabs(newOpenTabs);

      let nextActiveId = prev.activeTabId;
      // If we closed the currently active tab, pick a neighboring tab
      if (prev.activeTabId === idToClose) {
        if (newOpenTabs.length === 0) {
          nextActiveId = null;
        } else {
          // Try to pick the right neighbor, otherwise the left neighbor
          const nextIdx = Math.min(idx, newOpenTabs.length - 1);
          nextActiveId = newOpenTabs[nextIdx];
        }
        saveActiveTabId(nextActiveId);
      }

      return {
        ...prev,
        openTabs: newOpenTabs,
        activeTabId: nextActiveId,
      };
    });
  }, [setVault]);

  return {
    setActiveTabId,
    openInNewTab,
    closeTab,
  };
};
