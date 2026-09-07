import { ActiveTab } from '../../components/navigation/BottomNavPill';

export interface NavigationHistoryEntry {
  view: ActiveTab;
  activeTabId: string | null;
  isMobileSidebarOpen: boolean;
  isMobileRightSidebarOpen: boolean;
  activeModal: string | null;
  mediaCategory?: string | null;
  seq: number;
}

// Safe wrapper for history pushState / replaceState / back
export const safePushState = (entry: NavigationHistoryEntry) => {
  try {
    if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') {
      window.history.pushState(entry, '', window.location.href);
    }
  } catch (err) {
    console.warn('History pushState restricted in current frame environment:', err);
  }
};

export const safeReplaceState = (entry: NavigationHistoryEntry) => {
  try {
    if (typeof window !== 'undefined' && window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(entry, '', window.location.href);
    }
  } catch (err) {
    console.warn('History replaceState restricted in current frame environment:', err);
  }
};

export const safeHistoryBack = () => {
  try {
    if (typeof window !== 'undefined' && window.history && typeof window.history.back === 'function') {
      window.history.back();
    }
  } catch (err) {
    console.warn('History back restricted in current frame environment:', err);
  }
};
