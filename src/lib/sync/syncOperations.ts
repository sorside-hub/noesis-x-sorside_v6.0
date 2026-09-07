import { supabase } from '../supabase';
import { db } from '../db';
import { FileNode } from '../../types/vault';
import { getUserId, toIsoString, toTimestamp, markNodeAsDeleted } from './syncHelpers';

export interface SyncSummary {
  nodesCount: number;
  sessionsCount: number;
  messagesCount: number;
}

// Full Sync: Pull down all nodes and chats from Cloud to IndexedDB
export const syncPullFromCloud = async (): Promise<SyncSummary> => {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('User tidak terautentikasi');

    let nodesCount = 0;
    let sessionsCount = 0;
    let messagesCount = 0;

    // Pull Nodes
    const { data: cloudNodes, error: nodeError } = await supabase
      .from('nodes')
      .select('*')
      .eq('user_id', userId);
    if (nodeError) throw nodeError;
    if (cloudNodes) {
      const localNodesInDb = await db.nodes.toArray();

      // Check for System Bookmark Groups
      const systemBookmarkNode = cloudNodes.find((n) => n.id === '__system_bookmark_groups__');
      if (systemBookmarkNode) {
        try {
          const groups = systemBookmarkNode.metadata?.groups || (systemBookmarkNode.content ? JSON.parse(systemBookmarkNode.content) : []);
          if (Array.isArray(groups)) {
            await db.settings.put({ key: 'bookmarkGroups', value: JSON.stringify(groups) });
            localStorage.setItem('noesis_vault_bookmark_groups', JSON.stringify(groups));
            window.dispatchEvent(new CustomEvent('bookmark-groups-updated', { detail: groups }));
          }
        } catch (e) {
          console.warn('Failed to restore cloud bookmark groups:', e);
        }
      }

      // Filter out system nodes from user file/folder nodes table
      const userCloudNodes = cloudNodes.filter((n) => n.id !== '__system_bookmark_groups__');
      nodesCount = userCloudNodes.length;
      const cloudNodeIdSet = new Set(userCloudNodes.map((n) => n.id));

      const localNodes: FileNode[] = userCloudNodes.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type as 'file' | 'folder',
        parentId: node.parentId,
        content: node.content || undefined,
        metadata: node.metadata || undefined,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      }));

      if (localNodes.length > 0) {
        await db.nodes.bulkPut(localNodes);
      }

      // Reconcile: delete local nodes that no longer exist in cloud
      const deletedNodeIds: string[] = [];
      for (const localNode of localNodesInDb) {
        if (!cloudNodeIdSet.has(localNode.id)) {
          markNodeAsDeleted(localNode.id);
          await db.nodes.delete(localNode.id);
          deletedNodeIds.push(localNode.id);
        }
      }

      // Smart Ghost Tab Cleanup: prune any reconciled deleted nodes from openTabs
      if (deletedNodeIds.length > 0) {
        try {
          const openTabsSetting = await db.settings.get('openTabs');
          let tabs: string[] = [];
          if (openTabsSetting?.value) {
            try {
              tabs = JSON.parse(openTabsSetting.value);
            } catch (e) {
              tabs = [];
            }
          }
          const newTabs = tabs.filter((t) => !deletedNodeIds.includes(t));
          if (newTabs.length !== tabs.length) {
            await db.settings.put({ key: 'openTabs', value: JSON.stringify(newTabs) });
          }

          const activeSetting = await db.settings.get('activeTabId');
          if (activeSetting?.value && deletedNodeIds.includes(activeSetting.value)) {
            const nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
            await db.settings.put({ key: 'activeTabId', value: nextActive });
          }
        } catch (err) {
          console.warn('Failed to prune openTabs during reconcile:', err);
        }
      }
    }

    // Pull Chat Sessions
    const { data: cloudSessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId);
    if (sessionError) throw sessionError;
    if (cloudSessions) {
      sessionsCount = cloudSessions.length;
      const cloudSessionIdSet = new Set(cloudSessions.map((s) => s.id));
      const localSessionsInDb = await db.chat_sessions.toArray();

      const localSessions = cloudSessions.map((s) => ({
        id: s.id,
        title: s.title,
        isPinned: s.isPinned,
        memorySummary: s.memorySummary || undefined,
        createdAt: toIsoString(s.createdAt),
        updatedAt: toIsoString(s.updatedAt),
      }));

      if (localSessions.length > 0) {
        await db.chat_sessions.bulkPut(localSessions as any);
      }

      // Reconcile: delete local chat_sessions that no longer exist in cloud
      for (const localSession of localSessionsInDb) {
        if (!cloudSessionIdSet.has(localSession.id)) {
          await db.chat_sessions.delete(localSession.id);
        }
      }
    }

    // Pull Chat Messages
    const { data: cloudMessages, error: messageError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId);
    if (messageError) throw messageError;
    if (cloudMessages) {
      messagesCount = cloudMessages.length;
      const cloudMessageIdSet = new Set(cloudMessages.map((m) => m.id));

      const existingMessages = await db.chat_messages.toArray();
      const existingMap = new Map();
      existingMessages.forEach((m) => existingMap.set(m.id, m.cascadeLog));

      const localMessages = cloudMessages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        sources: m.sources || undefined,
        chunks: m.chunks || undefined,
        createdAt: toIsoString(m.createdAt),
        cascadeLog: existingMap.get(m.id),
      }));

      if (localMessages.length > 0) {
        await db.chat_messages.bulkPut(localMessages as any);
      }

      // Reconcile: delete local chat_messages that no longer exist in cloud
      for (const existingMsg of existingMessages) {
        if (!cloudMessageIdSet.has(existingMsg.id)) {
          await db.chat_messages.delete(existingMsg.id);
        }
      }
    }

    // Notify UI components
    window.dispatchEvent(new Event('vault-updated'));
    window.dispatchEvent(new Event('chat-updated'));

    

    // Pull Media Attachments
    const { data: cloudMedia, error: mediaError } = await supabase
      .from('media_attachments')
      .select('*')
      .eq('user_id', userId);
    
    if (mediaError) {
      console.warn('Skipping media_attachments sync (table might not exist yet):', mediaError);
    } else if (cloudMedia) {
      const localMedia = await db.media_attachments.toArray();
      const localMapByUrl = new Map(localMedia.map(m => [m.url, m]));
      const localMapById = new Map(localMedia.map(m => [m.id, m]));

      const cloudSetById = new Set(cloudMedia.map(m => m.id));
      const cloudSetByUrl = new Set(cloudMedia.map(m => m.url));

      // 1. Update/Add items that exist in cloud
      const formattedMedia = cloudMedia.map(m => {
        const local = localMapById.get(m.id) || localMapByUrl.get(m.url);
        let deletedAt = m.deleted_at ? new Date(m.deleted_at).getTime() : undefined;
        // If locally trashed, keep it trashed unless cloud explicitly restored it
        if (!deletedAt && local?.deletedAt) {
          deletedAt = local.deletedAt;
          // Sync back to cloud in background
          Promise.resolve(
            supabase
              .from('media_attachments')
              .update({ deleted_at: new Date(local.deletedAt).toISOString() })
              .match({ id: m.id, user_id: userId })
          ).catch(() => {});
        }

        return {
          id: m.id,
          title: m.title || local?.title || 'Lampiran',
          url: m.url,
          type: m.type || local?.type || 'document',
          createdAt: m.created_at || local?.createdAt || new Date().toISOString(),
          deletedAt,
        };
      });

      if (formattedMedia.length > 0) {
        await db.media_attachments.bulkPut(formattedMedia);
      }

      // 2. Delete local items that no longer exist in Supabase
      for (const localItem of localMedia) {
        if (!cloudSetById.has(localItem.id) && !cloudSetByUrl.has(localItem.url)) {
          await db.media_attachments.delete(localItem.id);
        }
      }

      window.dispatchEvent(new Event('media-updated'));
    }

    return { nodesCount, sessionsCount, messagesCount };
  } catch (err) {
    console.warn('Failed to pull from cloud:', err);
    throw err;
  }
};

