import { useMemo } from 'react';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';

interface UseNotePropertiesOptions {
  vault: VaultData;
  activeNode: FileNode | null;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
}

export function useNoteProperties({
  vault,
  activeNode,
  onUpdateMetadata,
}: UseNotePropertiesOptions) {
  // Folder Path calculation
  const folderName = useMemo(() => {
    if (!activeNode || !activeNode.parentId) return 'Root Vault';
    const parent = vault.nodes[activeNode.parentId];
    return parent ? parent.name : 'Root Vault';
  }, [activeNode, vault.nodes]);

  // Document statistics calculation
  const stats = useMemo(() => {
    if (!activeNode || !activeNode.content) {
      return { words: 0, characters: 0, readingTimeMinutes: 1 };
    }
    const text = activeNode.content.trim();
    if (!text) {
      return { words: 0, characters: 0, readingTimeMinutes: 1 };
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, characters, readingTimeMinutes };
  }, [activeNode]);

  // Formatted dates
  const formattedCreated = useMemo(() => {
    if (!activeNode) return '-';
    const d = new Date(activeNode.createdAt);
    return d.toISOString().split('T')[0];
  }, [activeNode]);

  const formattedModified = useMemo(() => {
    if (!activeNode) return '-';
    const d = new Date(activeNode.updatedAt);
    return d.toISOString().split('T')[0];
  }, [activeNode]);

  // Metadata accessors
  const metadata: NoteMetadata = activeNode?.metadata || {};
  const tags = metadata.tags || [];
  const aliases = metadata.aliases || [];
  const noteType = metadata.noteType || '';
  const status = metadata.status || '';

  // Metadata Handlers
  const handleTypeChange = (val: string) => {
    if (!activeNode) return;
    onUpdateMetadata(activeNode.id, { noteType: val });
  };

  const handleStatusChange = (val: string) => {
    if (!activeNode) return;
    onUpdateMetadata(activeNode.id, { status: val });
  };

  const handleTagsChange = (newTags: string[]) => {
    if (!activeNode) return;
    onUpdateMetadata(activeNode.id, { tags: newTags });
  };

  const handleAliasesChange = (newAliases: string[]) => {
    if (!activeNode) return;
    onUpdateMetadata(activeNode.id, { aliases: newAliases });
  };

  const handleCustomPropertiesChange = (customProperties: any[]) => {
    if (!activeNode) return;
    onUpdateMetadata(activeNode.id, { customProperties });
  };

  // Extract unique tags and note types from the vault for autocomplete
  const existingTagsAndTypes = useMemo(() => {
    const allTags = new Set<string>();
    const allNoteTypes = new Set<string>();
    Object.values(vault.nodes).forEach((n) => {
      if (n.type === 'file' && n.metadata) {
        if (Array.isArray(n.metadata.tags)) {
          n.metadata.tags.forEach((t) => allTags.add(t));
        }
        if (typeof n.metadata.noteType === 'string' && n.metadata.noteType.trim()) {
          allNoteTypes.add(n.metadata.noteType.trim());
        }
      }
    });
    return {
      existingTags: Array.from(allTags).sort(),
      existingNoteTypes: Array.from(allNoteTypes).sort(),
    };
  }, [vault.nodes]);

  return {
    folderName,
    stats,
    formattedCreated,
    formattedModified,
    metadata,
    tags,
    aliases,
    noteType,
    status,
    handleTypeChange,
    handleStatusChange,
    handleTagsChange,
    handleAliasesChange,
    handleCustomPropertiesChange,
    existingTags: existingTagsAndTypes.existingTags,
    existingNoteTypes: existingTagsAndTypes.existingNoteTypes,
  };
}
