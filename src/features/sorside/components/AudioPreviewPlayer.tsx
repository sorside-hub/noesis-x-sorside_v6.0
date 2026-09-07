import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Music } from 'lucide-react';

interface AudioPreviewPlayerProps {
  preview: { title: string; url: string } | null;
  onClose: () => void;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({
  preview,
  onClose
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (preview && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Audio autoplay prevented or error:', e);
        setIsPlaying(false);
      });
    }
  }, [preview]);

  if (!preview) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-bg-surface/95 border border-border-default backdrop-blur-md shadow-2xl rounded-2xl p-3.5 flex items-center gap-3.5 animate-in slide-in-from-bottom-3 duration-200">
      <audio
        ref={audioRef}
        src={preview.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        muted={isMuted}
      />

      {/* Track Icon & Info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center shrink-0">
          <Music size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-text-heading truncate">
            {preview.title}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Progress slider */}
      <div className="hidden sm:flex flex-1 items-center px-2">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-border-default rounded-lg appearance-none cursor-pointer accent-accent-primary"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
