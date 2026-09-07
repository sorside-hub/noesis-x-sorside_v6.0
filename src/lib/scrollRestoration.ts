/**
 * In-memory & session storage cache for per-note and per-view scroll positions.
 * This enables instant scroll restoration when switching between notes or switching tabs/views.
 */

const scrollCache = new Map<string, number>();
const SESSION_STORAGE_PREFIX = 'noesis_scroll_pos_';

export const saveNoteScrollPosition = (noteId: string, scrollTop: number): void => {
  if (!noteId) return;
  scrollCache.set(noteId, scrollTop);
  try {
    sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${noteId}`, scrollTop.toString());
  } catch {
    // Ignore storage quota or disabled errors
  }
};

export const getNoteScrollPosition = (noteId: string): number => {
  if (!noteId) return 0;
  
  if (scrollCache.has(noteId)) {
    return scrollCache.get(noteId) || 0;
  }

  try {
    const saved = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${noteId}`);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) {
        scrollCache.set(noteId, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  return 0;
};
