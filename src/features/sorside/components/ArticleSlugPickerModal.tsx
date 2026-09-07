import React, { useState } from 'react';
import { SorsideArticle } from '../../../types/sorside';
import { Search, X, BookOpen, Check } from 'lucide-react';

interface ArticleSlugPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: SorsideArticle[];
  currentSlug: string;
  onSelectSlug: (slug: string) => void;
  title?: string;
}

export const ArticleSlugPickerModal: React.FC<ArticleSlugPickerModalProps> = ({
  isOpen,
  onClose,
  articles,
  currentSlug,
  onSelectSlug,
  title = 'Pilih Origin Article Slug'
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = articles.filter((art) => {
    const slug = art.slug || art.id || '';
    const artTitle = art.title || '';
    const q = search.toLowerCase();
    return slug.toLowerCase().includes(q) || artTitle.toLowerCase().includes(q);
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-border-default flex items-center justify-between shrink-0 bg-bg-surface/80">
          <div className="flex items-center gap-2 text-text-heading font-bold text-sm">
            <BookOpen size={16} className="text-accent-primary" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border-default bg-bg-primary shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari slug artikel..."
              className="w-full pl-9 pr-3 py-2 bg-bg-surface border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
            />
          </div>
        </div>

        {/* Slugs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Option to clear / unselect */}
          {currentSlug && (
            <button
              type="button"
              onClick={() => {
                onSelectSlug('');
                onClose();
              }}
              className="w-full p-2.5 rounded-xl border border-dashed border-status-error/30 text-status-error hover:bg-status-error/10 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer mb-2"
            >
              <span>Kosongkan Origin Slug</span>
              <X size={14} />
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs">
              Tidak ada artikel yang cocok dengan "{search}"
            </div>
          ) : (
            filtered.map((art) => {
              const artSlug = art.slug || art.id;
              const isSelected = currentSlug === artSlug;

              return (
                <button
                  key={art.id || artSlug}
                  type="button"
                  onClick={() => {
                    onSelectSlug(artSlug);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-accent-primary/10 border-accent-primary text-accent-primary font-bold shadow-xs'
                      : 'bg-bg-primary border-border-default hover:border-border-hover text-text-heading'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-bold truncate text-text-heading">
                      📖 {artSlug}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-accent-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-default bg-bg-surface/50 text-[11px] text-text-muted flex justify-between items-center shrink-0">
          <span>Menampilkan {filtered.length} slug artikel</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-bg-primary border border-border-default hover:bg-bg-hover text-text-primary transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
