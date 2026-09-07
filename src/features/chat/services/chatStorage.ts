import { db, ChatSessionRecord, ChatMessageRecord } from '../../../lib/db';
import { 
  pushChatSessionToCloud, 
  pushChatMessageToCloud, 
  deleteChatSessionFromCloud, 
  deleteChatMessagesFromCloud 
} from '../../../lib/cloudSync';

export async function getAllChatSessions(): Promise<ChatSessionRecord[]> {
  try {
    const sessions = await db.chat_sessions.orderBy('updatedAt').reverse().toArray();
    return sessions;
  } catch (err) {
    console.error('Failed to get chat sessions:', err);
    return [];
  }
}

export async function createChatSession(title: string = 'Percakapan Baru'): Promise<ChatSessionRecord> {
  const now = new Date().toISOString();
  const session: ChatSessionRecord = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    createdAt: now,
    updatedAt: now,
  };
  await db.chat_sessions.add(session);
  pushChatSessionToCloud(session).catch(console.error);
  return session;
}

export async function renameChatSession(sessionId: string, newTitle: string): Promise<void> {
  const now = new Date().toISOString();
  await db.chat_sessions.update(sessionId, {
    title: newTitle,
    updatedAt: now,
  });
  const updated = await db.chat_sessions.get(sessionId);
  if (updated) {
    pushChatSessionToCloud(updated).catch(console.error);
  }
}

export async function updateSessionMemory(
  sessionId: string,
  memorySummary: string,
  lastSummarizedMsgCount?: number
): Promise<void> {
  const now = new Date().toISOString();
  const updateData: Partial<ChatSessionRecord> = {
    memorySummary,
    updatedAt: now,
  };
  if (typeof lastSummarizedMsgCount === 'number') {
    updateData.lastSummarizedMsgCount = lastSummarizedMsgCount;
  }
  await db.chat_sessions.update(sessionId, updateData);
  const updated = await db.chat_sessions.get(sessionId);
  if (updated) {
    pushChatSessionToCloud(updated).catch(console.error);
  }
}

export async function togglePinChatSession(sessionId: string, isPinned: boolean): Promise<void> {
  await db.chat_sessions.update(sessionId, {
    isPinned,
  });
  const updated = await db.chat_sessions.get(sessionId);
  if (updated) {
    pushChatSessionToCloud(updated).catch(console.error);
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await db.transaction('rw', [db.chat_sessions, db.chat_messages], async () => {
    await db.chat_sessions.delete(sessionId);
    await db.chat_messages.where('sessionId').equals(sessionId).delete();
  });
  deleteChatSessionFromCloud(sessionId).catch(console.error);
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessageRecord[]> {
  try {
    const rawMessages = await db.chat_messages
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    // Sort deterministically: by createdAt ascending, and if equal, 'user' before 'assistant'
    const sorted = rawMessages.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      // If timestamps match, user question must strictly come before assistant response
      if (a.role === 'user' && b.role !== 'user') return -1;
      if (a.role !== 'user' && b.role === 'user') return 1;
      return a.id.localeCompare(b.id);
    });

    return sorted;
  } catch (err) {
    console.error(`Failed to get messages for session ${sessionId}:`, err);
    return [];
  }
}

export async function saveChatMessage(msg: ChatMessageRecord): Promise<void> {
  const now = new Date().toISOString();
  await db.chat_messages.put(msg);
  await db.chat_sessions.update(msg.sessionId, {
    updatedAt: now,
  });
  
  const { cascadeLog, ...recordToSave } = msg;
  pushChatMessageToCloud(recordToSave).catch(console.error);
  const updatedSession = await db.chat_sessions.get(msg.sessionId);
  if (updatedSession) {
    pushChatSessionToCloud(updatedSession).catch(console.error);
  }
}

export async function deleteChatMessage(id: string): Promise<void> {
  await db.chat_messages.delete(id);
  deleteChatMessagesFromCloud([id]).catch(console.error);
}

export async function deleteChatMessages(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await db.chat_messages.bulkDelete(ids);
  deleteChatMessagesFromCloud(ids).catch(console.error);
}

export async function updateChatMessage(
  id: string,
  updates: Partial<ChatMessageRecord>
): Promise<void> {
  await db.chat_messages.update(id, updates);
  const updated = await db.chat_messages.get(id);
  if (updated) {
    const { cascadeLog, ...recordToSave } = updated;
    pushChatMessageToCloud(recordToSave).catch(console.error);
  }
}
