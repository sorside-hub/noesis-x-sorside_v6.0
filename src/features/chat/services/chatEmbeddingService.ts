import { supabase } from '../../../lib/supabase';
import { db, ChatMessageRecord, ChatSessionRecord } from '../../../lib/db';
import { getSessionMessages } from './chatStorage';

export interface ChatChunkResult {
  sessionId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

export interface ChatEmbeddingStatus {
  isEmbedded: boolean;
  chunkCount: number;
}

/**
 * Memecah riwayat pesan percakapan menjadi potongan teks (chunks) kontekstual
 * yang optimal untuk di-vektorisasi oleh model BGE-M3 (1024-dimensi).
 */
export function chunkChatSessionMessages(
  sessionTitle: string,
  messages: ChatMessageRecord[]
): string[] {
  if (!messages || messages.length === 0) return [];

  const chunks: string[] = [];
  const maxChunkChars = 1000;
  const prefix = `[Sesi Diskusi: "${sessionTitle || 'Percakapan'}"]\n`;

  // Kelompokkan menjadi pasangan dialog (User -> Assistant)
  let currentPair: { user?: string; assistant?: string } = {};

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const cleanContent = (msg.content || '').trim();
    if (!cleanContent) continue;

    if (msg.role === 'user') {
      // Jika sudah ada user sebelumnya tanpa assistant, simpan dulu
      if (currentPair.user && !currentPair.assistant) {
        chunks.push(`${prefix}User: ${currentPair.user}`);
      } else if (currentPair.user && currentPair.assistant) {
        // Simpan pasangan sebelumnya
        formatAndPushExchange(prefix, currentPair.user, currentPair.assistant, maxChunkChars, chunks);
      }
      currentPair = { user: cleanContent };
    } else if (msg.role === 'assistant') {
      currentPair.assistant = cleanContent;
      formatAndPushExchange(prefix, currentPair.user || '', currentPair.assistant, maxChunkChars, chunks);
      currentPair = {};
    }
  }

  // Sisa pesan user yang belum punya balasan
  if (currentPair.user && !currentPair.assistant) {
    chunks.push(`${prefix}User: ${currentPair.user}`);
  }

  return chunks;
}

function formatAndPushExchange(
  prefix: string,
  userText: string,
  assistantText: string,
  maxChars: number,
  output: string[]
) {
  const combined = `${prefix}User: ${userText}\nAssistant: ${assistantText}`;

  if (combined.length <= maxChars) {
    output.push(combined);
    return;
  }

  // Jika jawaban assistant sangat panjang, potong per bagian dengan tetap menyertakan pertanyaan user
  const assistantParagraphs = assistantText.split(/\n\n+/);
  let currentPart = '';

  for (const para of assistantParagraphs) {
    if ((currentPart + '\n\n' + para).length > maxChars && currentPart.trim()) {
      output.push(`${prefix}User: ${userText}\nAssistant (lanjutan): ${currentPart.trim()}`);
      currentPart = para;
    } else {
      currentPart = currentPart ? `${currentPart}\n\n${para}` : para;
    }
  }

  if (currentPart.trim()) {
    output.push(`${prefix}User: ${userText}\nAssistant: ${currentPart.trim()}`);
  }
}

