import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../../lib/db';
import { VaultData, FileNode } from '../../../types/vault';
import { 
  TemplateSettings, 
  DEFAULT_TEMPLATE_SETTINGS, 
  TemplateItem, 
  getAvailableTemplates 
} from '../utils/templateUtils';

export const SETTINGS_KEY_TEMPLATES = 'templateSettings';

export function useTemplateSettings(vault?: VaultData, createFolder?: (parentId: string | null, name: string) => string | null) {
  const [settings, setSettings] = useState<TemplateSettings>(DEFAULT_TEMPLATE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load from db.settings on mount
  useEffect(() => {
    let isMounted = true;
    db.settings.get(SETTINGS_KEY_TEMPLATES).then((record) => {
      if (isMounted) {
        if (record && record.value) {
          try {
            const parsed = typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
            setSettings((prev) => ({ ...prev, ...parsed }));
          } catch {
            // fallback
          }
        }
        setIsLoading(false);
      }
    }).catch((err) => {
      console.warn('[Templates] Failed to load settings:', err);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update a single or multiple settings
  const updateSettings = useCallback(async (partial: Partial<TemplateSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      db.settings.put({
        key: SETTINGS_KEY_TEMPLATES,
        value: JSON.stringify(next),
      }).catch((err) => console.error('[Templates] Error saving settings:', err));
      return next;
    });
  }, []);

  // Resolve current active template folder node from vault
  const activeTemplateFolder = useMemo<FileNode | null>(() => {
    if (!vault || !vault.nodes) return null;
    if (settings.templateFolderId && vault.nodes[settings.templateFolderId]) {
      return vault.nodes[settings.templateFolderId];
    }
    const cleanPath = settings.templateFolderPath.trim().toLowerCase();
    const allNodes: FileNode[] = Object.values(vault.nodes);
    return allNodes.find(
      (n) => n.type === 'folder' && n.name.trim().toLowerCase() === cleanPath
    ) || null;
  }, [vault, settings.templateFolderId, settings.templateFolderPath]);

  // List of all folders in vault for selector
  const availableFolders = useMemo<FileNode[]>(() => {
    if (!vault || !vault.nodes) return [];
    const allNodes: FileNode[] = Object.values(vault.nodes);
    return allNodes
      .filter((n) => n.type === 'folder')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [vault]);

  // List of all templates available in current folder
  const templates = useMemo<TemplateItem[]>(() => {
    if (!vault) return [];
    return getAvailableTemplates(vault, settings.templateFolderId, settings.templateFolderPath);
  }, [vault, settings.templateFolderId, settings.templateFolderPath]);

  // Action: Create default "Templates" folder if it doesn't exist
  const createDefaultTemplateFolder = useCallback(() => {
    if (!createFolder) return null;
    const existing = availableFolders.find(
      (f) => f.name.trim().toLowerCase() === 'templates'
    );
    if (existing) {
      updateSettings({ templateFolderId: existing.id, templateFolderPath: existing.name });
      return existing.id;
    }

    const newFolderId = createFolder(null, 'Templates');
    if (newFolderId) {
      updateSettings({ templateFolderId: newFolderId, templateFolderPath: 'Templates' });
    }
    return newFolderId;
  }, [createFolder, availableFolders, updateSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    activeTemplateFolder,
    availableFolders,
    templates,
    createDefaultTemplateFolder,
  };
}
