import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Bookmark,
  Folder,
  FileText,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Star,
  MoreVertical,
  Search,
  ChevronsUpDown,
  ChevronsDownUp,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { BookmarkItem, BookmarkGroup } from '../types/bookmarks';
import { VaultData } from '../../../types/vault';

interface BookmarksExplorerProps {
  vault: VaultData;
  bookmarks: BookmarkItem[];
  groups: BookmarkGroup[];
  searchQuery: string;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCloseMobile: () => void;
  onRemoveBookmark: (id: string) => void;
  onOpenBookmarkModal?: (nodeId: string) => void;
  onUpdateBookmark: (
    bookmarkId: string,
    updates: Partial<Pick<BookmarkItem, 'title' | 'groupId' | 'order'>>
  ) => void;
  onCreateGroup: (name: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  isCreatingGroupExternal?: boolean;
  setIsCreatingGroupExternal?: (open: boolean) => void;
}

export const BookmarksExplorer: React.FC<BookmarksExplorerProps> = ({
  vault,
  bookmarks,
  groups,
  searchQuery,
  activeFileId,
  onSelectFile,
  onCloseMobile,
  onRemoveBookmark,
  onOpenBookmarkModal,
  onUpdateBookmark,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  isCreatingGroupExternal,
  setIsCreatingGroupExternal,
}) => {
  // State for UI interactions
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [internalCreatingGroup, setInternalCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editingBookmarkTitle, setEditingBookmarkTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const newGroupInputRef = useRef<HTMLInputElement>(null);

  // Close active dropdown menu when clicking anywhere outside
  useEffect(() => {
    if (!activeMenuId) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-bookmark-menu="true"]')) {
        return;
      }
      setActiveMenuId(null);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('mousedown', handlePointerDown, true);
    window.addEventListener('touchstart', handlePointerDown, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('mousedown', handlePointerDown, true);
      window.removeEventListener('touchstart', handlePointerDown, true);
    };
  }, [activeMenuId]);

  const isCreatingGroup =
    isCreatingGroupExternal !== undefined ? isCreatingGroupExternal : internalCreatingGroup;

  const setIsCreatingGroup = (val: boolean) => {
    if (setIsCreatingGroupExternal) {
      setIsCreatingGroupExternal(val);
    } else {
      setInternalCreatingGroup(val);
    }
  };

  useEffect(() => {
    if (isCreatingGroup) {
      setTimeout(() => {
        newGroupInputRef.current?.focus();
      }, 50);
    }
  }, [isCreatingGroup]);

  const query = searchQuery.toLowerCase().trim();

  // Toggle group open/close
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const areAllGroupsExpanded =
    groups.length > 0 && groups.every((g) => expandedGroups.has(g.id));

  const toggleExpandCollapseAll = () => {
    if (areAllGroupsExpanded) {
      setExpandedGroups(new Set());
    } else {
      setExpandedGroups(new Set(groups.map((g) => g.id)));
    }
  };

