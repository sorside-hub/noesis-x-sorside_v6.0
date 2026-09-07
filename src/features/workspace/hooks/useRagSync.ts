import { useState, useEffect } from 'react';
import { FileNode } from '../../../types/vault';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';
import { RAGPipeline, RagSyncStatus } from '../../rag/services/ragPipeline';
import { AIAnalysisRecord } from '../../rag/types/models';

interface UseRagSyncOptions {
  activeNode: FileNode | null;
}

export function useRagSync({ activeNode }: UseRagSyncOptions) {
  const [isSyncingRag, setIsSyncingRag] = useState(false);
  const [ragSyncStatus, setRagSyncStatus] = useState<RagSyncStatus | null>(null);
  const [aiMetadata, setAiMetadata] = useState<AIAnalysisRecord | null>(null);

  // Check sync status whenever note or content changes
  useEffect(() => {
    if (!activeNode || activeNode.type !== 'file') {
      setRagSyncStatus(null);
      setAiMetadata(null);
      return;
    }

    let isMounted = true;
    const rag = new RAGPipeline();

    rag.getSyncStatus(activeNode.id, activeNode.content || '').then((status) => {
      if (isMounted) {
        setRagSyncStatus(status);
      }
    });

    rag.getMetadata(activeNode.id).then((meta) => {
      if (isMounted) {
        setAiMetadata(meta);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeNode?.id, activeNode?.content]);

  // Process AI RAG
  const handleProcessRag = async () => {
    if (!activeNode) return;
    setIsSyncingRag(true);

    try {
      const customKeys = getAllLocalKeyOverrides();
      const pipeline = new RAGPipeline(customKeys);
      const success = await pipeline.processNote(activeNode.id, activeNode.content || '');
      if (success) {
        setRagSyncStatus('synced');
      } else {
        setRagSyncStatus('error');
      }

      const meta = await pipeline.getMetadata(activeNode.id);
      if (meta) {
        setAiMetadata(meta);
      }
    } catch (err) {
      console.error('Failed manual sync to brain:', err);
      setRagSyncStatus('error');
    } finally {
      setIsSyncingRag(false);
    }
  };

  // Remove from AI RAG
  const handleRemoveRag = async () => {
    if (!activeNode) return;
    setIsSyncingRag(true);

    try {
      const pipeline = new RAGPipeline();
      await pipeline.deleteNote(activeNode.id);
      setRagSyncStatus('unprocessed');
      setAiMetadata(null);
    } catch (err) {
      console.error('Failed to delete from brain:', err);
    } finally {
      setIsSyncingRag(false);
    }
  };

  return {
    isSyncingRag,
    ragSyncStatus,
    aiMetadata,
    handleProcessRag,
    handleRemoveRag,
  };
}
