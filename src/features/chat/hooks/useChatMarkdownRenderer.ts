import { useEffect, useRef } from 'react';
import { ChatMessageRecord } from '../../../lib/db';
import { FileNode } from '../../../types/vault';
import { renderMarkdown } from '../../../lib/editor/markdownRenderer';

interface UseChatMarkdownRendererProps {
  messages: ChatMessageRecord[];
  vaultNodes: Record<string, FileNode>;
  setRenderedHtmlMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function useChatMarkdownRenderer({
  messages,
  vaultNodes,
  setRenderedHtmlMap,
}: UseChatMarkdownRendererProps) {
  // Rendered Markdown cache ref (id + content -> html)
  const renderedCacheRef = useRef<Map<string, { content: string; html: string }>>(new Map());
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const vaultNodesRef = useRef(vaultNodes);
  vaultNodesRef.current = vaultNodes;

  const isRenderingRef = useRef(false);
  const pendingRerunRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const processRender = async () => {
      if (isRenderingRef.current) {
        pendingRerunRef.current = true;
        return;
      }

      isRenderingRef.current = true;
      pendingRerunRef.current = false;

      try {
        const currentMessages = messagesRef.current;
        const currentNodes = vaultNodesRef.current;
        const updates: Record<string, string> = {};
        let hasChanges = false;

        for (const msg of currentMessages) {
          if (msg.role === 'assistant' && msg.content && msg.content.trim().length > 0) {
            const cached = renderedCacheRef.current.get(msg.id);
            if (!cached || cached.content !== msg.content) {
              try {
                const html = await renderMarkdown(msg.content, currentNodes);
                renderedCacheRef.current.set(msg.id, { content: msg.content, html });
                updates[msg.id] = html;
                hasChanges = true;
              } catch {
                updates[msg.id] = `<p>${msg.content}</p>`;
                hasChanges = true;
              }
            }
          }
        }

        if (isMountedRef.current && hasChanges) {
          setRenderedHtmlMap((prev) => ({ ...prev, ...updates }));
        }
      } finally {
        isRenderingRef.current = false;
        if (isMountedRef.current && pendingRerunRef.current) {
          pendingRerunRef.current = false;
          // Schedule next tick smoothly without blocking
          setTimeout(processRender, 20);
        }
      }
    };

    processRender();

    return () => {
      isMountedRef.current = false;
    };
  }, [messages, vaultNodes, setRenderedHtmlMap]);

  return {
    renderedCacheRef,
  };
}