  // Group creation handler
  const handleSaveNewGroup = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  // Group rename handler
  const handleSaveRenameGroup = (groupId: string) => {
    if (editingGroupName.trim()) {
      onRenameGroup(groupId, editingGroupName.trim());
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // Bookmark rename handler
  const handleSaveRenameBookmark = (bookmarkId: string) => {
    if (editingBookmarkTitle.trim()) {
      onUpdateBookmark(bookmarkId, { title: editingBookmarkTitle.trim() });
    }
    setEditingBookmarkId(null);
    setEditingBookmarkTitle('');
  };

  // Filter bookmarks & groups based on search query
  const { rootBookmarks, groupedBookmarks, visibleGroupIds, totalMatchingCount } = useMemo(() => {
    const validBookmarks = bookmarks.filter((b) => !!vault.nodes[b.nodeId]);

    if (!query) {
      const root: BookmarkItem[] = [];
      const grouped: Record<string, BookmarkItem[]> = {};

      groups.forEach((g) => {
        grouped[g.id] = [];
      });

      validBookmarks.forEach((b) => {
        if (b.groupId && grouped[b.groupId]) {
          grouped[b.groupId].push(b);
        } else {
          root.push(b);
        }
      });

      return {
        rootBookmarks: root,
        groupedBookmarks: grouped,
        visibleGroupIds: new Set(groups.map((g) => g.id)),
        totalMatchingCount: validBookmarks.length,
      };
    }

    // When query is active:
    // 1. Group names matching query
    const matchingGroupIds = new Set<string>();
    groups.forEach((g) => {
      if (g.name.toLowerCase().includes(query)) {
        matchingGroupIds.add(g.id);
      }
    });

    // 2. Bookmarks matching query (by custom bookmark title, original node name, group name, or tags)
    const matchingBookmarks = validBookmarks.filter((b) => {
      const node = vault.nodes[b.nodeId];
      const titleMatch = (b.title || '').toLowerCase().includes(query);
      const nameMatch = (node?.name || '').toLowerCase().includes(query);
      const groupMatch = b.groupId ? matchingGroupIds.has(b.groupId) : false;
      const tagsMatch =
        Array.isArray(node?.metadata?.tags) &&
        node.metadata.tags.some((t: string) => t.toLowerCase().includes(query));

      return titleMatch || nameMatch || groupMatch || tagsMatch;
    });

    const root: BookmarkItem[] = [];
    const grouped: Record<string, BookmarkItem[]> = {};
    const groupsWithMatches = new Set<string>();

    groups.forEach((g) => {
      grouped[g.id] = [];
      if (matchingGroupIds.has(g.id)) {
        groupsWithMatches.add(g.id);
      }
    });

    matchingBookmarks.forEach((b) => {
      if (b.groupId && grouped[b.groupId]) {
        grouped[b.groupId].push(b);
        groupsWithMatches.add(b.groupId);
      } else {
        root.push(b);
      }
    });

    return {
      rootBookmarks: root,
      groupedBookmarks: grouped,
      visibleGroupIds: groupsWithMatches,
      totalMatchingCount: matchingBookmarks.length,
    };
  }, [bookmarks, groups, vault, query]);

  // Click on a bookmarked item
  const handleItemClick = (b: BookmarkItem) => {
    const node = vault.nodes[b.nodeId];
    if (!node) return;
    if (node.type === 'file') {
      onSelectFile(node.id);
      onCloseMobile();
    }
  };

  // Render a single bookmark item row
  const renderBookmarkRow = (b: BookmarkItem, depth: number = 0) => {
    const node = vault.nodes[b.nodeId];
    if (!node) return null;

    const isSelected = node.id === activeFileId;
    const isEditing = editingBookmarkId === b.id;
    const isMenuOpen = activeMenuId === `bm_${b.id}`;

    return (
      <div key={b.id} className="relative group select-none">
        <div
          className={twMerge(
            'w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 text-left',
            isSelected
              ? 'bg-bg-hover text-accent-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          )}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
          onClick={() => handleItemClick(b)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {node.type === 'folder' ? (
              <Folder size={13} className="text-accent-primary shrink-0 opacity-80" />
            ) : (
              <FileText
                size={13}
                className={twMerge(
                  'shrink-0 transition-colors',
                  isSelected ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
                )}
              />
            )}

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveRenameBookmark(b.id);
                }}
                className="flex items-center gap-1 flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  value={editingBookmarkTitle}
                  onChange={(e) => setEditingBookmarkTitle(e.target.value)}
                  onBlur={() => handleSaveRenameBookmark(b.id)}
                  className="bg-bg-primary border border-accent-primary/60 rounded px-1.5 py-0.5 text-xs text-text-primary w-full outline-hidden"
                />
              </form>
            ) : (
              <span className="truncate flex-1 text-[11.5px]">{b.title || node.name}</span>
            )}
          </div>

          {/* Quick Actions (More) */}
          {!isEditing && (
            <div
              className="flex items-center gap-0.5 ml-1"
              data-bookmark-menu="true"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Pilihan Bookmark"
                onClick={() => setActiveMenuId(isMenuOpen ? null : `bm_${b.id}`)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MoreVertical size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Menu for Bookmark */}
        {isMenuOpen && (
          <div
            data-bookmark-menu="true"
            className="absolute right-2 top-full mt-1 z-30 bg-bg-surface border border-border-default rounded-xl shadow-xl py-1.5 min-w-[160px] text-xs animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {onOpenBookmarkModal && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onOpenBookmarkModal(b.nodeId);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
              >
                <Bookmark size={12} className="text-accent-primary" />
                <span>Pengaturan Bookmark...</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingBookmarkId(b.id);
                setEditingBookmarkTitle(b.title || node.name);
                setActiveMenuId(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
            >
              <Edit2 size={12} className="text-text-muted" />
              <span>Ganti Nama Cepat</span>
            </button>

            {/* Move to Group options */}
            {groups.length > 0 && (
              <>
                <div className="my-1 border-t border-border-subtle" />
                <div className="px-3 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Pindahkan ke Grup
                </div>

                {b.groupId && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateBookmark(b.id, { groupId: null });
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer text-[11px]"
                  >
                    <Folder size={12} className="text-text-muted" />
                    <span>Tanpa Grup (Root)</span>
                  </button>
                )}

                {groups.map((g) => {
                  if (g.id === b.groupId) return null;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        onUpdateBookmark(b.id, { groupId: g.id });
                        setActiveMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer text-[11px]"
                    >
                      <Folder size={12} className="text-accent-primary/70" />
                      <span className="truncate">{g.name}</span>
                    </button>
                  );
                })}
              </>
            )}

            <div className="my-1 border-t border-border-subtle" />

            <button
              type="button"
              onClick={() => {
                onRemoveBookmark(b.id);
                setActiveMenuId(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-status-error hover:bg-status-error-bg transition-colors text-left cursor-pointer font-medium"
            >
              <Trash2 size={12} className="text-status-error" />
              <span>Hapus Bookmark</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render a Bookmark Group folder
  const renderGroup = (group: BookmarkGroup) => {
    // If search query is active, auto-expand groups that have matches
    const isExpanded = query ? true : expandedGroups.has(group.id);
    const groupItems = groupedBookmarks[group.id] || [];
    const isEditing = editingGroupId === group.id;
    const isMenuOpen = activeMenuId === `grp_${group.id}`;

    // If searching and this group is not in visibleGroupIds, don't render it
    if (query && !visibleGroupIds.has(group.id)) {
      return null;
    }

    return (
      <div key={group.id} className="space-y-0.5">
        {/* Group Header */}
        <div
          className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition-all duration-150 group text-left select-none relative"
          onClick={() => toggleGroup(group.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="p-0.5 -ml-0.5 text-text-muted transition-transform duration-150 shrink-0">
              {isExpanded ? (
                <ChevronDown size={13} className="text-text-primary" />
              ) : (
                <ChevronRight size={13} className="text-text-muted group-hover:text-text-primary" />
              )}
            </span>
            <Folder size={13} className="text-accent-primary shrink-0 opacity-90" />

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveRenameGroup(group.id);
                }}
                className="flex items-center gap-1 flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  onBlur={() => handleSaveRenameGroup(group.id)}
                  className="bg-bg-primary border border-accent-primary/60 rounded px-1.5 py-0.5 text-xs text-text-primary w-full outline-hidden font-normal"
                />
              </form>
            ) : (
              <span className="truncate text-[11.5px] font-medium tracking-tight">
                {group.name}
              </span>
            )}
          </div>

          {/* Badge & Actions */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            data-bookmark-menu="true"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-bg-hover text-text-muted group-hover:text-text-secondary tabular-nums">
              {groupItems.length}
            </span>

            {!isEditing && (
              <button
                type="button"
                title="Pilihan Grup"
                onClick={() => setActiveMenuId(isMenuOpen ? null : `grp_${group.id}`)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer"
              >
                <MoreVertical size={12} />
              </button>
            )}
          </div>

          {/* Group Dropdown Menu */}
          {isMenuOpen && (
            <div
              data-bookmark-menu="true"
              className="absolute right-2 top-full mt-1 z-30 bg-bg-surface border border-border-default rounded-xl shadow-xl py-1.5 min-w-[150px] text-xs animate-in fade-in zoom-in-95 duration-100 font-normal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingGroupId(group.id);
                  setEditingGroupName(group.name);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-bg-hover transition-colors text-left cursor-pointer"
              >
                <Edit2 size={12} className="text-text-muted" />
                <span>Ganti Nama Grup</span>
              </button>

              <div className="my-1 border-t border-border-subtle" />

              <button
                type="button"
                onClick={() => {
                  onDeleteGroup(group.id);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-status-error hover:bg-status-error-bg transition-colors text-left cursor-pointer font-medium"
              >
                <Trash2 size={12} className="text-status-error" />
                <span>Hapus Grup</span>
              </button>
            </div>
          )}
        </div>

        {/* Group Items */}
        {isExpanded && (
          <div className="relative border-l border-border-subtle/50 ml-3.5 my-0.5 space-y-0.5 pl-2">
            {groupItems.length === 0 ? (
              <div className="py-1 px-2 text-[11px] text-text-muted italic">
                {query ? 'Tidak ada penanda yang cocok' : 'Grup ini masih kosong'}
              </div>
            ) : (
              groupItems.map((b) => renderBookmarkRow(b, 0))
            )}
          </div>
        )}
      </div>
    );
  };

  // Close menus on background click
  return (
    <div
      className="space-y-1.5 py-1 relative"
      onClick={() => {
        if (activeMenuId) setActiveMenuId(null);
      }}
    >
      {/* Invisible backdrop to guarantee click/tap-outside dismissal */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-20 bg-transparent"
          onPointerDown={(e) => {
            e.stopPropagation();
            setActiveMenuId(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(null);
          }}
        />
      )}

      {/* Mini Controls Bar: Bookmark count and Expand/Collapse */}
      <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-text-muted border-b border-border-subtle/50 pb-1.5 mb-1">
        <span className="flex items-center gap-1 text-text-muted">
          <Star size={12} className="text-accent-primary" />
          <span>
            {query
              ? `${totalMatchingCount} Ditemukan`
              : `${bookmarks.length} Bookmark`}
          </span>
        </span>

        <div className="flex items-center gap-1">
          {/* Expand/Collapse Groups */}
          {groups.length > 0 && !query && (
            <button
              type="button"
              title={areAllGroupsExpanded ? 'Tutup Semua Grup' : 'Buka Semua Grup'}
              onClick={toggleExpandCollapseAll}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              {areAllGroupsExpanded ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* New Group Input Form */}
      {isCreatingGroup && (
        <form
          onSubmit={handleSaveNewGroup}
          className="mx-2 mb-2 p-2.5 bg-bg-primary border border-accent-primary/40 rounded-xl space-y-2 animate-in fade-in duration-100 shadow-lg"
        >
          <div className="flex items-center gap-1.5 text-xs text-text-primary font-semibold">
            <FolderPlus size={13} className="text-accent-primary" />
            <span>Grup Penanda Baru</span>
          </div>
          <input
            ref={newGroupInputRef}
            type="text"
            placeholder="Nama grup (e.g. Proyek, Referensi)..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full bg-bg-surface border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-hidden focus:ring-1 focus:ring-accent-primary focus:border-accent-primary"
          />
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsCreatingGroup(false);
                setNewGroupName('');
              }}
              className="px-2.5 py-1 rounded-md text-[11px] text-text-muted hover:text-text-primary hover:bg-bg-hover cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!newGroupName.trim()}
              className="px-3 py-1 rounded-md text-[11px] font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              Buat Grup
            </button>
          </div>
        </form>
      )}

      {/* Search Result Empty State */}
      {query && totalMatchingCount === 0 && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted select-none mt-4">
          <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-2">
            <Search size={16} />
          </div>
          <p className="text-xs font-semibold text-text-primary mb-1">Penanda Tidak Ditemukan</p>
          <p className="text-[11px] leading-relaxed text-text-muted max-w-[200px]">
            Tidak ada penanda atau grup yang cocok dengan &quot;{searchQuery}&quot;.
          </p>
        </div>
      )}

      {/* Default Empty State */}
      {!query && bookmarks.length === 0 && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted select-none mt-8">
          <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-3">
            <Bookmark size={20} />
          </div>
          <p className="text-xs font-semibold text-text-primary mb-1">Belum Ada Penanda</p>
          <p className="text-[11px] leading-relaxed text-text-muted max-w-[200px]">
            Tandai catatan atau folder penting melalui klik kanan atau menu titik tiga pada catatan.
          </p>
        </div>
      )}

      {/* Grouped Folders & Bookmarks */}
      <div className="space-y-0.5">
        {groups.map((group) => renderGroup(group))}
        {rootBookmarks.map((b) => renderBookmarkRow(b, 0))}
      </div>
    </div>
  );
};
