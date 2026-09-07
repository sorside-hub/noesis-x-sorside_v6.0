import { supabase, getSupabaseConfig } from '../supabase';

// Get current user ID silently
export const getUserId = async (): Promise<string | null> => {
  if (!getSupabaseConfig().isConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (err) {
    return null;
  }
};

// Helper to safely convert to ISO string
export const toIsoString = (val: any) => {
  if (typeof val === 'number') return new Date(val).toISOString();
  if (val instanceof Date) return val.toISOString();
  return val;
};

// Helper to safely convert to timestamp number
export const toTimestamp = (val: any) => {
  if (typeof val === 'string') return new Date(val).getTime();
  if (val instanceof Date) return val.getTime();
  return val;
};

// Global push debounce timers map
export const pushDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

// Helper to cancel any pending push for a given node ID
export const cancelPushDebounceTimer = (nodeId: string) => {
  if (pushDebounceTimers.has(nodeId)) {
    clearTimeout(pushDebounceTimers.get(nodeId)!);
    pushDebounceTimers.delete(nodeId);
  }
};

// In-memory set of recently deleted node IDs to prevent "Zombie Resurrect" race conditions
const recentlyDeletedIds = new Set<string>();

export const markNodeAsDeleted = (id: string) => {
  recentlyDeletedIds.add(id);
  cancelPushDebounceTimer(id);
  // Keep tombstone in memory for 60 seconds to absorb delayed autosaves / blur / debounce events
  setTimeout(() => {
    recentlyDeletedIds.delete(id);
  }, 60000);
};

export const isNodeRecentlyDeleted = (id: string): boolean => {
  return recentlyDeletedIds.has(id);
};
