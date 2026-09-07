import { supabase } from '../../../lib/supabase';
import { AIAnalysisRecord } from '../types/models';

export class SupabaseMetadataStore {
  async put(record: AIAnalysisRecord): Promise<void> {
    const payload = {
      note_id: record.noteId,
      content_hash: record.contentHash,
      summary: record.summary,
      keywords: record.keywords,
      concepts: record.concepts,
      emotion: record.emotion,
      user_id: '',
      updated_at: new Date(record.updatedAt).toISOString()
    };
    
    // 1. Selalu simpan ke IndexedDB lokal (ai_metadata) beserta cascadeLog
    try {
      const { db } = await import('../../../lib/db');
      await db.ai_metadata.put({
        ...payload,
        cascadeLog: record.cascadeLog
      });
    } catch (err) {
      console.warn('[SupabaseMetadataStore] Failed to save local ai_metadata:', err);
    }

    // 2. Sinkronkan ke Supabase jika user sedang login
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        payload.user_id = userId;
        const { error } = await supabase
          .from('note_metadata')
          .upsert(payload, { onConflict: 'note_id' });

        if (error) {
          console.warn('[SupabaseMetadataStore] Error upserting metadata:', error);
        }
      }
    } catch (err) {
      console.warn('[SupabaseMetadataStore] Supabase remote sync skipped or failed:', err);
    }
  }

  async get(noteId: string): Promise<AIAnalysisRecord | null> {
    // 1. Cek IndexedDB lokal terlebih dahulu (cepat & selalu tersedia offline/online)
    let localRecord: any = null;
    try {
      const { db } = await import('../../../lib/db');
      localRecord = await db.ai_metadata.get(noteId);
    } catch (err) {}

    // 2. Cek Supabase jika user sedang login
    let remoteData: any = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const { data, error } = await supabase
          .from('note_metadata')
          .select('*')
          .eq('note_id', noteId)
          .eq('user_id', userId)
          .single();

        if (data && !error) {
          remoteData = data;
        }
      }
    } catch (err) {}

    const sourceData = remoteData || localRecord;
    if (!sourceData) return null;

    return {
      noteId: sourceData.note_id || sourceData.noteId || noteId,
      contentHash: sourceData.content_hash || sourceData.contentHash,
      summary: sourceData.summary,
      keywords: sourceData.keywords || [],
      concepts: sourceData.concepts || [],
      emotion: sourceData.emotion || 'Neutral',
      modelUsed: sourceData.modelUsed || '',
      cascadeLog: localRecord?.cascadeLog || sourceData.cascadeLog || [],
      createdAt: new Date(sourceData.created_at || sourceData.createdAt || Date.now()).getTime(),
      updatedAt: new Date(sourceData.updated_at || sourceData.updatedAt || Date.now()).getTime()
    };
  }

  async delete(noteId: string): Promise<void> {
    // 1. Hapus dari IndexedDB lokal
    try {
      const { db } = await import('../../../lib/db');
      await db.ai_metadata.delete(noteId);
    } catch (err) {
      console.warn('[SupabaseMetadataStore] Failed to delete local ai_metadata:', err);
    }

    // 2. Hapus dari Supabase jika ada sesi
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const { error } = await supabase
          .from('note_metadata')
          .delete()
          .eq('note_id', noteId)
          .eq('user_id', userId);

        if (error) {
          console.warn('[SupabaseMetadataStore] Error deleting metadata from Supabase:', error);
        }
      }
    } catch (err) {}
  }
}
