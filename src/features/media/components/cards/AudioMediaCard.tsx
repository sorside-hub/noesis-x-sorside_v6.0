import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  FileText, 
  Edit2, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Loader2,
  Mic,
  Music,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { MediaAttachment } from '../../../../lib/db';
import { MediaCategory, LinkedNoteInfo } from '../../types';

interface AudioMediaCardProps {
  item: MediaAttachment;
  selectedCategory: MediaCategory | null;
  linkedNotes: LinkedNoteInfo[];
  playingId: string | null;
  copiedId: string | null;
  editingId: string | null;
  editTitle: string;
  transcribingId: string | null;
  onToggleAudio: (item: MediaAttachment) => void;
  onStartEdit: (item: MediaAttachment) => void;
  onEditTitleChange: (val: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onSaveRename: (id: string) => void;
  onCopyLink: (item: MediaAttachment, type?: 'markdown' | 'url') => void;
  onTranscribe: (item: MediaAttachment) => void;
  onMoveToTrash: (item: MediaAttachment) => void;
  onRestoreFromTrash: (item: MediaAttachment) => void;
  onConfirmPermanentDelete: (item: MediaAttachment) => void;
  onNavigateToNote: (noteId: string) => void;
}

export const AudioMediaCard: React.FC<AudioMediaCardProps> = ({
  item,
  selectedCategory,
  linkedNotes,
  playingId,
  copiedId,
  editingId,
  editTitle,
  transcribingId,
  onToggleAudio,
  onStartEdit,
  onEditTitleChange,
  onRenameKeyDown,
  onSaveRename,
  onCopyLink,
  onTranscribe,
  onMoveToTrash,
  onRestoreFromTrash,
  onConfirmPermanentDelete,
  onNavigateToNote
}) => {
  const isVoice = item.type === 'voice_memo';
  const IconType = isVoice ? Mic : Music;
  const isPlaying = playingId === item.id;
  const isUnused = linkedNotes.length === 0;

  // File type detection for badge
  const cleanFilename = item.url.split('/').pop()?.split('?')[0] || item.title || '';
  const rawExt = (cleanFilename.split('.').pop() || (item.title.split('.').pop() || '')).toLowerCase();
  const ext = isVoice 
    ? 'VOICE' 
    : ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'weba', 'webm', 'flac'].includes(rawExt) 
      ? rawExt.toUpperCase() 
      : 'AUDIO';

  // Local audio seeking state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      onToggleAudio(item); // this will turn off playingId
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isDragging, item, onToggleAudio]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-2xl bg-bg-surface border transition-all shadow-xs hover:shadow-md p-3.5 flex flex-col justify-between space-y-3 ${
      isPlaying ? 'border-accent-primary ring-1 ring-accent-primary/20' : 'border-border-default hover:border-accent-primary/50'
    }`}>
      <audio ref={audioRef} src={item.url} preload="metadata" />
      {/* Top Section */}
      <div>
        {editingId === item.id ? (
          <div className="flex items-center gap-2.5 mb-1.5">
            <button
              type="button"
              onClick={() => onToggleAudio(item)}
              className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                isPlaying
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20'
              }`}
              title={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => onRenameKeyDown(e, item.id)}
              onBlur={() => onSaveRename(item.id)}
              autoFocus
              className="flex-1 text-xs font-semibold bg-bg-elevated border border-accent-primary rounded px-2 py-1 focus:outline-none text-text-primary"
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2.5">
            {/* Left: Play/Pause Button + Title & Date Column */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onToggleAudio(item)}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isPlaying
                    ? 'bg-accent-primary text-white shadow-xs scale-105 ring-2 ring-accent-primary/30'
                    : 'bg-accent-primary/10 border border-accent-primary/20 text-accent-primary hover:bg-accent-primary hover:text-white transition-colors'
                }`}
                title={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <h3 
                  className="text-xs font-semibold text-text-primary truncate cursor-pointer hover:text-accent-primary transition-colors" 
                  title={item.title}
                  onClick={() => onToggleAudio(item)}
                >
                  {item.title}
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Right: Badge */}
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border font-mono shrink-0 shadow-2xs mt-0.5 ${
              isVoice 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-teal-500/10 text-teal-500 border-teal-500/20'
            }`}>
              {ext}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Slider */}
      <div className="pt-1 px-0.5 space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            disabled={!isPlaying && duration === 0}
            className="w-full h-1.5 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary disabled:cursor-not-allowed disabled:opacity-60 border border-border-subtle/40"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Usage Status */}
      <div className="pt-2 border-t border-border-subtle">
        {isUnused ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium w-full">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">Tidak Terkait Catatan</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <span className="text-[10px] text-text-muted font-medium block">
              Dipakai di {linkedNotes.length} catatan:
            </span>
            <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto custom-scrollbar">
              {linkedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onNavigateToNote(note.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-[10px] font-medium transition-colors truncate max-w-full cursor-pointer"
                  title={`Buka catatan: ${note.name}`}
                >
                  <FileCheck className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{note.name || 'Untitled Note'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Actions Section */}
      <div className="pt-2 border-t border-border-subtle/70">
        {/* Secondary Action Toolbar */}
        <div className="flex items-center justify-between gap-1 text-xs">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1">
            {selectedCategory !== 'trash' && !item.deletedAt && (
              <button
                type="button"
                onClick={() => onTranscribe(item)}
                disabled={transcribingId === item.id}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                title={transcribingId === item.id ? "Mentranskripsikan..." : "Transkrip ke Catatan"}
              >
                {transcribingId === item.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-primary" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onStartEdit(item)}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors cursor-pointer"
              title="Ubah Judul"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onCopyLink(item, 'markdown')}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              title="Salin Markdown Link"
            >
              {copiedId === item.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1">
            {selectedCategory === 'trash' || item.deletedAt ? (
              <>
                <button
                  type="button"
                  onClick={() => onRestoreFromTrash(item)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  title="Pulihkan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmPermanentDelete(item)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Hapus Media Permanen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onMoveToTrash(item)}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Pindahkan ke Sampah"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Any existing transcript preview if we add transcript to db schema later */}
      {/* {(item as any).transcript && (
        <div className="mt-2 p-2.5 rounded-xl bg-bg-elevated/60 border border-border-subtle/50 flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 text-accent-primary mt-0.5 shrink-0" />
          <p className="text-xs text-text-secondary line-clamp-2 italic leading-relaxed">
            &ldquo;{(item as any).transcript}&rdquo;
          </p>
        </div>
      )} */}
    </div>
  );
};
