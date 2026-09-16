import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  X, 
  ClipboardList, 
  FileText, 
  Calendar, 
  Tag, 
  Layers, 
  Check, 
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  Plus,
  Sparkles,
  Info
} from 'lucide-react';
import { VaultData, FileNode, NoteMetadata } from '../../../types/vault';
import { useTemplateSettings } from '../hooks/useTemplateSettings';
import { 
  TemplateItem, 
  processTemplateVariables, 
  mergeTemplateMetadata 
} from '../utils/templateUtils';

export type TemplateInsertionMode = 'insert' | 'replace' | 'append';

interface InsertTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: VaultData;
  activeNode: FileNode | null;
  onInsertContent: (processedContent: string, mode: TemplateInsertionMode) => void;
  onUpdateMetadata?: (nodeId: string, metadata: Partial<NoteMetadata>) => void;
  onCreateTemplateNote?: (targetFolderId?: string | null) => void;
}

export const InsertTemplateModal: React.FC<InsertTemplateModalProps> = ({
  isOpen,
  onClose,
  vault,
  activeNode,
  onInsertContent,
  onUpdateMetadata,
  onCreateTemplateNote,
}) => {
  const { settings, templates, activeTemplateFolder } = useTemplateSettings(vault);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [insertionMode, setInsertionMode] = useState<TemplateInsertionMode>('insert');
  const [mobileTab, setMobileTab] = useState<'list' | 'preview'>('list');
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [modalHeight, setModalHeight] = useState<number>(540);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.descriptionSnippet.toLowerCase().includes(q);
      const matchType = t.metadata?.noteType?.toLowerCase().includes(q);
      const matchTags = t.metadata?.tags?.some((tag) => tag.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchType || matchTags;
    });
  }, [templates, searchQuery]);

  // Selected template item
  const selectedTemplate = useMemo<TemplateItem | null>(() => {
    if (filteredTemplates.length === 0) return null;
    const clampedIndex = Math.min(Math.max(0, selectedIndex), filteredTemplates.length - 1);
    return filteredTemplates[clampedIndex] || null;
  }, [filteredTemplates, selectedIndex]);

  // Focus search input on open only on desktop non-touch screens to avoid auto-opening virtual keyboard on mobile
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setMobileTab('list');

      // Lock height to physical screen height so mobile virtual keyboard does not shrink the popup
      if (typeof window !== 'undefined') {
        const screenH = Math.max(
          window.innerHeight, 
          window.screen?.height ? Math.round(window.screen.height * 0.72) : 600
        );
        const targetH = Math.min(Math.max(Math.round(screenH * 0.74), 480), 580);
        setModalHeight(targetH);
      }

      const isMobileDevice = typeof window !== 'undefined' && (
        window.innerWidth < 640 || 
        ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0)
      );

      if (!isMobileDevice) {
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      }
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll active list item into view
  useEffect(() => {
    if (listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Resolve target folder name for active note
  const parentFolder = useMemo<FileNode | null>(() => {
    if (!activeNode || !activeNode.parentId || !vault.nodes) return null;
    return vault.nodes[activeNode.parentId] || null;
  }, [activeNode, vault]);

  // Preview processed template content
  const previewContent = useMemo(() => {
    if (!selectedTemplate) return '';
    const rawContent = selectedTemplate.node.content || '';
    return processTemplateVariables(rawContent, {
      targetNodeTitle: activeNode?.name || 'Catatan Baru',
      folderName: parentFolder?.name || 'Root Vault',
      now: new Date(),
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
    });
  }, [selectedTemplate, activeNode, parentFolder, settings]);

  // Execute template insertion
  const handleExecuteInsert = () => {
    if (!selectedTemplate) return;

    // 1. Process variables
    const rawContent = selectedTemplate.node.content || '';
    const processed = processTemplateVariables(rawContent, {
      targetNodeTitle: activeNode?.name || 'Catatan Baru',
      folderName: parentFolder?.name || 'Root Vault',
      now: new Date(),
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
    });

    // 2. Insert into editor
    onInsertContent(processed, insertionMode);

    // 3. Merge metadata if target note exists and template has metadata
    if (activeNode && onUpdateMetadata && selectedTemplate.metadata) {
      const merged = mergeTemplateMetadata(activeNode.metadata || {}, selectedTemplate.metadata);
      if (Object.keys(merged).length > 0) {
        onUpdateMetadata(activeNode.id, merged);
      }
    }

    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          filteredTemplates.length > 0 ? (prev + 1) % filteredTemplates.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          filteredTemplates.length > 0 ? (prev - 1 + filteredTemplates.length) % filteredTemplates.length : 0
        );
      } else if (e.key === 'Enter') {
        // Don't trigger if user is holding Shift or Alt
        if (!e.shiftKey && !e.altKey) {
          e.preventDefault();
          handleExecuteInsert();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTemplates, selectedIndex, selectedTemplate, insertionMode]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-3.5 sm:p-5 pt-8 sm:pt-0 sm:items-center overflow-hidden animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        style={isMobile ? { height: `${modalHeight}px` } : undefined}
        className="bg-bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-4xl sm:h-[85vh] sm:max-h-[720px] shrink-0 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border-default bg-bg-surface flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shrink-0">
              <ClipboardList size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-text-heading tracking-tight truncate">
                  Sisipkan Template
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-accent-primary/15 text-accent-primary border border-accent-primary/25 whitespace-nowrap shrink-0">
                  {templates.length}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate flex items-center gap-1.5">
                <FolderOpen size={12} className="text-accent-primary shrink-0" />
                <span>Folder: <strong className="text-text-secondary">{activeTemplateFolder?.name || 'Templates'}</strong></span>
                {activeNode && (
                  <span className="hidden sm:inline">
                    <span className="text-border-default mx-1">•</span>
                    <span>Ke: <strong className="text-text-primary">"{activeNode.name}"</strong></span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer shrink-0"
            title="Tutup (Esc)"
            aria-label="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 sm:p-3.5 border-b border-border-subtle bg-bg-canvas/40 shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template (judul, konten, tag)..."
              className="w-full bg-bg-primary border border-border-default hover:border-accent-primary/40 focus:border-accent-primary rounded-xl pl-9 sm:pl-10 pr-9 sm:pr-24 py-2 sm:py-2.5 text-sm sm:text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary transition-all font-medium"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            ) : (
              <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 text-[10px] text-text-muted font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-subtle">
                <span>↑↓ navigasi</span>
                <span>↵ pilih</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View Switcher Tabs (< md only) */}
        <div className="md:hidden flex items-center border-b border-border-subtle bg-bg-canvas/60 px-3 py-1.5 gap-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-center transition-colors cursor-pointer ${
              mobileTab === 'list'
                ? 'bg-accent-primary text-accent-contrast shadow-2xs'
                : 'bg-bg-primary text-text-muted hover:text-text-primary border border-border-subtle'
            }`}
          >
            Daftar ({filteredTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            disabled={!selectedTemplate}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-center transition-colors cursor-pointer truncate disabled:opacity-40 disabled:cursor-not-allowed ${
              mobileTab === 'preview'
                ? 'bg-accent-primary text-accent-contrast shadow-2xs'
                : 'bg-bg-primary text-text-muted hover:text-text-primary border border-border-subtle'
            }`}
          >
            Pratinjau {selectedTemplate ? `(${selectedTemplate.title})` : ''}
          </button>
        </div>

        {/* Body 2-Column Split: Template List (Left) & Rich Preview (Right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border-subtle">
          
          {/* Left: Template List */}
          <div 
            ref={listContainerRef}
            className={`${
              mobileTab === 'list' ? 'flex flex-col' : 'hidden'
            } md:flex md:flex-col w-full md:w-[42%] lg:w-[38%] overflow-y-auto p-3 space-y-1.5 shrink-0 bg-bg-canvas/20 custom-scrollbar`}
          >
            {filteredTemplates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-3 my-auto overflow-y-auto">
                <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center mx-auto shrink-0">
                  <FileText size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-text-heading">
                    {templates.length === 0 ? 'Belum Ada Template' : 'Tidak Ditemukan'}
                  </h4>
                  <p className="text-xs text-text-muted max-w-[260px] mx-auto leading-relaxed">
                    {templates.length === 0
                      ? `Buat catatan di dalam folder "${activeTemplateFolder?.name || 'Templates'}" untuk menjadikannya template.`
                      : `Tidak ada template yang cocok dengan pencarian "${searchQuery}".`}
                  </p>
                </div>
                {onCreateTemplateNote && templates.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateTemplateNote(activeTemplateFolder?.id || null);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-accent-contrast rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs active:scale-98"
                  >
                    <Plus size={14} />
                    <span>Buat Template Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTemplates.map((template, idx) => {
                const isSelected = selectedTemplate?.id === template.id;
                const noteType = template.metadata?.noteType;
                const tags = template.metadata?.tags || [];

                return (
                  <div
                    key={template.id}
                    data-selected={isSelected}
                    onClick={() => {
                      setSelectedIndex(idx);
                      // On mobile, auto navigate to preview tab when tapping item
                      setMobileTab('preview');
                    }}
                    onDoubleClick={handleExecuteInsert}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none group ${
                      isSelected
                        ? 'bg-accent-primary/10 border-accent-primary/35 shadow-xs'
                        : 'bg-bg-surface hover:bg-bg-hover border-border-subtle hover:border-border-default'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-xs font-bold leading-snug truncate ${
                        isSelected ? 'text-accent-primary' : 'text-text-primary group-hover:text-text-heading'
                      }`}>
                        {template.title}
                      </h4>
                      {noteType && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-bg-canvas text-text-muted border border-border-subtle">
                          {noteType}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-text-muted line-clamp-2 mt-1 leading-relaxed">
                      {template.descriptionSnippet}
                    </p>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-bg-canvas text-text-secondary border border-border-subtle"
                          >
                            <Tag size={9} className="text-accent-primary" />
                            <span>{tag.replace(/^#/, '')}</span>
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="text-[10px] text-text-muted self-center">
                            +{tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Rich Preview & Metadata Inspector */}
          <div className={`${
            mobileTab === 'preview' ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col min-w-0 bg-bg-surface overflow-hidden`}>
            {selectedTemplate ? (
              <>
                {/* Preview Header & Controls */}
                <div className="p-3 sm:p-3.5 border-b border-border-subtle bg-bg-canvas/30 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileTab('list')}
                      className="md:hidden p-1 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Kembali ke daftar template"
                      aria-label="Kembali ke daftar template"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-heading">
                        <Sparkles size={14} className="text-accent-primary shrink-0" />
                        <span className="truncate">{selectedTemplate.title}</span>
                      </div>
                      <span className="text-[11px] text-text-muted mt-0.5 block truncate">
                        Variabel dinamis dievaluasi otomatis untuk catatan aktif
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center bg-bg-primary p-0.5 rounded-lg border border-border-default text-[11px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setInsertionMode('insert')}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        insertionMode === 'insert'
                          ? 'bg-accent-primary text-accent-contrast shadow-2xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      title="Sisipkan di posisi kursor aktif"
                    >
                      Di Kursor
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsertionMode('append')}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        insertionMode === 'append'
                          ? 'bg-accent-primary text-accent-contrast shadow-2xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      title="Tambahkan di bagian paling bawah catatan"
                    >
                      Di Akhir
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsertionMode('replace')}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        insertionMode === 'replace'
                          ? 'bg-rose-500 text-white shadow-2xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      title="Ganti seluruh isi catatan yang ada"
                    >
                      Ganti Semua
                    </button>
                  </div>
                </div>

                {/* Metadata Sync Inspector */}
                {selectedTemplate.metadata && (
                  <div className="px-4 py-2 bg-accent-primary/5 border-b border-border-subtle flex flex-wrap items-center gap-2 text-[11px] shrink-0">
                    <Layers size={13} className="text-accent-primary shrink-0" />
                    <span className="text-text-secondary font-medium">Metadata yang akan disinkronkan:</span>
                    
                    {selectedTemplate.metadata.noteType && (
                      <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-accent-primary/30 text-accent-primary font-semibold text-[10px]">
                        Type: {selectedTemplate.metadata.noteType}
                      </span>
                    )}

                    {selectedTemplate.metadata.status && (
                      <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-text-secondary text-[10px]">
                        Status: {selectedTemplate.metadata.status}
                      </span>
                    )}

                    {selectedTemplate.metadata.tags && selectedTemplate.metadata.tags.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-text-secondary text-[10px]">
                        Tags: +{selectedTemplate.metadata.tags.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                {/* Live Content Preview (Markdown text format) */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-bg-surface">
                  <pre className="font-mono text-xs text-text-primary whitespace-pre-wrap break-words leading-relaxed select-text font-normal">
                    {previewContent || '(Template ini tidak memiliki teks konten)'}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-text-muted">
                <div className="space-y-2">
                  <Info size={28} className="mx-auto text-text-muted/60" />
                  <p className="text-xs">Pilih salah satu template di sebelah kiri untuk melihat pratinjau.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-border-default bg-bg-canvas/30 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-text-muted hidden sm:flex items-center gap-1.5">
            <Info size={13} className="text-accent-primary" />
            <span>Mode: <strong className="text-text-primary capitalize">{insertionMode === 'insert' ? 'Sisipkan di Kursor' : insertionMode === 'append' ? 'Tambahkan di Akhir' : 'Ganti Seluruh Isi'}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors cursor-pointer text-center"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedTemplate}
              onClick={handleExecuteInsert}
              className="px-5 py-2 text-xs font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 rounded-xl transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              <Check size={14} />
              <span>Sisipkan Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
