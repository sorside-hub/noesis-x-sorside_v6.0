import { supabase } from '../../../lib/supabase';
import { EmbeddingRecord } from '../types/models';

export class SupabaseVectorStore {
  /**
   * Adds new embeddings to Supabase
   */
  async add(records: EmbeddingRecord[]): Promise<void> {
    if (!records || records.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('[SupabaseVectorStore] User not logged in, cannot save vectors.');
      return;
    }

    const payloads = records.map(r => ({
      id: r.id,
      note_id: r.noteId,
      chunk_index: r.chunkIndex,
      source_type: r.sourceType,
      content: r.content,
      embedding: r.embedding, // Must be passed as array of numbers
      user_id: userId,
      created_at: new Date(r.createdAt).toISOString()
    }));

    const { error } = await supabase.from('note_embeddings').insert(payloads);
    if (error) {
      console.warn('[SupabaseVectorStore] Error inserting embeddings:', error);
      throw error;
    }
  }

  /**
   * Deletes all embeddings for a given noteId
   */
  async deleteByNoteId(noteId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from('note_embeddings')
      .delete()
      .eq('note_id', noteId)
      .eq('user_id', userId);
      
    if (error) {
      console.warn('[SupabaseVectorStore] Error deleting embeddings:', error);
      throw error;
    }
  }

  /**
   * Performs vector similarity search via RPC
   */
  async search(queryVector: number[], topK: number = 5): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.warn('[SupabaseVectorStore] User not logged in, cannot search vectors.');
      return [];
    }

    // Call Supabase RPC function (we need to create this in SQL)
    const { data, error } = await supabase.rpc('match_note_embeddings', {
      query_embedding: queryVector,
      match_threshold: 0.1,
      match_count: topK
    });

    if (error) {
      console.warn('[SupabaseVectorStore] Error searching embeddings:', error);
      return [];
    }

    return data || [];
  }
}
