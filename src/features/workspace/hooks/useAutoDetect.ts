import { useState } from 'react';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';
import { AutoDetectResult } from '../../../api-core/autoDetectHandler';

interface UseAutoDetectOptions {
  vault: VaultData;
  activeNode: FileNode | null;
  noteType: string;
  existingTags: string[];
  existingNoteTypes: string[];
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
  updateNodeTitle?: (id: string, title: string) => void;
  createFolder?: (parentId: string | null, name: string) => string | null;
  moveNode?: (id: string, targetParentId: string | null) => void;
}

export function useAutoDetect({
  vault,
  activeNode,
  noteType,
  existingTags,
  existingNoteTypes,
  onUpdateMetadata,
  updateNodeTitle,
  createFolder,
  moveNode,
}: UseAutoDetectOptions) {
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectError, setAutoDetectError] = useState<string | null>(null);
  const [autoDetectResult, setAutoDetectResult] = useState<AutoDetectResult | null>(null);
  const [autoDetectLog, setAutoDetectLog] = useState<any[] | null>(null);
  const [isAutoDetectModalOpen, setIsAutoDetectModalOpen] = useState(false);

  const handleRunAutoDetect = async () => {
    if (!activeNode) return;
    setIsAutoDetecting(true);
    setAutoDetectError(null);

    try {
      // Build list of existing folders
      const existingFolders = Object.values(vault.nodes)
        .filter((n) => n.type === 'folder')
        .map((n) => {
          let path = n.name;
          let curr = n.parentId;
          while (curr && vault.nodes[curr]) {
            path = `${vault.nodes[curr].name}/${path}`;
            curr = vault.nodes[curr].parentId;
          }
          return {
            id: n.id,
            name: n.name,
            path,
            parentId: n.parentId,
          };
        });

      const customKeys = getAllLocalKeyOverrides();
      const response = await fetch('/api/auto-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeNode.name,
          content: activeNode.content || '',
          currentNoteType: noteType,
          existingFolders,
          existingTags,
          existingNoteTypes,
          customKeys,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses Auto-Detect');
      }
      if (!data.success) {
        throw new Error(data.attempts?.[data.attempts.length - 1]?.error || 'Proses Auto-Detect gagal');
      }

      setAutoDetectResult(data.data.result);
      setAutoDetectLog(data.attempts || []);
      setIsAutoDetectModalOpen(true);
    } catch (err: any) {
      setAutoDetectError(err.message || 'Error saat Auto-Detect');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleApplyAutoDetect = (customResult?: AutoDetectResult) => {
    const result = customResult || autoDetectResult;
    if (!activeNode || !result) return;

    // 1. Update Title if changed
    if (result.suggestedTitle && result.suggestedTitle !== activeNode.name && updateNodeTitle) {
      updateNodeTitle(activeNode.id, result.suggestedTitle);
    }

    // 2. Update Metadata
    onUpdateMetadata(activeNode.id, {
      noteType: result.noteType,
      tags: result.tags,
      aliases: result.aliases,
    });

    // 3. Move/Create Folder
    const decision = result.folderDecision;
    if (decision) {
      if (decision.action === 'existing' && decision.existingFolderId) {
        const existingParentId = decision.existingFolderId === 'null' ? null : decision.existingFolderId;
        if (existingParentId !== activeNode.parentId && moveNode) {
          moveNode(activeNode.id, existingParentId);
        }
      } else if (decision.action === 'new' && decision.newFolderName) {
        if (createFolder && moveNode) {
          const resolvedParentId =
            decision.newFolderParentId &&
            decision.newFolderParentId !== 'null' &&
            decision.newFolderParentId !== 'undefined'
              ? decision.newFolderParentId
              : null;

          const newFolderId = createFolder(resolvedParentId, decision.newFolderName);
          if (newFolderId) {
            moveNode(activeNode.id, newFolderId);
          }
        }
      }
    }

    setIsAutoDetectModalOpen(false);
    setAutoDetectResult(null);
    setAutoDetectLog(null);
  };

  return {
    isAutoDetecting,
    autoDetectError,
    autoDetectResult,
    autoDetectLog,
    isAutoDetectModalOpen,
    setIsAutoDetectModalOpen,
    handleRunAutoDetect,
    handleApplyAutoDetect,
  };
}
