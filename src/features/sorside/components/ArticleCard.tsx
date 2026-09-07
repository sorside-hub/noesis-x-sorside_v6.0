import React, { useState } from 'react';
import { SorsideArticle, SORSIDE_SIDE_CONFIG } from '../../../types/sorside';
import { Edit3, Trash2, Globe, Check } from 'lucide-react';

interface ArticleCardProps {
  article: SorsideArticle;
  onEdit: (article: SorsideArticle) => void;
  onDelete: (id: string, title: string) => void;
  onTogglePublish: (id: string, currentStatus: boolean) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onEdit,
  onDelete,
  onTogglePublish
}) => {
  const [copied, setCopied] = useState(false);
  const categoryKey = article.category || article.side || 'stories';
  const sideConfig = SORSIDE_SIDE_CONFIG[categoryKey as keyof typeof SORSIDE_SIDE_CONFIG] || SORSIDE_SIDE_CONFIG.stories;

  const handleCopySlug = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slugToCopy = article.slug || article.id;
    navigator.clipboard.writeText(slugToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onEdit(article)}
      className="group relative flex flex-col justify-between bg-bg-surface border border-border-default hover:border-border-hover rounded-xl p-5 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Top Header: Category Badge & Published Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border leading-tight lowercase ${sideConfig.badgeClass}`}
            >
              {categoryKey}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              title={article.published ? 'Status: Published' : 'Status: Draft'}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-tight select-none ${
                article.published
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-text-muted/10 text-text-muted border-border-default'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${article.published ? 'bg-emerald-400' : 'bg-text-muted'}`} />
              <span>{article.published ? 'Published' : 'Draft'}</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-text-heading group-hover:text-accent-primary transition-colors line-clamp-2 mb-2 leading-snug">
          {article.title}
        </h3>

        {/* Meta Info: Release Date */}
        <div className="flex items-center gap-3 text-xs text-text-muted mb-3 font-mono">
          <span>{article.date || article.release_date || 'Tanpa Tanggal'}</span>
        </div>

        {/* Snippet */}
        <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed mb-4">
          {article.snippet || article.content?.slice(0, 160) || article.full_text?.slice(0, 160) || ''}
        </p>
      </div>

      {/* Bottom Footer & Action Buttons */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted mt-2">
        <button
          type="button"
          onClick={handleCopySlug}
          title="Salin Slug ID"
          className="flex items-center gap-1 hover:text-text-primary transition-colors cursor-pointer font-mono text-[11px] truncate max-w-[170px]"
        >
          {copied ? (
            <Check size={12} className="text-emerald-400 shrink-0" />
          ) : (
            <Globe size={12} className="shrink-0 opacity-60" />
          )}
          <span className="truncate">{article.slug || article.id}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(article);
            }}
            title="Edit Artikel"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(article.id, article.title);
            }}
            title="Hapus Artikel"
            className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error-bg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
