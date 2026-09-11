import React, { RefObject } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { RightSidebarTab } from '../hooks/useRightSidebarLogic';

export interface TabOption {
  id: RightSidebarTab;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

interface RightSidebarTabSwitcherProps {
  activeTab: RightSidebarTab;
  setActiveTab: (tab: RightSidebarTab) => void;
  isTabMenuOpen: boolean;
  setIsTabMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tabMenuRef: RefObject<HTMLDivElement | null>;
  isKeyboardOpen: boolean;
  tabs: TabOption[];
}

export const RightSidebarTabSwitcher: React.FC<RightSidebarTabSwitcherProps> = ({
  activeTab,
  setActiveTab,
  isTabMenuOpen,
  setIsTabMenuOpen,
  tabMenuRef,
  isKeyboardOpen,
  tabs,
}) => {
  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const CurrentTabIcon = currentTabObj.icon;

  return (
    <div
      ref={tabMenuRef}
      className={twMerge(
        'absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] z-30 flex flex-col gap-2 transition-all duration-150',
        isKeyboardOpen
          ? 'opacity-0 translate-y-12 pointer-events-none'
          : 'opacity-100 translate-y-0 pointer-events-auto'
      )}
    >
      {/* POPUP SELECTION LIST (SIDEBAR VIEW) */}
      {isTabMenuOpen && (
        <div className="bg-bg-elevated/95 backdrop-blur-md border border-border-default rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/10 p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted tracking-wider uppercase">
            Sidebar View
          </div>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsTabMenuOpen(false);
                }}
                className={twMerge(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group',
                  isSelected
                    ? 'bg-bg-hover text-text-heading font-semibold border border-border-default shadow-2xs'
                    : 'text-text-secondary hover:text-text-heading hover:bg-bg-hover'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <TabIcon
                    size={15}
                    className={twMerge(
                      'transition-colors duration-150',
                      isSelected ? 'text-text-link' : 'text-text-muted group-hover:text-text-heading'
                    )}
                  />
                  <span className="transition-colors duration-150">{tab.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-text-link" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}

      {/* PILL TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsTabMenuOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-elevated/95 backdrop-blur-md border border-border-default ring-1 ring-black/5 dark:ring-white/10 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.55)] hover:bg-bg-hover transition-all cursor-pointer text-xs group"
      >
        <div className="flex items-center gap-2.5 font-semibold text-text-heading">
          <CurrentTabIcon size={15} className="text-text-link transition-transform group-hover:scale-105" />
          <span>{currentTabObj.label}</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted group-hover:text-text-secondary text-[11px] transition-colors">
          <span>Switch Tab</span>
          <ChevronDown
            size={13}
            className={twMerge('transition-transform duration-200 text-text-muted group-hover:text-text-secondary', isTabMenuOpen && 'rotate-180')}
          />
        </div>
      </button>
    </div>
  );
};
