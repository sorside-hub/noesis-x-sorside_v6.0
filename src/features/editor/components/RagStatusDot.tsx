import React, { useEffect, useState } from 'react';
import { FileNode } from '../../../types/vault';
import { RAGPipeline, RagSyncStatus } from '../../rag/services/ragPipeline';

interface RagStatusDotProps {
  activeNode: FileNode | null;
}

export const RagStatusDot: React.FC<RagStatusDotProps> = ({ activeNode }) => {
  const [status, setStatus] = useState<RagSyncStatus | null>(null);

  useEffect(() => {
    if (!activeNode || activeNode.type !== 'file') {
      setStatus(null);
      return;
    }
    
    let isMounted = true;
    const rag = new RAGPipeline();
    rag.getSyncStatus(activeNode.id, activeNode.content || '').then((newStatus) => {
      if (isMounted) {
        setStatus(newStatus);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeNode?.id, activeNode?.content]);

  if (!status) return null;

  let dotColor = 'bg-neutral-400 dark:bg-neutral-500';
  let title = 'AI: Unprocessed';
  if (status === 'synced') {
    dotColor = 'bg-emerald-500';
    title = 'AI: Up to Date';
  } else if (status === 'out_of_sync') {
    dotColor = 'bg-amber-500';
    title = 'AI: Needs Update';
  } else if (status === 'error') {
    dotColor = 'bg-rose-500';
    title = 'AI: Sync Failed';
  }

  return (
    <div 
      className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-surface ${dotColor}`}
      title={title}
    />
  );
};
