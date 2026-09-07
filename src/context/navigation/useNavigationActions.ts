import { useCallback } from 'react';
import { ActiveTab } from '../../components/navigation/BottomNavPill';
import { NavigationHistoryEntry, safePushState, safeHistoryBack } from './historyUtils';

interface UseNavigationActionsProps {
  view: ActiveTab;
  setView: React.Dispatch<React.SetStateAction<ActiveTab>>;
  activeTabId: string | null;
  onSelectTabId: (id: string | null) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileRightSidebarOpen: boolean;
  setIsMobileRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeModal: string | null;
  setActiveModal: React.Dispatch<React.SetStateAction<string | null>>;
  mediaCategory: string | null;
  setMediaCategory: React.Dispatch<React.SetStateAction<string | null>>;
  setIsDesktopSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPopStateNavigatingRef: React.MutableRefObject<boolean>;
  currentSeqRef: React.MutableRefObject<number>;
}

export const useNavigationActions = ({
  view,
  setView,
  activeTabId,
  onSelectTabId,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isMobileRightSidebarOpen,
  setIsMobileRightSidebarOpen,
  activeModal,
  setActiveModal,
  mediaCategory,
  setMediaCategory,
  setIsDesktopSidebarOpen,
  isPopStateNavigatingRef,
  currentSeqRef,
}: UseNavigationActionsProps) => {
  // Navigate between top-level views ('vault' <-> 'settings')
  const navigateView = useCallback(
    (newView: ActiveTab) => {
      // 1. If clicking the SAME tab that is currently active (e.g., clicking active SORSIDE or MEDIA again):
      if (newView === view) {
        // Reset SORSIDE to main list if already on SORSIDE
        if (newView === 'sorside') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('reset-sorside-view'));
          }
        }
        // Reset Media Category to main home if already on MEDIA
        else if (newView === 'media') {
          setMediaCategory(null);
        }

        setIsMobileSidebarOpen(false);
        setIsMobileRightSidebarOpen(false);
        setActiveModal(null);
        return;
      }

      // 2. If switching to a DIFFERENT tab (e.g., Vault -> Sorside or Sorside -> Vault -> Sorside):
      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: newView,
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: newView === 'media' ? mediaCategory : null,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView(newView);
      // Notice: setMediaCategory is NOT wiped here, and reset-sorside-view is NOT dispatched here.
      // This preserves exact state/editors when switching back and forth!
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, mediaCategory, setView, setMediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific media category
  const navigateToMediaCategory = useCallback(
    (category: string | null) => {
      const isSameCategory = category === mediaCategory && view === 'media';
      if (isSameCategory && !isMobileSidebarOpen && !isMobileRightSidebarOpen && !activeModal) {
        return;
      }

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'media',
          activeTabId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: category,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('media');
      setMediaCategory(category);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [mediaCategory, view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, setView, setMediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Navigate to a specific note
  const navigateToNote = useCallback(
    (newNoteId: string | null) => {
      const isSameNote = newNoteId === activeTabId && view === 'vault';

      if (
        !isPopStateNavigatingRef.current &&
        (!isSameNote || isMobileSidebarOpen || isMobileRightSidebarOpen || activeModal)
      ) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view: 'vault',
          activeTabId: newNoteId,
          isMobileSidebarOpen: false,
          isMobileRightSidebarOpen: false,
          activeModal: null,
          mediaCategory: null,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setView('vault');
      setMediaCategory(null);
      onSelectTabId(newNoteId);
      setIsMobileSidebarOpen(false);
      setIsMobileRightSidebarOpen(false);
      setActiveModal(null);
    },
    [activeTabId, view, isMobileSidebarOpen, isMobileRightSidebarOpen, activeModal, onSelectTabId, setView, setMediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Open Left Mobile Sidebar
  const openMobileSidebar = useCallback(() => {
    if (isMobileSidebarOpen) return;

    if (!isPopStateNavigatingRef.current) {
      currentSeqRef.current += 1;
      const nextEntry: NavigationHistoryEntry = {
        view,
        activeTabId,
        isMobileSidebarOpen: true,
        isMobileRightSidebarOpen: false,
        activeModal: null,
        mediaCategory,
        seq: currentSeqRef.current,
      };
      safePushState(nextEntry);
    }

    setIsMobileSidebarOpen(true);
    setIsMobileRightSidebarOpen(false);
  }, [isMobileSidebarOpen, view, activeTabId, mediaCategory, setIsMobileSidebarOpen, setIsMobileRightSidebarOpen, isPopStateNavigatingRef, currentSeqRef]);

  // Close Left Mobile Sidebar
  const closeMobileSidebar = useCallback(() => {
    if (!isMobileSidebarOpen) return;

    if (window.history.state?.isMobileSidebarOpen) {
      safeHistoryBack();
    } else {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobileSidebarOpen, setIsMobileSidebarOpen]);

  // Open Right Mobile Sidebar
  const openMobileRightSidebar = useCallback(() => {
    if (isMobileRightSidebarOpen) return;

    if (!isPopStateNavigatingRef.current) {
      currentSeqRef.current += 1;
      const nextEntry: NavigationHistoryEntry = {
        view,
        activeTabId,
        isMobileSidebarOpen: false,
        isMobileRightSidebarOpen: true,
        activeModal: null,
        mediaCategory,
        seq: currentSeqRef.current,
      };
      safePushState(nextEntry);
    }

    setIsMobileRightSidebarOpen(true);
    setIsMobileSidebarOpen(false);
  }, [isMobileRightSidebarOpen, view, activeTabId, mediaCategory, setIsMobileRightSidebarOpen, setIsMobileSidebarOpen, isPopStateNavigatingRef, currentSeqRef]);

  // Close Right Mobile Sidebar
  const closeMobileRightSidebar = useCallback(() => {
    if (!isMobileRightSidebarOpen) return;

    if (window.history.state?.isMobileRightSidebarOpen) {
      safeHistoryBack();
    } else {
      setIsMobileRightSidebarOpen(false);
    }
  }, [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen]);

  // Open Modal with Back-Stack support
  const openModal = useCallback(
    (modalId: string) => {
      if (activeModal === modalId) return;

      if (!isPopStateNavigatingRef.current) {
        currentSeqRef.current += 1;
        const nextEntry: NavigationHistoryEntry = {
          view,
          activeTabId,
          isMobileSidebarOpen,
          isMobileRightSidebarOpen,
          activeModal: modalId,
          mediaCategory,
          seq: currentSeqRef.current,
        };
        safePushState(nextEntry);
      }

      setActiveModal(modalId);
    },
    [activeModal, view, activeTabId, isMobileSidebarOpen, isMobileRightSidebarOpen, mediaCategory, setActiveModal, isPopStateNavigatingRef, currentSeqRef]
  );

  // Close Modal with Back-Stack support
  const closeModal = useCallback(() => {
    if (!activeModal) return;

    if (window.history.state?.activeModal) {
      safeHistoryBack();
    } else {
      setActiveModal(null);
    }
  }, [activeModal, setActiveModal]);

  const openDesktopSidebar = useCallback(() => setIsDesktopSidebarOpen(true), [setIsDesktopSidebarOpen]);
  const closeDesktopSidebar = useCallback(() => setIsDesktopSidebarOpen(false), [setIsDesktopSidebarOpen]);
  const toggleDesktopSidebar = useCallback(() => setIsDesktopSidebarOpen((prev) => !prev), [setIsDesktopSidebarOpen]);

  const goBack = useCallback(() => {
    safeHistoryBack();
  }, []);

  return {
    navigateView,
    navigateToNote,
    navigateToMediaCategory,
    openMobileSidebar,
    closeMobileSidebar,
    openMobileRightSidebar,
    closeMobileRightSidebar,
    openModal,
    closeModal,
    openDesktopSidebar,
    closeDesktopSidebar,
    toggleDesktopSidebar,
    goBack,
  };
};