export class ChatEmbeddingService {
  /**
   * Menghasilkan embedding untuk daftar teks menggunakan endpoint backend BGE-M3
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    const res = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    });

    if (!res.ok) {
      throw new Error(`Server embedding gagal dengan status ${res.status}`);
    }

    const result = await res.json();
    if (!result.success || !result.data?.embeddings) {
      throw new Error(result.error || 'Gagal menghasilkan vektor embedding');
    }

    return result.data.embeddings;
  }

  /**
   * Mengecek status apakah sesi chat ini sudah memiliki embedding di Supabase
   */
  static async getEmbeddingStatus(sessionId: string): Promise<ChatEmbeddingStatus> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        return { isEmbedded: false, chunkCount: 0 };
      }

      const { data, error, count } = await supabase
        .from('chat_embeddings')
        .select('id', { count: 'exact' })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[ChatEmbeddingService] Error checking status:', error);
        return { isEmbedded: false, chunkCount: 0 };
      }

      const total = count ?? (data?.length || 0);
      return {
        isEmbedded: total > 0,
        chunkCount: total
      };
    } catch (err) {
      console.warn('[ChatEmbeddingService] getEmbeddingStatus failed:', err);
      return { isEmbedded: false, chunkCount: 0 };
    }
  }

  /**
   * Mengambil status embedding untuk banyak sesi chat sekaligus (efisien untuk UI list)
   */
  static async getMultipleEmbeddingStatuses(sessionIds: string[]): Promise<Record<string, boolean>> {
    if (!sessionIds.length) return {};

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return {};

      const { data, error } = await supabase
        .from('chat_embeddings')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('user_id', userId);

      if (error || !data) return {};

      const map: Record<string, boolean> = {};
      for (const row of data) {
        map[row.session_id] = true;
      }
      return map;
    } catch {
      return {};
    }
  }

  /**
   * Mengindeks satu sesi chat terpilih ke dalam memori RAG (Supabase chat_embeddings)
   */
  static async indexChatSession(sessionId: string): Promise<{ success: boolean; chunkCount: number; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return { success: false, chunkCount: 0, error: 'Silakan login ke akun Supabase terlebih dahulu.' };
      }

      // 1. Ambil data sesi
      let chatSession: ChatSessionRecord | undefined = await db.chat_sessions.get(sessionId);
      if (!chatSession) {
        // Coba ambil dari cloud jika lokal belum ada
        const { data: cloudSession } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        if (cloudSession) {
          chatSession = cloudSession as ChatSessionRecord;
        }
      }

      const title = chatSession?.title || 'Sesi Chat';

      // 2. Ambil semua pesan dalam sesi ini
      const messages = await getSessionMessages(sessionId);
      if (!messages || messages.length === 0) {
        return { success: false, chunkCount: 0, error: 'Sesi chat ini belum memiliki pesan untuk diindeks.' };
      }

      // 3. Pecah pesan menjadi potongan kontekstual (chunks)
      const chunks = chunkChatSessionMessages(title, messages);
      if (!chunks || chunks.length === 0) {
        return { success: false, chunkCount: 0, error: 'Tidak ada konten pesan yang valid untuk di-vektorisasi.' };
      }

      // 4. Hapus embedding lama untuk sesi ini terlebih dahulu agar bersih dan tidak duplikat
      await this.deleteChatEmbeddings(sessionId);

      // 5. Generate vektor BGE-M3 (1024-dimensi)
      const vectors = await this.generateEmbeddings(chunks);

      // 6. Siapkan payload dan insert ke tabel chat_embeddings di Supabase
      const records = chunks.map((chunkText, idx) => ({
        id: crypto.randomUUID(),
        session_id: sessionId,
        chunk_index: idx,
        content: chunkText,
        embedding: vectors[idx],
        user_id: userId,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('chat_embeddings')
        .insert(records);

      if (insertError) {
        console.error('[ChatEmbeddingService] Gagal insert ke chat_embeddings:', insertError);
        return { success: false, chunkCount: 0, error: insertError.message };
      }

      return { success: true, chunkCount: records.length };
    } catch (err: any) {
      console.error('[ChatEmbeddingService] indexChatSession error:', err);
      return { success: false, chunkCount: 0, error: err.message || 'Terjadi kesalahan saat mengindeks sesi chat.' };
    }
  }

  /**
   * Menghapus embedding dari satu sesi chat dari memori RAG di Supabase
   */
  static async deleteChatEmbeddings(sessionId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return false;

      const { error } = await supabase
        .from('chat_embeddings')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[ChatEmbeddingService] Error deleting embeddings:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[ChatEmbeddingService] deleteChatEmbeddings exception:', err);
      return false;
    }
  }

  /**
   * Melakukan pencarian kemiripan semantik terhadap memori sesi-sesi chat yang sudah diindeks
   */
  static async searchSimilarChatChunks(
    query: string,
    topK: number = 3,
    minScore: number = 0.55
  ): Promise<ChatChunkResult[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return [];

      // 1. Generate query vector (BGE-M3 1024-dimensi)
      const queryVectors = await this.generateEmbeddings([query]);
      if (!queryVectors.length || !queryVectors[0]?.length) return [];

      const queryVector = queryVectors[0];

      // 2. Panggil RPC match_chat_embeddings di Supabase
      const { data, error } = await supabase.rpc('match_chat_embeddings', {
        query_embedding: queryVector,
        match_threshold: minScore,
        match_count: topK
      });

      if (error) {
        console.warn('[ChatEmbeddingService] match_chat_embeddings error:', error);
        return [];
      }

      if (!data || !Array.isArray(data)) return [];

      return data.map((item: any) => ({
        sessionId: item.sessionId || item.session_id,
        chunkIndex: item.chunkIndex ?? item.chunk_index ?? 0,
        content: item.content || '',
        similarity: typeof item.similarity === 'number' ? item.similarity : 0
      }));
    } catch (err) {
      console.warn('[ChatEmbeddingService] searchSimilarChatChunks failed:', err);
      return [];
    }
  }
}
