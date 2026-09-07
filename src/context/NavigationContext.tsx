import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ActiveTab } from '../components/navigation/BottomNavPill';
import { NavigationHistoryEntry, safeReplaceState } from './navigation/historyUtils';
import { useNavigationActions } from './navigation/useNavigationActions';

export type { NavigationHistoryEntry } from './navigation/historyUtils';

interface NavigationContextType {
  // Top-level View ('vault' | 'settings')
  view: ActiveTab;
  setView: (tab: ActiveTab) => void;
  navigateView: (tab: ActiveTab) => void;

  // Active Note Tab ID
  activeTabId: string | null;
  navigateToNote: (id: string | null) => void;

  // Media Category Detail Navigation
  mediaCategory: string | null;
  setMediaCategory: (cat: string | null) => void;
  navigateToMediaCategory: (cat: string | null) => void;

  // Desktop Sidebars
  isDesktopSidebarOpen: boolean;
  setIsDesktopSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDesktopSidebar: () => void;
  openDesktopSidebar: () => void;
  closeDesktopSidebar: () => void;

  // Mobile Drawers
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  isMobileRightSidebarOpen: boolean;
  setIsMobileRightSidebarOpen: (open: boolean) => void;
  openMobileRightSidebar: () => void;
  closeMobileRightSidebar: () => void;

  // Modal / Popup Overlays
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Manual Back Trigger
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

interface NavigationProviderProps {
  children: React.ReactNode;
  activeTabId: string | null;
  onSelectTabId: (id: string | null) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  activeTabId,
  onSelectTabId,
}) => {
  const [view, setView] = useState<ActiveTab>('vault');
  const [mediaCategory, setMediaCategory] = useState<string | null>(null);
  // Default desktop left sidebar is open
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const isPopStateNavigatingRef = useRef(false);
  const currentSeqRef = useRef(1);

  // Initialize history state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialEntry: NavigationHistoryEntry = {
      view: 'vault',
      activeTabId,
      isMobileSidebarOpen: false,
      isMobileRightSidebarOpen: false,
      activeModal: null,
      mediaCategory: null,
      seq: 1,
    };

    safeReplaceState(initialEntry);
  }, []);

  // Listen for browser/phone Back & Forward popstate events
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as NavigationHistoryEntry | null;
      if (!state) return;

      isPopStateNavigatingRef.current = true;
      currentSeqRef.current = state.seq || 1;

      // 1. Sync View
      if (state.view) {
        setView(state.view);
      }

      // 2. Sync Active Note
      if (state.activeTabId !== undefined) {
        onSelectTabId(state.activeTabId);
      }

      // 3. Sync Mobile Sidebars
      setIsMobileSidebarOpen(!!state.isMobileSidebarOpen);
      setIsMobileRightSidebarOpen(!!state.isMobileRightSidebarOpen);

      // 4. Sync Modal
      setActiveModal(state.activeModal || null);

      // 5. Sync Media Category
      setMediaCategory(state.mediaCategory || null);

      // Reset flag after state batching completes
      setTimeout(() => {
        isPopStateNavigatingRef.current = false;
      }, 60);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onSelectTabId]);

  // Listen for open-tag-in-sidebar to open desktop/mobile left sidebar to tags
  useEffect(() => {
    const handleOpenTag = (e: any) => {
      if (e.detail?.tag) {
        setView('vault');
        setIsDesktopSidebarOpen(true);
        setIsMobileSidebarOpen(true);
      }
    };
    window.addEventListener('open-tag-in-sidebar', handleOpenTag);
    return () => window.removeEventListener('open-tag-in-sidebar', handleOpenTag);
  }, []);

  // Hook for all navigation interactions and URL / history push actions
  const actions = useNavigationActions({
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
  });

  return (
    <NavigationContext.Provider
      value={{
        view,
        setView,
        activeTabId,
        mediaCategory,
        setMediaCategory,
        isDesktopSidebarOpen,
        setIsDesktopSidebarOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isMobileRightSidebarOpen,
        setIsMobileRightSidebarOpen,
        activeModal,
        ...actions,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
