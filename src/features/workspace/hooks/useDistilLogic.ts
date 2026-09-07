import { useState, useEffect, MouseEvent } from 'react';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';
import { renderMarkdown } from '../../../lib/editor/markdownRenderer';

interface UseDistilLogicOptions {
  vault: VaultData;
  activeNode: FileNode | null;
  onSelectFile: (id: string) => void;
  onUpdateMetadata: (id: string, metadata: Partial<NoteMetadata>) => void;
}

export function useDistilLogic({
  vault,
  activeNode,
  onSelectFile,
  onUpdateMetadata,
}: UseDistilLogicOptions) {
  const [isDistiling, setIsDistiling] = useState(false);
  const [distilError, setDistilError] = useState('');
  const [distilHtml, setDistilHtml] = useState('');
  const [distilLog, setDistilLog] = useState<any[]>([]);

  // Re-render markdown when distilResult changes
  useEffect(() => {
    if (activeNode?.metadata?.distilResult) {
      renderMarkdown(activeNode.metadata.distilResult as string, vault.nodes)
        .then(setDistilHtml)
        .catch(console.error);
    } else {
      setDistilHtml('');
    }
  }, [activeNode?.metadata?.distilResult, vault.nodes]);

  // Generate Distil AI Summary
  const handleGenerateDistil = async () => {
    if (!activeNode || !activeNode.content) return;
    setIsDistiling(true);
    setDistilError('');
    setDistilLog([]);

    try {
      const customKeys = getAllLocalKeyOverrides();
      const response = await fetch('/api/distil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNode.content, customKeys }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to distil content');
      }
      if (!data.success) {
        if (data.attempts) setDistilLog(data.attempts);
        throw new Error(data.attempts?.[data.attempts.length - 1]?.error || 'AI generation failed');
      }

      setDistilLog(data.attempts || []);
      onUpdateMetadata(activeNode.id, { distilResult: data.data.text });
    } catch (err: any) {
      setDistilError(err.message);
    } finally {
      setIsDistiling(false);
    }
  };

  const handleDistilClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle Wikilink click
    const wikilinkEl = target.closest('[data-wikilink]') as HTMLElement | null;
    if (wikilinkEl) {
      const targetName = wikilinkEl.getAttribute('data-wikilink');
      if (targetName) {
        e.stopPropagation();
        const allNodes = Object.values(vault.nodes) as FileNode[];
        const matched = allNodes.find(
          (n) =>
            n.type === 'file' &&
            (n.name.toLowerCase() === targetName.toLowerCase() ||
              (n.metadata?.aliases || []).some((a) => a.toLowerCase() === targetName.toLowerCase()))
        );
        if (matched) {
          onSelectFile(matched.id);
        }
        return;
      }
    }

    // Handle Copy Code Button
    const copyBtn = target.closest('.copy-code-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      e.stopPropagation();
      const rawCode = copyBtn.getAttribute('data-code');
      if (rawCode) {
        const codeText = decodeURIComponent(rawCode);
        navigator.clipboard.writeText(codeText).then(() => {
          const copyIcon = copyBtn.querySelector('.copy-icon');
          const checkIcon = copyBtn.querySelector('.check-icon');
          const copyText = copyBtn.querySelector('.copy-text');
          if (copyIcon && checkIcon && copyText) {
            copyIcon.classList.add('hidden');
            checkIcon.classList.remove('hidden');
            copyText.textContent = 'Copied!';
            setTimeout(() => {
              copyIcon.classList.remove('hidden');
              checkIcon.classList.add('hidden');
              copyText.textContent = 'Copy';
            }, 2000);
          }
        });
      }
    }
  };

  return {
    isDistiling,
    distilError,
    distilHtml,
    distilLog,
    handleGenerateDistil,
    handleDistilClick,
  };
}
