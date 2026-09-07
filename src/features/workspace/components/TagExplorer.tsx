import React, { useState, useMemo, useEffect } from 'react';
import {
  Hash,
  ChevronRight,
  ChevronDown,
  FileText,
  Tag as TagIcon,
  FolderTree,
  ListFilter,
  ArrowUpDown,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { FlatTagItem, TagNodeData } from '../utils/tagUtils';

interface TagExplorerProps {
  flatTags: FlatTagItem[];
  tagTree: Record<string, TagNodeData>;
  searchQuery: string;
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCloseMobile: () => void;
}

type TagViewMode = 'tree' | 'flat';
type TagSortMode = 'name' | 'count';

export const TagExplorer: React.FC<TagExplorerProps> = ({
  flatTags,
  tagTree,
  searchQuery,
  activeFileId,
  onSelectFile,
  onCloseMobile,
}) => {
  const [viewMode, setViewMode] = useState<TagViewMode>('tree');
  const [sortMode, setSortMode] = useState<TagSortMode>('name');
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [highlightedTag, setHighlightedTag] = useState<string | null>(null);

  // Listen for open-tag-in-sidebar event to auto-expand parent nodes, scroll, and highlight tag
  useEffect(() => {
    let highlightTimer: any = null;

    const handleOpenTag = (e: any) => {
      const rawTag = e.detail?.tag;
      if (!rawTag || typeof rawTag !== 'string') return;
      const targetTag = rawTag.trim().replace(/^#/, '');
      if (!targetTag) return;

      // 1. Expand all parent segments so the tag is fully visible in tree mode
      const parts = targetTag.split('/').filter(Boolean);
      let acc = '';
      const toExpand: string[] = [];
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        toExpand.push(acc);
      }

      setExpandedTags((prev) => {
        const next = new Set(prev);
        toExpand.forEach((tagKey) => next.add(tagKey));
        return next;
      });

      // 2. Set highlighted tag
      setHighlightedTag(targetTag);

      if (highlightTimer) clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => {
        setHighlightedTag(null);
      }, 2500);

      // 3. Scroll to the element after DOM updates
      setTimeout(() => {
        const el = document.querySelector(`[data-tag-item="${targetTag}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 120);
    };

    window.addEventListener('open-tag-in-sidebar', handleOpenTag);
    return () => {
      window.removeEventListener('open-tag-in-sidebar', handleOpenTag);
      if (highlightTimer) clearTimeout(highlightTimer);
    };
  }, []);

  // Clean search query
  const query = searchQuery.toLowerCase().trim().replace(/^#/, '');

  // Toggle single tag expansion
  const toggleTag = (fullTag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(fullTag)) {
        next.delete(fullTag);
      } else {
        next.add(fullTag);
      }
      return next;
    });
  };

  // Expand all tags helper
  const allFullTagKeys = useMemo(() => {
    const keys: string[] = [];
    const traverse = (node: TagNodeData) => {
      keys.push(node.fullTag);
      Object.values(node.subTags).forEach(traverse);
    };
    Object.values(tagTree).forEach(traverse);
    return keys;
  }, [tagTree]);

  const areAllExpanded = allFullTagKeys.length > 0 && allFullTagKeys.every((k) => expandedTags.has(k));

  const toggleExpandCollapseAll = () => {
    if (areAllExpanded) {
      setExpandedTags(new Set());
    } else {
      setExpandedTags(new Set(allFullTagKeys));
    }
  };

  const isTagExpanded = (fullTag: string) => {
    if (query) return true; // Auto-expand matching branches on search
    return expandedTags.has(fullTag);
  };

  // -------------------------------------------------------------
  // FLAT VIEW FILTER & SORT
  // -------------------------------------------------------------
  const filteredFlatTags = useMemo(() => {
    let result = flatTags.filter((item) => {
      if (!query) return true;
      if (item.tag.toLowerCase().includes(query)) return true;
      return item.files.some((f) => f.name.toLowerCase().includes(query));
    });

    if (sortMode === 'name') {
      result.sort((a, b) => a.tag.localeCompare(b.tag));
    } else {
      result.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    }

    return result;
  }, [flatTags, query, sortMode]);

  // -------------------------------------------------------------
  // HIERARCHICAL TREE FILTER & SORT
  // -------------------------------------------------------------
  const filterAndSortTagTreeNodes = (nodes: Record<string, TagNodeData>): TagNodeData[] => {
    let list = Object.values(nodes);

    if (sortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => b.totalUniqueNotesCount - a.totalUniqueNotesCount || a.name.localeCompare(b.name));
    }

    return list;
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TagNodeData, depth: number = 0) => {
    const hasSubTags = Object.keys(node.subTags).length > 0;
    const hasDirectFiles = node.directFiles.length > 0;
    const hasChildren = hasSubTags || hasDirectFiles;

    // Search filter check for this node and subtree
    if (query) {
      const matchNode = node.fullTag.toLowerCase().includes(query);
      const matchDirectFiles = node.directFiles.some((f) => f.name.toLowerCase().includes(query));
      const hasMatchingSubTags = (n: TagNodeData): boolean => {
        if (n.fullTag.toLowerCase().includes(query)) return true;
        if (n.directFiles.some((f) => f.name.toLowerCase().includes(query))) return true;
        return Object.values(n.subTags).some(hasMatchingSubTags);
      };
      const matchSubTree = Object.values(node.subTags).some(hasMatchingSubTags);

      if (!matchNode && !matchDirectFiles && !matchSubTree) {
        return null;
      }
    }

    const expanded = isTagExpanded(node.fullTag);
    const sortedSubTags = filterAndSortTagTreeNodes(node.subTags);
    const hasActiveFile = node.directFiles.some((f) => f.id === activeFileId);
    const isHighlighted = highlightedTag === node.fullTag;

    return (
      <div key={node.fullTag} className="space-y-0.5">
        {/* Tag Node Row */}
        <button
          type="button"
          data-tag-item={node.fullTag}
          onClick={() => toggleTag(node.fullTag)}
          className={twMerge(
            'w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 group text-left select-none',
            isHighlighted
              ? 'bg-accent-primary/20 text-accent-primary ring-1 ring-accent-primary font-semibold animate-pulse'
              : hasActiveFile
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
          )}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="p-0.5 -ml-0.5 text-text-muted transition-transform duration-150 shrink-0">
              {hasChildren ? (
                expanded ? (
                  <ChevronDown size={13} className="text-text-primary" />
                ) : (
                  <ChevronRight size={13} className="text-text-muted group-hover:text-text-primary" />
                )
              ) : (
                <span className="w-3.5 inline-block" />
              )}
            </span>
            <Hash
              size={13}
              className={twMerge(
                'shrink-0 transition-colors',
                hasActiveFile ? 'text-accent-primary' : 'text-accent-primary/70 group-hover:text-accent-primary'
              )}
            />
            <span className="truncate font-mono text-[11.5px] tracking-tight">
              {depth === 0 ? node.name : node.name}
            </span>
          </div>

          {/* Count Badge */}
          <span
            className={twMerge(
              'ml-2 px-1.5 py-0.2 text-[10px] font-semibold rounded-full shrink-0 tabular-nums transition-colors',
              hasActiveFile
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'bg-bg-hover text-text-muted group-hover:text-text-secondary'
            )}
            title={`${node.totalUniqueNotesCount} catatan`}
          >
            {node.totalUniqueNotesCount}
          </span>
        </button>

        {/* Expanded Children: SubTags & Direct Files */}
        {hasChildren && expanded && (
          <div className="relative">
            {/* Guide line for tree hierarchy */}
            <div
              className="absolute top-0 bottom-1 border-l border-border-subtle/50 pointer-events-none"
              style={{ left: `${depth * 14 + 14}px` }}
            />

            {/* Sub-tags */}
            {sortedSubTags.map((subNode) => renderTreeNode(subNode, depth + 1))}

            {/* Direct Files */}
            {hasDirectFiles && (
              <div className="space-y-0.5 my-0.5">
                {node.directFiles.map((file) => {
                  const isSelected = file.id === activeFileId;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => {
                        onSelectFile(file.id);
                        onCloseMobile();
                      }}
                      className={twMerge(
                        'w-full flex items-center gap-2 py-1 px-2 rounded-md text-xs transition-all duration-150 cursor-pointer text-left group',
                        isSelected
                          ? 'bg-bg-hover text-accent-primary font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      )}
                      style={{ paddingLeft: `${(depth + 1) * 14 + 16}px` }}
                    >
                      <FileText
                        size={12.5}
                        className={twMerge(
                          'shrink-0 transition-colors',
                          isSelected ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
                        )}
                      />
                      <span className="truncate flex-1 text-[11.5px]">{file.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // EMPTY STATES
  // -------------------------------------------------------------
  if (flatTags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted select-none mt-8">
        <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-3">
          <Hash size={20} />
        </div>
        <p className="text-xs font-semibold text-text-primary mb-1">Belum Ada Tag</p>
        <p className="text-[11px] leading-relaxed text-text-muted max-w-[200px]">
          Ketik <span className="font-mono text-accent-primary font-medium">#tag</span> atau <span className="font-mono text-accent-primary font-medium">#proyek/web</span> di dalam catatan.
        </p>
      </div>
    );
  }

  const sortedRootTreeNodes = filterAndSortTagTreeNodes(tagTree);

  return (
    <div className="space-y-1.5 py-1">
      {/* Mini Controls Bar: View mode (Tree/Flat), Sort, Expand/Collapse */}
      <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-text-muted border-b border-border-subtle/50 pb-1.5 mb-1">
        <span className="flex items-center gap-1 text-text-muted">
          <TagIcon size={12} className="text-accent-primary" />
          <span>{flatTags.length} {flatTags.length === 1 ? 'Tag' : 'Tags'}</span>
        </span>

        <div className="flex items-center gap-1">
          {/* Toggle Sort (A-Z vs Count) */}
          <button
            type="button"
            title={sortMode === 'name' ? 'Urutkan berdasarkan frekuensi' : 'Urutkan berdasarkan nama (A-Z)'}
            onClick={() => setSortMode((prev) => (prev === 'name' ? 'count' : 'name'))}
            className={twMerge(
              'p-1 rounded-md text-[10px] transition-colors cursor-pointer flex items-center gap-1',
              sortMode === 'count'
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            )}
          >
            <ArrowUpDown size={11} />
            <span className="text-[10px] uppercase font-semibold tracking-wider">
              {sortMode === 'name' ? 'A-Z' : 'Count'}
            </span>
          </button>

          {/* Toggle View Mode (Hierarchical Tree vs Flat List) */}
          <button
            type="button"
            title={viewMode === 'tree' ? 'Ganti ke Tampilan Daftar' : 'Ganti ke Tampilan Hirarki Tree'}
            onClick={() => setViewMode((prev) => (prev === 'tree' ? 'flat' : 'tree'))}
            className={twMerge(
              'p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center',
              viewMode === 'tree'
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            )}
          >
            {viewMode === 'tree' ? <FolderTree size={12} /> : <ListFilter size={12} />}
          </button>

          {/* Expand / Collapse All (Tree Mode) */}
          {viewMode === 'tree' && (
            <button
              type="button"
              title={areAllExpanded ? 'Tutup Semua Tag' : 'Buka Semua Tag'}
              onClick={toggleExpandCollapseAll}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              {areAllExpanded ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Tag Items */}
      {viewMode === 'tree' ? (
        <div className="space-y-0.5">
          {sortedRootTreeNodes.map((rootNode) => renderTreeNode(rootNode, 0))}
        </div>
      ) : (
        /* Flat List Mode */
        <div className="space-y-0.5">
          {filteredFlatTags.length === 0 ? (
            <div className="text-center py-4 text-xs text-text-muted">
              Tidak ada tag yang cocok dengan &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredFlatTags.map((item) => {
              const expanded = isTagExpanded(item.tag);
              const hasActiveFile = item.files.some((f) => f.id === activeFileId);
              const isHighlighted = highlightedTag === item.tag;

              return (
                <div key={item.tag} className="rounded-lg overflow-hidden transition-colors">
                  <button
                    type="button"
                    data-tag-item={item.tag}
                    onClick={() => toggleTag(item.tag)}
                    className={twMerge(
                      'w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 group text-left select-none',
                      isHighlighted
                        ? 'bg-accent-primary/20 text-accent-primary ring-1 ring-accent-primary font-semibold animate-pulse'
                        : hasActiveFile
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="p-0.5 -ml-0.5 text-text-muted transition-transform duration-150 shrink-0">
                        {expanded ? (
                          <ChevronDown size={13} className="text-text-primary" />
                        ) : (
                          <ChevronRight size={13} className="text-text-muted group-hover:text-text-primary" />
                        )}
                      </span>
                      <Hash
                        size={14}
                        className={twMerge(
                          'shrink-0 transition-colors',
                          hasActiveFile ? 'text-accent-primary' : 'text-accent-primary/70 group-hover:text-accent-primary'
                        )}
                      />
                      <span className="truncate font-mono text-[11.5px] tracking-tight">{item.tag}</span>
                    </div>

                    <span
                      className={twMerge(
                        'ml-2 px-1.5 py-0.2 text-[10px] font-semibold rounded-full shrink-0 tabular-nums transition-colors',
                        hasActiveFile
                          ? 'bg-accent-primary/20 text-accent-primary'
                          : 'bg-bg-hover text-text-muted group-hover:text-text-secondary'
                      )}
                    >
                      {item.count}
                    </span>
                  </button>

                  {expanded && (
                    <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-border-subtle/50 ml-3.5 my-0.5">
                      {item.files.map((file) => {
                        const isSelected = file.id === activeFileId;
                        return (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => {
                              onSelectFile(file.id);
                              onCloseMobile();
                            }}
                            className={twMerge(
                              'w-full flex items-center gap-2 py-1 px-2 rounded-md text-xs transition-all duration-150 cursor-pointer text-left group',
                              isSelected
                                ? 'bg-bg-hover text-accent-primary font-medium'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                            )}
                          >
                            <FileText
                              size={13}
                              className={twMerge(
                                'shrink-0 transition-colors',
                                isSelected ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
                              )}
                            />
                            <span className="truncate flex-1">{file.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