// Full Sync: Push all IndexedDB nodes and chats up to Cloud
export const syncPushAllToCloud = async (): Promise<SyncSummary> => {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('User tidak terautentikasi');

    let nodesCount = 0;
    let sessionsCount = 0;
    let messagesCount = 0;

    // Push Nodes
    const allLocalNodes = await db.nodes.toArray();
    const cloudPayloads: any[] = allLocalNodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: node.parentId,
      content: node.content || null,
      metadata: node.metadata || null,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      user_id: userId,
    }));

    // Also push System Bookmark Groups if available
    try {
      const groupsRec = await db.settings.get('bookmarkGroups');
      let groups: any[] = [];
      if (groupsRec?.value) {
        groups = typeof groupsRec.value === 'string' ? JSON.parse(groupsRec.value) : groupsRec.value;
      } else {
        const saved = localStorage.getItem('noesis_vault_bookmark_groups');
        if (saved) groups = JSON.parse(saved);
      }
      if (Array.isArray(groups)) {
        cloudPayloads.push({
          id: '__system_bookmark_groups__',
          name: 'Bookmark Groups',
          type: 'system',
          parentId: '__system__',
          content: JSON.stringify(groups),
          metadata: { groups } as any,
          createdAt: 0 as any,
          updatedAt: Date.now() as any,
          user_id: userId,
        });
      }
    } catch (e) {
      console.warn('Failed to prepare bookmark groups for cloud push:', e);
    }

    if (cloudPayloads.length > 0) {
      nodesCount = allLocalNodes.length;
      const { error } = await supabase.from('nodes').upsert(cloudPayloads);
      if (error) throw error;
    }

    // Push Chat Sessions
    const allSessions = await db.chat_sessions.toArray();
    if (allSessions.length > 0) {
      sessionsCount = allSessions.length;
      const cloudSessions = allSessions.map((s) => ({
        id: s.id,
        title: s.title || 'Untitled Chat',
        isPinned: Boolean(s.isPinned),
        memorySummary: s.memorySummary || null,
        createdAt: toTimestamp(s.createdAt),
        updatedAt: toTimestamp(s.updatedAt),
        user_id: userId,
      }));
      const { error } = await supabase.from('chat_sessions').upsert(cloudSessions);
      if (error) throw error;
    }

    // Push Chat Messages
    const allMessages = await db.chat_messages.toArray();
    if (allMessages.length > 0) {
      messagesCount = allMessages.length;
      const cloudMessages = allMessages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content || '',
        sources: m.sources || null,
        chunks: m.chunks || null,
        createdAt: toTimestamp(m.createdAt),
        user_id: userId,
      }));
      const { error } = await supabase.from('chat_messages').upsert(cloudMessages);
      if (error) throw error;
    }

    // Push Media Attachments
    const allMedia = await db.media_attachments.toArray();
    if (allMedia.length > 0) {
      const cloudMedia = allMedia.map(m => ({
        id: m.id,
        title: m.title,
        url: m.url,
        type: m.type,
        created_at: m.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: m.deletedAt ? new Date(m.deletedAt).toISOString() : null,
        user_id: userId
      }));
      const { error } = await supabase.from('media_attachments').upsert(cloudMedia);
      if (error && error.code !== 'PGRST205') {
        console.warn('Failed to push media attachments to cloud:', error);
      }
    }

    return { nodesCount, sessionsCount, messagesCount };
  } catch (err) {
    console.warn('Failed to push all to cloud:', err);
    throw err;
  }
};
