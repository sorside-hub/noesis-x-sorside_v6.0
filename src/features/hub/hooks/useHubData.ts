import { useState, useEffect, useMemo } from 'react';
import { supabase, getSupabaseConfig } from '../../../lib/supabase';
import { EnrichedNoteItem } from '../types';
import { VaultData } from '../../../types/vault';
import { getLocalAiMetadataMap, syncLocalAiMetadata } from '../../../lib/db';
import { extractNodeTags } from '../../workspace/utils/tagUtils';

export function useHubData(vault: VaultData | null) {
  const [aiMetadata, setAiMetadata] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch AI metadata from Supabase
  useEffect(() => {
    async function fetchMetadata() {
      setIsLoading(true);

      // 1. Immediate read from IndexedDB for zero-latency UI load
      try {
        const cachedMap = await getLocalAiMetadataMap();
        if (cachedMap && Object.keys(cachedMap).length > 0) {
          setAiMetadata(cachedMap);
          setIsLoading(false); // We have local data, so we can stop showing the spinner
        }
      } catch (err) {
        console.warn('[useHubData] Failed to load local IndexedDB cache:', err);
      }

      // 2. Background sync with Supabase
      if (!getSupabaseConfig().isConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const userId = sessionRes?.data?.session?.user?.id;
        
        // Fetch note_metadata (from Supabase)
        let query = supabase.from('note_metadata').select('*');
        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
          if (error.code !== 'PGRST116') {
            console.warn('[useHubData] Note metadata not fetched:', error.message || error);
          }
        } else if (data) {
          // Sync with IndexedDB (Reconcile: insert/update existing, purge deleted)
          const syncedMap = await syncLocalAiMetadata(data);
          setAiMetadata(syncedMap);
        }
      } catch (err: any) {
        // Handle fetch errors (e.g. offline, connection refused, placeholder endpoint)
        console.warn('[useHubData] Could not fetch AI metadata:', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetadata();
  }, [vault?.nodes]); // Refetch if vault nodes change significantly (could be optimized later)

  // Merge vault nodes with AI metadata
  const enrichedNotes = useMemo(() => {
    if (!vault) return [];

    const notes = Object.values(vault.nodes).filter(node => node.type === 'file');
    return notes.map(node => {
      const meta = aiMetadata[node.id] || {};
      const allNoteTags = extractNodeTags(node);
      
      const properties: Record<string, any> = {
        title: node.name || 'Untitled',
      };

      // 1. Core metadata
      if (node.metadata) {
        if (node.metadata.noteType) properties['type'] = node.metadata.noteType;
        if (node.metadata.status) properties['status'] = node.metadata.status;
        if (allNoteTags.length > 0) properties['tags'] = allNoteTags;
        if (node.metadata.aliases && node.metadata.aliases.length > 0) properties['aliases'] = node.metadata.aliases;

        // 2. Unpack Custom Properties
        if (Array.isArray(node.metadata.customProperties)) {
          node.metadata.customProperties.forEach((cp: any) => {
            if (cp && cp.key && typeof cp.key === 'string' && cp.key.trim()) {
              properties[cp.key.trim()] = cp.value;
            }
          });
        }

        // 3. Other metadata keys (exclude raw customProperties array and known core keys)
        Object.keys(node.metadata).forEach(k => {
          if (!['customProperties', 'noteType', 'status', 'tags', 'aliases'].includes(k)) {
            properties[k] = (node.metadata as any)[k];
          }
        });
      } else if (allNoteTags.length > 0) {
        properties['tags'] = allNoteTags;
      }

      // 4. AI Metadata
      if (meta) {
        if (meta.summary) properties['summary'] = meta.summary;
        if (meta.keywords && meta.keywords.length > 0) properties['keywords'] = meta.keywords;
        if (meta.concepts && meta.concepts.length > 0) properties['concepts'] = meta.concepts;
        if (meta.emotion) properties['emotion'] = meta.emotion;
      }
      
      const item: EnrichedNoteItem = {
        id: node.id,
        node,
        title: node.name || 'Untitled',
        type: node.metadata?.noteType || '',
        status: node.metadata?.status || '',
        tags: allNoteTags,
        aliases: node.metadata?.aliases || [],
        summary: meta.summary,
        keywords: meta.keywords || [],
        concepts: meta.concepts || [],
        emotion: meta.emotion,
        properties,
        createdAt: node.createdAt,
        updatedAt: Math.max(
          node.updatedAt, 
          meta.updated_at ? new Date(meta.updated_at).getTime() : 0
        )
      };
      return item;
    });
  }, [vault, aiMetadata]);

  return {
    notes: enrichedNotes,
    isLoading
  };
}
