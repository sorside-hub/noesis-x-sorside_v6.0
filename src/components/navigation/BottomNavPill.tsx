import React from 'react';
import { Folder, LayoutGrid, MessageSquare, HardDrive, Globe, Settings } from 'lucide-react';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';
import { useNavigation } from '../../context/NavigationContext';

export type ActiveTab = 'vault' | 'hub' | 'chat' | 'media' | 'sorside' | 'settings';

interface BottomNavPillProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNavPill: React.FC<BottomNavPillProps> = ({ activeTab, onTabChange }) => {
  const { activeTabId, isMobileRightSidebarOpen } = useNavigation();
  const { isVisible } = useScrollDirection([activeTab, activeTabId]);
  const { isKeyboardOpen } = useVirtualKeyboard();

  const shouldShow = isVisible && !isKeyboardOpen && !isMobileRightSidebarOpen;
  const isChatView = activeTab === 'chat';

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Silently catch if not supported or disabled
      }
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      triggerHaptic();
    }
    onTabChange(tab);
  };

  return (
    <div
      className={`fixed lg:hidden z-40 transition-all duration-200 ease-out ${
        isChatView
          ? `right-1.5 sm:right-3 top-[60%] -translate-y-1/2 ${
              shouldShow
                ? 'translate-x-0 opacity-100'
                : 'translate-x-16 opacity-0 pointer-events-none'
            }`
          : `bottom-3 sm:bottom-3.5 left-1/2 -translate-x-1/2 ${
              shouldShow
                ? 'translate-y-0 opacity-100'
                : 'translate-y-20 opacity-0 pointer-events-none'
            }`
      }`}
    >
      <nav
        aria-label="Main Navigation"
        className={`p-0.5 sm:p-1 rounded-full bg-bg-surface/90 backdrop-blur-md border border-border-default shadow-lg shadow-black/5 ring-1 ring-border-subtle ${
          isChatView ? 'flex flex-col items-center gap-1' : 'flex flex-row items-center gap-1'
        }`}
      >
        <button
          type="button"
          aria-label="Vault"
          title="Vault"
          onClick={() => handleTabChange('vault')}
          className={`p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
            activeTab === 'vault'
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
        >
          <Folder size={15} />
        </button>

        <button
          type="button"
          aria-label="Hub"
          title="Hub"
          onClick={() => handleTabChange('hub')}
          className={`p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
            activeTab === 'hub'
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
        >
          <LayoutGrid size={15} />
        </button>

        <button
          type="button"
          aria-label="Chat"
          title="Chat"
          onClick={() => handleTabChange('chat')}
          className={`p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
            activeTab === 'chat'
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
        >
          <MessageSquare size={15} />
        </button>

        <button
          type="button"
          aria-label="Media"
          title="Media Library"
          onClick={() => handleTabChange('media')}
          className={`p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
            activeTab === 'media'
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
        >
          <HardDrive size={15} />
        </button>

        <button
          type="button"
          aria-label="SORSIDE Studio"
          title="SORSIDE Studio"
          onClick={() => handleTabChange('sorside')}
          className={`p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
            activeTab === 'sorside'
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
        >
          <Globe size={15} />
        </button>

        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={() => handleTabChange('settings')}
          className={`p-2 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
            activeTab === 'settings'
              ? 'bg-accent-primary text-accent-contrast font-semibold shadow-xs'
              : 'text-text-muted hover:text-accent-primary hover:bg-accent-primary/10'
          }`}
        >
          <Settings size={15} />
        </button>
      </nav>
    </div>
  );
};
