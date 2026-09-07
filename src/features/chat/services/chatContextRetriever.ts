import { VaultData, FileNode } from '../../../types/vault';
import { RAGPipeline } from '../../rag/services/ragPipeline';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';
import { isPureChitChat } from '../utils/intentDetection';

export interface RetrievedContext {
  contextText: string;
  sources: Array<{ noteId: string; noteTitle: string }>;
  chunksToSave: Array<{ noteId: string; noteTitle: string; snippet: string }>;
}

export async function retrieveChatContext(
  query: string,
  mode: 'rag' | 'current',
  activeNode: FileNode | null,
  topK: number,
  threshold: number
): Promise<RetrievedContext> {
  const customKeys = getAllLocalKeyOverrides();
  let contextText = '';
  let sources: Array<{ noteId: string; noteTitle: string }> = [];
  let chunksToSave: Array<{ noteId: string; noteTitle: string; snippet: string }> = [];

  if (mode === 'rag') {
    const isChitChat = isPureChitChat(query);
    if (!isChitChat) {
      try {
        const pipeline = new RAGPipeline(customKeys);
        const results = await pipeline.searchSimilarChunks(query, topK, threshold);

        if (results.length > 0) {
          contextText = results
            .map((r) => `[Catatan "${r.noteTitle}"]:\n${r.snippet}`)
            .join('\n\n');

          const uniqueSourceMap = new Map<string, string>();
          results.forEach((r) => {
            uniqueSourceMap.set(r.noteId, r.noteTitle);
          });
          sources = Array.from(uniqueSourceMap.entries()).map(([noteId, noteTitle]) => ({
            noteId,
            noteTitle,
          }));

          chunksToSave = results.map((r) => ({
            noteId: r.noteId,
            noteTitle: r.noteTitle,
            snippet: r.snippet,
          }));
        }
      } catch (ragErr) {
        console.warn('[RAG] Pipeline search skipped due to error:', ragErr);
      }
    }
  } else {
    // Catatan Aktif Mode with Smart Safety Guard
    if (activeNode && activeNode.content) {
      const MAX_ACTIVE_NOTE_CHARS = 18000;
      let noteBody = activeNode.content;
      let isTruncated = false;

      if (noteBody.length > MAX_ACTIVE_NOTE_CHARS) {
        noteBody =
          noteBody.substring(0, MAX_ACTIVE_NOTE_CHARS) +
          '\n\n[... Catatan sangat panjang: diringkas pada 18.000 karakter pertama demi efisiensi konteks AI ...]';
        isTruncated = true;
      }

      contextText = `[Catatan Aktif "${activeNode.name}"]:\n${noteBody}`;
      sources = [{ noteId: activeNode.id, noteTitle: activeNode.name }];
      chunksToSave = [
        {
          noteId: activeNode.id,
          noteTitle: activeNode.name,
          snippet:
            activeNode.content.substring(0, 300) +
            (activeNode.content.length > 300 ? '...' : '') +
            (isTruncated ? ' (Panjang diproteksi)' : ''),
        },
      ];
    }
  }

  return {
    contextText,
    sources,
    chunksToSave,
  };
}
