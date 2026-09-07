import Dexie, { Table } from 'dexie';
import { FileNode } from '../types/vault';
import { AIAnalysisRecord, EmbeddingRecord } from '../features/rag/types/models';

export interface AppSetting {
  key: string;
  value: any;
}

export interface ChatSessionRecord {
  id: string;
  title: string;
  isPinned?: boolean;
  memorySummary?: string;
  lastSummarizedMsgCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAttachment {
  id: string;
  title: string;
  url: string;
  type: string;
  createdAt: string;
  deletedAt?: number;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ noteId: string; noteTitle: string }>;
  chunks?: Array<{ noteId: string; noteTitle: string; snippet: string }>;
  cascadeLog?: any[]; // In-memory during active session, not persisted to DB
  createdAt: string;
}

export class NoesisDB extends Dexie {
  nodes!: Table<FileNode, string>;
  settings!: Table<AppSetting, string>;
  chat_sessions!: Table<ChatSessionRecord, string>;
  chat_messages!: Table<ChatMessageRecord, string>;
  ai_metadata!: Table<any, string>;
  media_attachments!: Table<MediaAttachment, string>;

  constructor() {
    super('NoesisDatabase');
    
    this.version(1).stores({
      nodes: 'id, parentId, type, updatedAt, createdAt',
      settings: 'key'
    });

    // V2: Legacy RAG tables (now removed from DB class, setting to null drops them)
    this.version(2).stores({
      ai_analysis: 'noteId', 
      embeddings: 'id, noteId, sourceType' 
    });

    // V3: Add Chat Session & Message tables
    this.version(3).stores({
      chat_sessions: 'id, updatedAt, createdAt',
      chat_messages: 'id, sessionId, createdAt'
    });

    // V4: Clean up unused AI tables from IndexedDB (they are now exclusive to Supabase)
    this.version(4).stores({
      ai_analysis: null,
      embeddings: null
    });

    // V5: Add ai_metadata cache for Hub Data
    this.version(5).stores({
      ai_metadata: 'note_id'
    });

    // V6: Media Attachments
    this.version(6).stores({
      media_attachments: 'id, url, createdAt'
    });

    // V7: Index type and deletedAt for Media Attachments
    this.version(7).stores({
      media_attachments: 'id, url, type, createdAt, deletedAt'
    });
  }
}

export const db = new NoesisDB();

// AI Metadata IndexedDB Helper Functions
export async function getLocalAiMetadataMap(): Promise<Record<string, any>> {
  try {
    const items = await db.ai_metadata.toArray();
    const map: Record<string, any> = {};
    items.forEach((item) => {
      if (item.note_id) {
        map[item.note_id] = item;
      }
    });
    return map;
  } catch (error) {
    console.warn('[DB] Failed to get local ai_metadata', error);
    return {};
  }
}

export async function syncLocalAiMetadata(remoteMetadataList: any[]): Promise<Record<string, any>> {
  const resultMap: Record<string, any> = {};
  try {
    await db.transaction('rw', db.ai_metadata, async () => {
      // Preserve existing cascadeLog locally
      const existingItems = await db.ai_metadata.toArray();
      const existingMap = new Map();
      existingItems.forEach(item => {
        if (item.note_id && item.cascadeLog) {
          existingMap.set(item.note_id, item.cascadeLog);
        }
      });

      await db.ai_metadata.clear();
      
      if (remoteMetadataList && remoteMetadataList.length > 0) {
        const toAdd = remoteMetadataList.filter(item => item.note_id).map(item => ({
          ...item,
          cascadeLog: existingMap.get(item.note_id) || item.cascadeLog
        }));
        await db.ai_metadata.bulkPut(toAdd);
        
        toAdd.forEach((item) => {
          resultMap[item.note_id] = item;
        });
      }
    });
  } catch (error) {
    console.warn('[DB] Failed to sync local ai_metadata', error);
    // Even if local DB fails, we still return the map so UI can render
    remoteMetadataList.forEach((item) => {
      if (item.note_id) {
        resultMap[item.note_id] = item;
      }
    });
  }
  return resultMap;
}
