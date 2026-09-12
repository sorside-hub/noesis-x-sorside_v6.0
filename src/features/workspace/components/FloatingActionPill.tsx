import React from 'react';
import { Plus, FolderPlus, Search, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { SidebarTabMode } from '../hooks/useLeftSidebarLogic';

interface FloatingActionPillProps {
  activeTab?: SidebarTabMode;
  isPillHidden: boolean;
  onCreateNote: (parentId?: string | null) => void;
  onCreateFolder: (parentId?: string | null) => void;
  onCreateBookmarkGroup?: () => void;
  onCloseMobile: () => void;
  isTreeSearchOpen: boolean;
  setIsTreeSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  areAllFoldersCollapsed: boolean;
  handleToggleExpandCollapseAll: () => void;
  areAllTagsCollapsed?: boolean;
  handleToggleExpandCollapseAllTags?: () => void;
  areAllGroupsCollapsed?: boolean;
  handleToggleExpandCollapseAllGroups?: () => void;
}

export const FloatingActionPill: React.FC<FloatingActionPillProps> = ({
  activeTab = 'files',
  isPillHidden,
  onCreateNote,
  onCreateFolder,
  onCreateBookmarkGroup,
  onCloseMobile,
  isTreeSearchOpen,
  setIsTreeSearchOpen,
  areAllFoldersCollapsed,
  handleToggleExpandCollapseAll,
  areAllTagsCollapsed = false,
  handleToggleExpandCollapseAllTags,
  areAllGroupsCollapsed = false,
  handleToggleExpandCollapseAllGroups,
}) => {
  return (
    <div
      className={twMerge(
        'absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-max max-w-[calc(100%-1.5rem)] transition-all duration-150',
        isPillHidden
          ? 'opacity-0 translate-y-12 pointer-events-none'
          : 'opacity-100 translate-y-0 pointer-events-auto'
      )}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-bg-elevated/95 backdrop-blur-md border border-border-default ring-1 ring-black/5 dark:ring-white/10 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-all">
        {/* TAB: BOOKMARKS */}
        {activeTab === 'bookmarks' ? (
          <>
            {/* 1. New Bookmark Group */}
            <button
              type="button"
              title="Buat Grup Penanda Baru"
              onClick={() => {
                if (onCreateBookmarkGroup) onCreateBookmarkGroup();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <FolderPlus size={14} className="text-text-link opacity-90" />
              <span>Grup</span>
            </button>

            <div className="w-px h-4 bg-border-default mx-0.5" />

            {/* 2. Search Bookmarks */}
            <button
              type="button"
              title={isTreeSearchOpen ? 'Tutup pencarian' : 'Cari bookmark'}
              onClick={() => setIsTreeSearchOpen((prev) => !prev)}
              className={twMerge(
                'p-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                isTreeSearchOpen
                  ? 'bg-bg-hover text-text-heading ring-1 ring-border-default'
                  : 'text-text-secondary hover:text-text-heading hover:bg-bg-hover'
              )}
            >
              <Search size={14} className={isTreeSearchOpen ? 'text-text-link' : ''} />
            </button>

            {/* 3. Expand / Collapse Groups */}
            {handleToggleExpandCollapseAllGroups && (
              <button
                type="button"
                title={areAllGroupsCollapsed ? 'Buka Semua Grup' : 'Tutup Semua Grup'}
                onClick={handleToggleExpandCollapseAllGroups}
                className="p-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer group"
              >
                {areAllGroupsCollapsed ? (
                  <ChevronsUpDown size={14} className="text-text-link opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <ChevronsDownUp size={14} className="text-text-secondary group-hover:text-text-heading transition-colors" />
                )}
              </button>
            )}
          </>
        ) : activeTab === 'tags' ? (
          /* TAB: TAGS */
          <>
            {/* 1. New Note */}
            <button
              type="button"
              title="Catatan Baru"
              onClick={() => {
                onCreateNote(null);
                onCloseMobile();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <Plus size={14} className="text-text-link opacity-90" />
              <span>Catatan</span>
            </button>

            <div className="w-px h-4 bg-border-default mx-0.5" />

            {/* 2. Search Tags */}
            <button
              type="button"
              title={isTreeSearchOpen ? 'Tutup pencarian' : 'Cari tag'}
              onClick={() => setIsTreeSearchOpen((prev) => !prev)}
              className={twMerge(
                'p-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                isTreeSearchOpen
                  ? 'bg-bg-hover text-text-heading ring-1 ring-border-default'
                  : 'text-text-secondary hover:text-text-heading hover:bg-bg-hover'
              )}
            >
              <Search size={14} className={isTreeSearchOpen ? 'text-text-link' : ''} />
            </button>

            {/* 3. Expand / Collapse Tags */}
            {handleToggleExpandCollapseAllTags && (
              <button
                type="button"
                title={areAllTagsCollapsed ? 'Buka Semua Tag' : 'Tutup Semua Tag'}
                onClick={handleToggleExpandCollapseAllTags}
                className="p-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer group"
              >
                {areAllTagsCollapsed ? (
                  <ChevronsUpDown size={14} className="text-text-link opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <ChevronsDownUp size={14} className="text-text-secondary group-hover:text-text-heading transition-colors" />
                )}
              </button>
            )}
          </>
        ) : (
          /* TAB: FILES */
          <>
            {/* 1. New Note */}
            <button
              type="button"
              title="Catatan Baru"
              onClick={() => {
                onCreateNote(null);
                onCloseMobile();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <Plus size={14} className="text-text-link opacity-90" />
              <span>Catatan</span>
            </button>

            {/* 2. New Folder (only in files tab) */}
            <button
              type="button"
              title="Folder Baru"
              onClick={() => onCreateFolder(null)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <FolderPlus size={14} className="text-text-link opacity-90" />
              <span>Folder</span>
            </button>

            <div className="w-px h-4 bg-border-default mx-0.5" />

            {/* 3. Search Toggle */}
            <button
              type="button"
              title={isTreeSearchOpen ? 'Tutup pencarian' : 'Cari file'}
              onClick={() => setIsTreeSearchOpen((prev) => !prev)}
              className={twMerge(
                'p-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
                isTreeSearchOpen
                  ? 'bg-bg-hover text-text-heading ring-1 ring-border-default'
                  : 'text-text-secondary hover:text-text-heading hover:bg-bg-hover'
              )}
            >
              <Search size={14} className={isTreeSearchOpen ? 'text-text-link' : ''} />
            </button>

            {/* 4. Expand / Collapse Folders (files tab) */}
            <button
              type="button"
              title={areAllFoldersCollapsed ? 'Buka Semua Folder' : 'Tutup Semua Folder'}
              onClick={handleToggleExpandCollapseAll}
              className="p-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-heading hover:bg-bg-hover transition-colors cursor-pointer group"
            >
              {areAllFoldersCollapsed ? (
                <ChevronsUpDown size={14} className="text-text-link opacity-90 group-hover:opacity-100 transition-opacity" />
              ) : (
                <ChevronsDownUp size={14} className="text-text-secondary group-hover:text-text-heading transition-colors" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
