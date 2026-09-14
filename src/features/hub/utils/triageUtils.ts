import { EnrichedNoteItem } from '../types';

export type TriageCategory = 'Inbox' | 'Refine' | 'Keeper';

/**
 * Classify whether a note belongs in the Inbox Triage system,
 * and if so, which column it belongs to:
 * - 'Inbox'  : Unsorted raw captures
 * - 'Refine' : Notes needing polish or further elaboration
 * - 'Keeper' : Mature/valuable notes ready for vault storage
 * - null     : Notes that have graduated or have explicit non-inbox statuses
 *              (e.g., 'Idea', 'Draft', 'In Progress', 'Completed', 'Archived', etc.)
 */
export function classifyNoteTriageStatus(
  note: { status?: string; node: { parentId?: string | null } },
  inboxFolderId: string | null
): TriageCategory | null {
  const rawStatus = (note.status || '').trim();
  const st = rawStatus.toLowerCase();

  // 1. Explicit post-inbox or outside workflow statuses MUST NEVER be in triage:
  // Especially 'Idea', 'Draft', 'In Progress', 'Active', 'Completed', 'Archived', 'Todo', 'Done'
  const nonInboxStatuses = [
    'idea',
    'draft',
    'in progress',
    'active',
    'completed',
    'archived',
    'archive',
    'todo',
    'done'
  ];
  if (nonInboxStatuses.includes(st)) {
    return null;
  }

  // 2. Check Keeper column
  // Statuses: 'Keeper', 'Inbox (Keeper)', 'inbox/keeper', 'inbox - keeper', or starts with 'keeper'
  if (
    st === 'keeper' ||
    st === 'inbox (keeper)' ||
    st === 'inbox/keeper' ||
    st === 'inbox - keeper' ||
    st.startsWith('keeper')
  ) {
    return 'Keeper';
  }

  // 3. Check Refine column
  // Statuses: 'Refine', 'Inbox (Refine)', 'inbox/refine', 'inbox - refine', or starts with 'refine'
  if (
    st === 'refine' ||
    st === 'inbox (refine)' ||
    st === 'inbox/refine' ||
    st === 'inbox - refine' ||
    st.startsWith('refine')
  ) {
    return 'Refine';
  }

  // 4. Check Inbox column
  // Statuses: 'Inbox', 'Inbox (Unsorted)', 'unsorted', 'inbox/unsorted'
  if (
    st === 'inbox' ||
    st === 'inbox (unsorted)' ||
    st === 'unsorted' ||
    st === 'inbox/unsorted'
  ) {
    return 'Inbox';
  }

  // 5. If note has no status defined:
  // Only consider it an 'Inbox' note if it is located inside the Inbox folder
  if (!rawStatus && inboxFolderId && note.node.parentId === inboxFolderId) {
    return 'Inbox';
  }

  // Any other status does not belong in triage
  return null;
}
