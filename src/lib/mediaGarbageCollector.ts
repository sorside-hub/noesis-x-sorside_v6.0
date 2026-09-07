import { db } from './db';
import { deleteMediaByUrl } from './mediaStorage';

const QUEUE_KEY = 'noesis_media_delete_queue';
// Wait 10 minutes before permanently deleting (allows safe undo across sessions)
const DELETE_DELAY_MS = 10 * 60 * 1000; 

interface QueuedItem {
  url: string;
  queuedAt: number;
}

export const mediaGC = {
  getQueue(): QueuedItem[] {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQueue(queue: QueuedItem[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  markForDeletion(url: string) {
    if (!url || !url.startsWith('http')) return;
    const queue = this.getQueue();
    if (!queue.find(q => q.url === url)) {
      queue.push({ url, queuedAt: Date.now() });
      this.saveQueue(queue);
    }
  },

  unmarkForDeletion(url: string) {
    const queue = this.getQueue();
    const newQueue = queue.filter(q => q.url !== url);
    if (newQueue.length !== queue.length) {
      this.saveQueue(newQueue);
    }
  },

  async processQueue() {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const now = Date.now();
    const itemsToProcess = queue.filter(q => (now - q.queuedAt) > DELETE_DELAY_MS);
    
    if (itemsToProcess.length === 0) return;

    try {
      // Get all notes content from local DB
      const notes = await db.nodes.where('type').equals('file').toArray();
      const allContent = notes.map(n => n.content || '').join('\n');

      for (const item of itemsToProcess) {
        // If the URL is somehow still in any note's content, 
        // it means it was restored (e.g. by undo after app restart, or sync).
        // So we abort deletion for this item.
        if (allContent.includes(item.url)) {
          this.unmarkForDeletion(item.url);
          continue;
        }

        // True orphan, safe to delete from Supabase
        const deleted = await deleteMediaByUrl(item.url);
        if (deleted) {
          this.unmarkForDeletion(item.url);
          
          // Also delete from local db media_attachments and supabase
          const attached = await db.media_attachments.where('url').equals(item.url).first();
          if (attached) {
            await db.media_attachments.delete(attached.id);
            const { supabase } = await import('./supabase');
            const { error } = await supabase.from('media_attachments').delete().match({ id: attached.id });
            if (error && error.code === 'PGRST205') {
              console.warn('Skipping media_attachments delete (table does not exist in Supabase yet).');
            }
          }
        }
      }
    } catch (error) {
      console.error('[Media GC] Error processing queue:', error);
    }
  },
  async emptyOldTrash() {
    try {
      const TRASH_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
      const now = Date.now();
      
      // Find all media items in trash
      const allMedia = await db.media_attachments.toArray();
      const expiredTrash = allMedia.filter(m => m.deletedAt && (now - m.deletedAt) > TRASH_RETENTION_MS);
      
      if (expiredTrash.length === 0) return;
      
      console.log(`[Media GC] Found ${expiredTrash.length} expired items in trash, deleting permanently...`);
      
      const { deleteMediaAttachment } = await import('./mediaStorage');
      await Promise.all(expiredTrash.map(m => deleteMediaAttachment(m.id, m.url)));
      
    } catch (error) {
      console.error('[Media GC] Error emptying old trash:', error);
    }
  }
};
