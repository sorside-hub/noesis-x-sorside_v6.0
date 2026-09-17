import { VaultData, FileNode } from '../../../types/vault';
import { RAGPipeline } from '../../rag/services/ragPipeline';
import { getAllLocalKeyOverrides } from '../../../lib/ai/keyManager';
import { isPureChitChat } from '../utils/intentDetection';
import { ChatEmbeddingService } from './chatEmbeddingService';
import { db } from '../../../lib/db';

export interface RetrievedContext {
  contextText: string;
  sources: Array<{ noteId: string; noteTitle: string }>;
  chunksToSave: Array<{ noteId: string; noteTitle: string; snippet: string; score?: number }>;
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
  let chunksToSave: Array<{ noteId: string; noteTitle: string; snippet: string; score?: number }> = [];

  if (mode === 'rag') {
    const isChitChat = isPureChitChat(query);
    if (!isChitChat) {
      try {
        const pipeline = new RAGPipeline(customKeys);
        const maxChatChunks = Math.max(3, Math.floor(topK * 0.4));

        // Cari kemiripan dari Catatan & Sesi Chat secara paralel
        const [noteResults, chatResults] = await Promise.all([
          pipeline.searchSimilarChunks(query, topK, threshold).catch((ragErr) => {
            console.warn('[RAG] Pipeline search note skipped:', ragErr);
            return [];
          }),
          ChatEmbeddingService.searchSimilarChatChunks(query, maxChatChunks, threshold).catch((chatErr) => {
            console.warn('[RAG] Pipeline search chat skipped:', chatErr);
            return [];
          }),
        ]);

        const contextParts: string[] = [];

        // 1. Olah hasil catatan
        if (noteResults.length > 0) {
          const notesText = noteResults
            .map((r) => `[Catatan "${r.noteTitle}"]:\n${r.snippet}`)
            .join('\n\n');
          contextParts.push(`=== REFERENSI CATATAN VAULT ===\n${notesText}`);

          const uniqueSourceMap = new Map<string, string>();
          noteResults.forEach((r) => {
            uniqueSourceMap.set(r.noteId, r.noteTitle);
          });
          sources.push(
            ...Array.from(uniqueSourceMap.entries()).map(([noteId, noteTitle]) => ({
              noteId,
              noteTitle,
            }))
          );

          chunksToSave.push(
            ...noteResults.map((r) => ({
              noteId: r.noteId,
              noteTitle: r.noteTitle,
              snippet: r.snippet,
              score: r.score,
            }))
          );
        }

        // 2. Olah hasil sesi chat yang di-index
        if (chatResults.length > 0) {
          // Ambil judul sesi chat dari database
          const sessionTitles = await Promise.all(
            chatResults.map(async (cr) => {
              const sess = await db.chat_sessions.get(cr.sessionId);
              return sess?.title || 'Sesi Diskusi Sebelumnya';
            })
          );

          const chatsText = chatResults
            .map((cr, idx) => `[Diskusi "${sessionTitles[idx]}"]:\n${cr.content}`)
            .join('\n\n');
          contextParts.push(`=== REFERENSI PERCAKAPAN SEBELUMNYA ===\n${chatsText}`);

          chatResults.forEach((cr, idx) => {
            const title = `💬 ${sessionTitles[idx]}`;
            // Hindari duplikasi jika sesi yang sama muncul di multiple chunks
            if (!sources.some((s) => s.noteId === cr.sessionId)) {
              sources.push({
                noteId: cr.sessionId,
                noteTitle: title,
              });
            }

            chunksToSave.push({
              noteId: cr.sessionId,
              noteTitle: title,
              snippet: cr.content,
              score: cr.similarity,
            });
          });
        }

        if (contextParts.length > 0) {
          contextText = contextParts.join('\n\n');
        }
      } catch (ragErr) {
        console.warn('[RAG] Retrieval skipped due to error:', ragErr);
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
