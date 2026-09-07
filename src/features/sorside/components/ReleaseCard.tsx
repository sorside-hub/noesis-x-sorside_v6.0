import React, { useState } from 'react';
import { SorsideRelease, SorsideTrack } from '../../../types/sorside';
import { resolveCoverImageUrl, DEFAULT_SORSIDE_COVER_URL } from '../../../lib/sorsideService';
import {
  Disc,
  Music,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  Plus,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  FileText,
  AlignLeft,
  Share2
} from 'lucide-react';

interface ReleaseCardProps {
  release: SorsideRelease;
  onEdit: (release: SorsideRelease) => void;
  onDelete: (id: string, title: string) => void;
  onAddTrack?: (releaseId: string, nextNumber: number) => void;
  onEditTrack?: (track: SorsideTrack) => void;
  onDeleteTrack?: (trackId: string, trackTitle: string, releaseId: string) => void;
  activeAudioPreview: { title: string; url: string } | null;
  onToggleAudioPreview: (title: string, url: string) => void;
}

export const ReleaseCard: React.FC<ReleaseCardProps> = ({
  release,
  onEdit,
  onDelete,
  onAddTrack,
  onEditTrack,
  onDeleteTrack,
  activeAudioPreview,
  onToggleAudioPreview
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tracks = release.tracks || [];
  const streamLinks = release.stream_links || {};
  const credits = release.credits || {};

  const isPlayingCurrent =
    activeAudioPreview?.url === release.audio_url && Boolean(release.audio_url);

  // Type badge styling
  const typeBadgeColors = {
    SINGLE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    EP: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    ALBUM: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }[release.type] || 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';

  const resolvedCoverUrl = resolveCoverImageUrl(release.cover || release.cover_url || release.cover_art);

  const trackCountDisplay =
    release.type === 'SINGLE'
      ? '1 track'
      : tracks.length > 0
      ? `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'}`
      : release.song_count
      ? release.song_count.toLowerCase().replace('songs', 'tracks').replace('song', 'track')
      : '0 tracks';

  return (
    <div
      onClick={() => onEdit(release)}
      className="group flex flex-col justify-between bg-bg-surface border border-border-default hover:border-border-hover rounded-2xl p-5 transition-all duration-200 shadow-xs cursor-pointer"
    >
      <div>
        {/* Top Header: Cover Preview & Main Info */}
        <div className="flex gap-4 items-start mb-4">
          {/* Cover Art Thumbnail */}
          <div className="relative w-20 h-20 rounded-xl bg-bg-primary border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center group shadow-xs">
            {resolvedCoverUrl ? (
              <img
                src={resolvedCoverUrl}
                alt={release.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== DEFAULT_SORSIDE_COVER_URL) {
                    target.src = DEFAULT_SORSIDE_COVER_URL;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-text-muted">
                <Disc size={28} className="opacity-40" />
                <span className="text-[9px] font-mono mt-1 opacity-60 truncate max-w-[65px]">
                  cover-all
                </span>
              </div>
            )}

            {/* Play Button Overlay if audio_url exists */}
            {release.audio_url && (
              <button
                type="button"
                onClick={() => onToggleAudioPreview(release.title, release.audio_url!)}
                title={isPlayingCurrent ? 'Jeda Audio' : 'Putar Preview Audio'}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                {isPlayingCurrent ? <Pause size={20} /> : <Play size={20} />}
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Badges: Type, Status, Catalog Number */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${typeBadgeColors}`}
              >
                {release.type}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  release.published
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {release.published ? 'PUBLISHED' : 'DRAFT'}
              </span>
              {release.catalog_number && (
                <span className="text-[10px] font-mono font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded border border-accent-primary/20">
                  {release.catalog_number}
                </span>
              )}
            </div>

            {/* Order index & Track count placed below badges */}
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              {release.order_index !== undefined && release.order_index !== null && (
                <>
                  <span className="font-mono font-semibold text-text-secondary">
                    #{release.order_index}
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="font-medium text-text-muted">{trackCountDisplay}</span>
            </div>

            <h3
              onClick={() => onEdit(release)}
              className="text-base font-bold text-text-heading hover:text-accent-primary transition-colors cursor-pointer leading-tight truncate"
            >
              {release.title}
            </h3>

            <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
              {release.release_date && <span className="font-mono">{release.release_date}</span>}
              {release.duration && (
                <span className="flex items-center gap-1 font-mono">
                  <Clock size={11} className="opacity-70" />
                  <span>{release.duration}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tagline */}
        {release.tagline && (
          <p className="text-xs text-text-secondary italic line-clamp-2 leading-relaxed mb-2 p-2.5 rounded-xl bg-bg-primary border border-border-subtle">
            "{release.tagline}"
          </p>
        )}

        {/* Origin Info (placed below tagline) */}
        {release.origin_slug && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-3.5">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-bg-primary border border-border-subtle text-text-muted truncate max-w-full" title={`Origin: ${release.origin_slug}`}>
              📖 {release.origin_slug}
            </span>
          </div>
        )}

        {/* Streaming links pills (Spotify, YouTube, Apple Music) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {streamLinks.spotify && (
            <a
              href={streamLinks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <span>Spotify</span>
              <ExternalLink size={9} />
            </a>
          )}
          {streamLinks.youtube && (
            <a
              href={streamLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <span>YouTube</span>
              <ExternalLink size={9} />
            </a>
          )}
          {(streamLinks.apple_music || streamLinks.appleMusic) && (
            <a
              href={streamLinks.apple_music || streamLinks.appleMusic}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
            >
              <span>Apple Music</span>
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted mt-3">
        <span className="font-mono text-[11px] text-text-muted truncate max-w-[150px]">
          {release.slug || release.id}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(release);
            }}
            title="Edit Rilisan"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(release.id, release.title);
            }}
            title="Hapus Rilisan"
            className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error-bg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
