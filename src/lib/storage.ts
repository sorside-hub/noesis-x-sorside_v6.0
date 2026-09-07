import { VaultData, FileNode } from '../types/vault';
import { db } from './db';
import { pushNodeToCloud, deleteNodesFromCloud } from './cloudSync';
import { markNodeAsDeleted, isNodeRecentlyDeleted } from './sync/syncHelpers';

const STORAGE_KEY_VAULT = 'noesis_vault_v1';
const LEGACY_KEY_TITLE = 'obsidian_clone_title';
const LEGACY_KEY_CONTENT = 'obsidian_clone_content';
const DEFAULT_WELCOME_NOTE_ID = 'welcome_note';

const createDefaultNodes = (): Record<string, FileNode> => {
  // Check if there is legacy content in localStorage
  const legacyTitle = localStorage.getItem(LEGACY_KEY_TITLE);
  const legacyContent = localStorage.getItem(LEGACY_KEY_CONTENT);

  // If there is legacy content, migrate it over so they don't lose data
  if (legacyTitle || legacyContent) {
    const initialNote: FileNode = {
      id: DEFAULT_WELCOME_NOTE_ID,
      name: legacyTitle?.trim() || 'Imported Note',
      type: 'file',
      parentId: null,
      content: legacyContent || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return {
      [initialNote.id]: initialNote,
    };
  }

  // Otherwise, return a completely empty vault for new users
  return {};
};

export const loadVault = async (): Promise<VaultData> => {
  try {
    const nodesCount = await db.nodes.count();
    
    // 1. If DB is empty, try to migrate from LocalStorage
    if (nodesCount === 0) {
      const raw = localStorage.getItem(STORAGE_KEY_VAULT);
      let nodesToSave: Record<string, FileNode> = {};
      let activeIdToSave: string | null = null;
      
      if (raw) {
        // Migrate from LocalStorage
        const parsed = JSON.parse(raw) as any;
        if (parsed && typeof parsed.nodes === 'object') {
          nodesToSave = parsed.nodes;
          activeIdToSave = parsed.activeFileId;
        }
      } else {
        // Initial setup
        nodesToSave = createDefaultNodes();
      }

      // Bulk add to IndexedDB
      await db.nodes.bulkPut(Object.values(nodesToSave));
      
      let initialOpenTabs: string[] = [];
      if (activeIdToSave) {
        await db.settings.put({ key: 'activeTabId', value: activeIdToSave });
        initialOpenTabs = [activeIdToSave];
        await db.settings.put({ key: 'openTabs', value: JSON.stringify(initialOpenTabs) });
      }

      // Cleanup localStorage
      localStorage.removeItem(STORAGE_KEY_VAULT);
      localStorage.removeItem(LEGACY_KEY_TITLE);
      localStorage.removeItem(LEGACY_KEY_CONTENT);

      return {
        nodes: nodesToSave,
        openTabs: initialOpenTabs,
        activeTabId: activeIdToSave,
      };
    }

    // 2. Load normally from IndexedDB
    const allNodesArray = await db.nodes.toArray();
    const nodesRecord: Record<string, FileNode> = {};
    for (const node of allNodesArray) {
      // Sanitize bad parentId strings
      if (node.parentId === 'null' || node.parentId === 'undefined') {
        node.parentId = null;
        // Run async fix in the background
        db.nodes.put(node).catch(() => {});
      }
      nodesRecord[node.id] = node;
    }

    const activeTabIdSetting = await db.settings.get('activeTabId');
    const legacyActiveIdSetting = await db.settings.get('activeFileId'); // migration
    const openTabsSetting = await db.settings.get('openTabs');

    let activeTabId = activeTabIdSetting?.value || null;
    let openTabs: string[] = [];
    
    // Migration logic
    if (openTabsSetting?.value) {
      try {
        openTabs = JSON.parse(openTabsSetting.value);
      } catch (e) {
        openTabs = [];
      }
    } else if (legacyActiveIdSetting?.value) {
      activeTabId = legacyActiveIdSetting.value;
      openTabs = [legacyActiveIdSetting.value];
    }

    // Smart Ghost Tab Cleanup:
    // Only retain tabs that are either temporary scratchpads ('empty_') or exist in nodesRecord
    const validOpenTabs = openTabs.filter(
      (tabId) => tabId.startsWith('empty_') || Boolean(nodesRecord[tabId])
    );

    if (validOpenTabs.length !== openTabs.length) {
      openTabs = validOpenTabs;
      saveOpenTabs(openTabs).catch(console.error);
    }

    // Validate activeTabId: if activeTabId points to a deleted node, switch to another open tab or null
    if (activeTabId && !activeTabId.startsWith('empty_') && !nodesRecord[activeTabId]) {
      activeTabId = openTabs.length > 0 ? openTabs[openTabs.length - 1] : null;
      saveActiveTabId(activeTabId).catch(console.error);
    }

    return {
      nodes: nodesRecord,
      openTabs,
      activeTabId,
    };
  } catch (err) {
    console.error('Failed to load vault from IndexedDB:', err);
    return { nodes: createDefaultNodes(), openTabs: [], activeTabId: null };
  }
};

export const saveActiveTabId = async (id: string | null): Promise<void> => {
  try {
    await db.settings.put({ key: 'activeTabId', value: id });
  } catch (err) {
    console.error('Failed to save activeTabId to IndexedDB:', err);
  }
};

export const saveOpenTabs = async (tabs: string[]): Promise<void> => {
  try {
    await db.settings.put({ key: 'openTabs', value: JSON.stringify(tabs) });
  } catch (err) {
    console.error('Failed to save openTabs to IndexedDB:', err);
  }
};

export const saveNode = async (node: FileNode): Promise<void> => {
  // Zombie Resurrect Guard: Do not save if node was recently deleted
  if (isNodeRecentlyDeleted(node.id)) {
    console.warn(`[storage] Blocked saveNode for recently deleted node ${node.id}`);
    return;
  }
  try {
    await db.nodes.put(node);
    // Background cloud sync (fire-and-forget)
    pushNodeToCloud(node).catch(console.error);
  } catch (err) {
    console.error('Failed to save node to IndexedDB:', err);
  }
};

export const deleteNodes = async (ids: string[]): Promise<void> => {
  // Mark as recently deleted to block resurrection
  for (const id of ids) {
    markNodeAsDeleted(id);
  }
  try {
    await db.nodes.bulkDelete(ids);
    // Background cloud sync (fire-and-forget)
    deleteNodesFromCloud(ids).catch(console.error);
  } catch (err) {
    console.error('Failed to delete nodes from IndexedDB:', err);
  }
};

export const exportVaultToJSON = async (): Promise<string> => {
  try {
    const allNodesArray = await db.nodes.toArray();
    const allMediaAttachments = await db.media_attachments.toArray();
    const bookmarkGroupsRec = await db.settings.get('bookmarkGroups');
    let bookmarkGroups = [];
    if (bookmarkGroupsRec?.value) {
      bookmarkGroups = typeof bookmarkGroupsRec.value === 'string' ? JSON.parse(bookmarkGroupsRec.value) : bookmarkGroupsRec.value;
    } else {
      const saved = localStorage.getItem('noesis_vault_bookmark_groups');
      if (saved) bookmarkGroups = JSON.parse(saved);
    }

    const exportData = {
      version: 2,
      timestamp: Date.now(),
      nodes: allNodesArray,
      bookmarkGroups,
      mediaAttachments: allMediaAttachments,
    };
    return JSON.stringify(exportData, null, 2);
  } catch (err) {
    console.error('Failed to export vault:', err);
    throw err;
  }
};

export const importVaultFromJSON = async (jsonString: string): Promise<void> => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid backup file format.');
    }
    
    // Validate each node structure lightly
    const nodesToImport: FileNode[] = parsed.nodes.filter((node: any) => 
      node && typeof node.id === 'string' && typeof node.type === 'string' && typeof node.name === 'string'
    ).map((node: any) => {
      if (node.parentId === 'null' || node.parentId === 'undefined') {
        node.parentId = null;
      }
      return node;
    });

    if (nodesToImport.length === 0) {
      throw new Error('No valid nodes found to import.');
    }

    // Upsert nodes to IndexedDB
    await db.nodes.bulkPut(nodesToImport);

    // Restore Bookmark Groups if included in backup
    if (parsed.bookmarkGroups && Array.isArray(parsed.bookmarkGroups)) {
      await db.settings.put({ key: 'bookmarkGroups', value: JSON.stringify(parsed.bookmarkGroups) });
      localStorage.setItem('noesis_vault_bookmark_groups', JSON.stringify(parsed.bookmarkGroups));
      window.dispatchEvent(new CustomEvent('bookmark-groups-updated', { detail: parsed.bookmarkGroups }));
    }

    // Restore Media Attachments if included in backup
    if (parsed.mediaAttachments && Array.isArray(parsed.mediaAttachments)) {
      await db.media_attachments.bulkPut(parsed.mediaAttachments);
    }
  } catch (err) {
    console.error('Failed to import vault:', err);
    throw err;
  }
};
