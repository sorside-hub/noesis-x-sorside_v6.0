import React from 'react';
import { MediaCategory } from '../types';
import { CATEGORIES_CONFIG } from '../constants';
import { MediaAttachment } from '../../../lib/db';

interface MediaHubHomeProps {
  activeMedia: MediaAttachment[];
  getCategoryCount: (catId: MediaCategory) => number;
  onOpenCategory: (catId: MediaCategory) => void;
}

export const MediaHubHome: React.FC<MediaHubHomeProps> = ({
  activeMedia,
  getCategoryCount,
  onOpenCategory,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Kategori Media & Berkas
        </h2>
        <span className="text-xs text-text-muted font-mono">
          Total {activeMedia.length} item aktif
        </span>
      </div>

      {/* 2 Kolom Grid di Mobile & Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {CATEGORIES_CONFIG.map((cat) => {
          const count = getCategoryCount(cat.id);
          const IconComponent = cat.icon;

          return (
            <div
              key={cat.id}
              onClick={() => onOpenCategory(cat.id)}
              className={`group relative p-3.5 sm:p-4 rounded-2xl bg-bg-surface hover:bg-bg-elevated border border-border-default ${cat.accentBorder} transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden`}
            >
              {/* Background Subtle Gradient Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 bg-gradient-to-bl from-accent-primary to-transparent rounded-bl-full transition-opacity pointer-events-none" />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${cat.iconBg} ${cat.iconColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                    {cat.title}
                  </h3>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-text-muted font-medium">Jumlah:</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded-md ${
                  cat.id === 'trash' && count > 0
                    ? 'bg-red-500/10 text-red-500'
                    : cat.id === 'unused' && count > 0
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-bg-elevated text-text-primary'
                }`}>
                  {count} File
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
