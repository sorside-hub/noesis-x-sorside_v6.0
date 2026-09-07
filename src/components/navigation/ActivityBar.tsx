import React from 'react';
import { Folder, LayoutGrid, Settings, MessageSquare, HardDrive, Globe, Plus, AudioLines } from 'lucide-react';
import { ActiveTab } from './BottomNavPill';
import { useNavigation } from '../../context/NavigationContext';

interface ActivityBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onCreateNote?: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeTab, onTabChange, onCreateNote }) => {
  const { isDesktopSidebarOpen, toggleDesktopSidebar, openDesktopSidebar, openModal } = useNavigation();

  const handleVaultClick = () => {
    if (activeTab !== 'vault') {
      onTabChange('vault');
      openDesktopSidebar();
    } else {
      toggleDesktopSidebar();
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-12 h-full bg-bg-surface border-r border-border-default shrink-0 items-center py-4 justify-between select-none z-20">
      <div className="flex flex-col items-center gap-3 w-full px-1.5">
        {/* Noesis Brand Logo */}
        <div 
          className="w-7 h-7 bg-accent-primary rounded-[4px] flex items-center justify-center rotate-45 shadow-[0_0_12px_rgba(197,163,106,0.25)] my-1 shrink-0 select-none cursor-pointer"
          onClick={() => onTabChange('vault')}
          title="Noesis Vault"
        >
          <div className="w-3.5 h-3.5 border border-accent-contrast -rotate-45" />
        </div>

        <div className="w-6 h-[1px] bg-border-subtle my-0.5" />

        {onCreateNote && (
          <button
            type="button"
            title="New Note"
            onClick={onCreateNote}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 mb-0.5 border border-border-default/70 hover:border-accent-primary/50 shadow-xs"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>
        )}

        {/* Voice Note Button */}
        <button
          type="button"
          title="AI Voice Transcript"
          onClick={() => openModal('voice-note')}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 mb-0.5 border border-border-default/70 hover:border-accent-primary/30 shadow-xs"
        >
          <AudioLines size={18} strokeWidth={2.2} />
        </button>
        
        {/* Vault Tab (Clicking when active toggles the left sidebar) */}
        <button
          type="button"
          title={`Vault (${isDesktopSidebarOpen && activeTab === 'vault' ? 'Close Sidebar' : 'Open Sidebar'})`}
          onClick={handleVaultClick}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
            activeTab === 'vault'
              ? 'text-accent-contrast bg-accent-primary shadow-[0_0_15px_rgba(197,163,106,0.2)] font-medium border border-accent-primary/50'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Folder size={18} strokeWidth={activeTab === 'vault' ? 2.2 : 1.8} />
        </button>

        {/* Hub Tab */}
        <button
          type="button"
          title="Hub & Knowledge Matrix"
          onClick={() => onTabChange('hub')}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
            activeTab === 'hub'
              ? 'text-accent-contrast bg-accent-primary shadow-[0_0_15px_rgba(197,163,106,0.2)] font-medium border border-accent-primary/50'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <LayoutGrid size={18} strokeWidth={activeTab === 'hub' ? 2.2 : 1.8} />
        </button>

        {/* Chat Tab */}
        <button
          type="button"
          title="Chat AI"
          onClick={() => onTabChange('chat')}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
            activeTab === 'chat'
              ? 'text-accent-contrast bg-accent-primary shadow-[0_0_15px_rgba(197,163,106,0.2)] font-medium border border-accent-primary/50'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <MessageSquare size={18} strokeWidth={activeTab === 'chat' ? 2.2 : 1.8} />
        </button>

        {/* Media Library Tab */}
        <button
          type="button"
          title="Pustaka Media & Lampiran"
          onClick={() => onTabChange('media')}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
            activeTab === 'media'
              ? 'text-accent-contrast bg-accent-primary shadow-[0_0_15px_rgba(197,163,106,0.2)] font-medium border border-accent-primary/50'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <HardDrive size={18} strokeWidth={activeTab === 'media' ? 2.2 : 1.8} />
        </button>

        {/* SORSIDE Studio Tab (CMS Website) */}
        <button
          type="button"
          title="SORSIDE Studio (CMS Website)"
          onClick={() => onTabChange('sorside')}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
            activeTab === 'sorside'
              ? 'text-accent-contrast bg-accent-primary shadow-[0_0_15px_rgba(197,163,106,0.2)] font-medium border border-accent-primary/50'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Globe size={18} strokeWidth={activeTab === 'sorside' ? 2.2 : 1.8} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 w-full px-1.5">
        <button
          type="button"
          title="Settings"
          onClick={() => onTabChange('settings')}
          className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer group ${
            activeTab === 'settings'
              ? 'text-accent-contrast bg-accent-primary shadow-[0_0_15px_rgba(197,163,106,0.2)] font-medium border border-accent-primary/50'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <Settings size={18} strokeWidth={activeTab === 'settings' ? 2.2 : 1.8} />
        </button>
      </div>
    </div>
  );
};
