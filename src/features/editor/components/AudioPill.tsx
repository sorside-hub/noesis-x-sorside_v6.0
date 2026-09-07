import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Music, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { mediaGC } from '../../../lib/mediaGarbageCollector';
import { db } from '../../../lib/db';
import { moveMediaToTrash } from '../../../lib/mediaStorage';

export interface AudioPillProps {
  src: string;
  title?: string;
  className?: string;
  onDelete?: () => void;
}

export const AudioPill: React.FC<AudioPillProps> = ({
  src,
  title = 'Voice Note',
  className = '',
  onDelete,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    // Media GC: When mounted, unmark for deletion. When unmounted, mark it.
    if (src.startsWith('http')) {
      mediaGC.unmarkForDeletion(src);
    }
    
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      // Media GC: If the pill is unmounted (deleted or navigated away), mark for potential background deletion
      if (src.startsWith('http')) {
        mediaGC.markForDeletion(src);
      }
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isDragging, src]);

  const dismissKeyboard = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      if (document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      if ('preventDefault' in e) e.preventDefault();
    }
    dismissKeyboard();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.error('Audio play error:', err));
    }
  };

  const cyclePlaybackRate = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();
    dismissKeyboard();
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
    if ('preventDefault' in e) e.preventDefault();
    dismissKeyboard();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDeleteFromLibrary = async () => {
    setIsDeleting(true);
    try {
      const media = await db.media_attachments.where('url').equals(src).first();
      if (media) {
        await moveMediaToTrash(media.id);
      }
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting media from library:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveFromNote = () => {
    if (onDelete) onDelete();
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className={`noesis-audio-pill my-3 inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-bg-surface/90 dark:bg-[#0c0c0d] border border-border-default/80 hover:border-accent-primary/40 shadow-xs backdrop-blur-md select-none transition-all w-full max-w-lg ${className}`}
        contentEditable={false}
        onMouseDown={(e) => { e.stopPropagation(); }}
        onTouchStart={(e) => { e.stopPropagation(); }}
        onPointerDown={(e) => { e.stopPropagation(); }}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <audio ref={audioRef} src={src} preload="metadata" />

        {/* Main Bar Top / Left: Play Button + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={togglePlay}
            className="shrink-0 w-9 h-9 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary truncate">
              <Music className="w-3.5 h-3.5 text-accent-primary shrink-0 opacity-80" />
              <span className="truncate">{title}</span>
            </div>

            {/* Interactive Progress Bar */}
            <div className="relative flex items-center mt-1.5 h-3">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentTime(newTime);
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime;
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Controls Right / Bottom: Duration + Speed + Volume */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 text-xs text-text-muted border-t sm:border-t-0 border-border-subtle pt-1.5 sm:pt-0">
          <span className="font-mono text-[11px] text-text-secondary min-w-[65px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-bg-hover hover:bg-bg-elevated text-text-primary hover:text-accent-primary transition-colors cursor-pointer border border-border-subtle"
            title="Ubah kecepatan putar"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={toggleMute}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <a
            href={src}
            download={title}
            target="_blank"
            rel="noopener noreferrer"
            onMouseDown={(e) => { e.stopPropagation(); }}
            onTouchStart={(e) => { e.stopPropagation(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Unduh audio"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          {onDelete && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors cursor-pointer ml-1"
              title="Hapus audio"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Hapus Audio?</h3>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleRemoveFromNote}
                disabled={isDeleting}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated border border-border-subtle text-text-primary hover:bg-bg-hover active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Hapus dari Catatan</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteFromLibrary}
                disabled={isDeleting}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Hapus dari Media</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors mt-2"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
