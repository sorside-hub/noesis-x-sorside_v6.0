import React, { useEffect, useState, useRef } from 'react';
import { Mic, Square, Loader2, X, Play, Pause, RotateCcw, CheckCircle2, Save, Sparkles, FileAudio } from 'lucide-react';
import { useNavigation } from '../../../context/NavigationContext';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { saveVoiceMemo } from '../../../lib/mediaStorage';
import { useVault } from '../../../hooks/useVault';

interface VoiceMemoModalProps {
  vaultState: ReturnType<typeof useVault>;
}

export const VoiceMemoModal: React.FC<VoiceMemoModalProps> = ({ vaultState }) => {
  const { activeModal, closeModal, navigateView, navigateToNote } = useNavigation();
  const {
    isRecording,
    audioBase64,
    audioBlob,
    mimeType,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const [title, setTitle] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConvertingAI, setIsConvertingAI] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  const isOpen = activeModal === 'voice-memo';

  // Handle auto-start recording when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSaveSuccess(false);
      setIsSaving(false);
      setIsConvertingAI(false);
      setRecordSeconds(0);
      setIsPlayingPreview(false);
      setPreviewProgress(0);
      
      const now = new Date();
      const defaultTitle = `Voice Memo ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
      setTitle(defaultTitle);

      clearRecording();
      startRecording();
    } else {
      stopRecording();
      clearRecording();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Timer tracking during recording
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Setup preview audio element when audioBlob changes
  useEffect(() => {
    if (audioBlob && !isRecording) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;

      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration || 0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
      };

      return () => {
        audio.pause();
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob, isRecording]);

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(console.error);
      setIsPlayingPreview(true);
    }
  };

  const handleRestart = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPlayingPreview(false);
    setPreviewProgress(0);
    setErrorMessage(null);
    clearRecording();
    startRecording();
  };

  const handleSaveToMedia = async () => {
    if (!audioBlob && !audioBase64) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = audioBase64 || audioBlob!;
      await saveVoiceMemo(payload, mimeType || 'audio/webm', title);
      setSaveSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save voice memo:', err);
      setErrorMessage(err.message || 'Gagal menyimpan voice memo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    stopRecording();
    clearRecording();
    if (previewAudioRef.current) previewAudioRef.current.pause();
    closeModal();
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-bg-surface border border-border-default rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Mic size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Voice Memo</h3>
              <p className="text-[11px] text-text-muted">Rekam ide cepat & simpan ke Media</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[260px]">
          
          {/* Status: Error */}
          {(recorderError || errorMessage) && (
            <div className="flex flex-col items-center text-center space-y-3 p-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <X size={24} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Terjadi Kendala</h4>
                <p className="text-xs text-text-muted max-w-xs">{recorderError || errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleRestart}
                className="mt-2 px-4 py-2 bg-bg-hover hover:bg-bg-elevated text-xs font-semibold text-text-primary rounded-xl transition-colors cursor-pointer"
              >
                Coba Rekam Lagi
              </button>
            </div>
          )}

          {/* Status: Save Success */}
          {!recorderError && !errorMessage && saveSuccess && (
            <div className="flex flex-col items-center text-center space-y-4 py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">Voice Memo Tersimpan!</h4>
                <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
                  Rekaman suara Anda telah tersimpan rapi di Pustaka Media pada tab <strong className="text-accent-primary">Voice Memo</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigateView('media');
                  }}
                  className="px-4 py-2 bg-accent-primary hover:opacity-90 text-accent-contrast text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileAudio size={14} />
                  <span>Buka Pustaka Media</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-border-default hover:bg-bg-hover text-text-secondary text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* Status: Saving or Converting */}
          {!recorderError && !errorMessage && !saveSuccess && (isSaving || isConvertingAI) && (
            <div className="flex flex-col items-center text-center space-y-3 py-6">
              <Loader2 size={36} className="text-accent-primary animate-spin" />
              <h4 className="text-sm font-semibold text-text-primary">
                {isConvertingAI ? 'Mentranskripsi & Merangkum dengan AI...' : 'Menyimpan ke Pustaka Media...'}
              </h4>
              <p className="text-xs text-text-muted max-w-xs">
                {isConvertingAI ? 'Menghasilkan catatan terstruktur dari rekaman suara Anda.' : 'Mengunggah dan mengarsipkan file audio Anda.'}
              </p>
            </div>
          )}

          {/* Status: Recording Live */}
          {!recorderError && !errorMessage && !saveSuccess && !isSaving && !isConvertingAI && isRecording && (
            <div className="flex flex-col items-center text-center space-y-5 w-full py-2">
              <div className="relative flex items-center justify-center">
                {/* Pulsing ring animation */}
                <span className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-red-500/30 animate-pulse" />
                <button
                  type="button"
                  onClick={stopRecording}
                  className="relative z-10 w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Selesai Rekam"
                >
                  <Square size={22} className="fill-current" />
                </button>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold font-mono tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>MEREKAM ({formatTime(recordSeconds)})</span>
                </div>
                <p className="text-xs text-text-muted">
                  Bicara santai saja. Klik tombol merah ketika selesai.
                </p>
              </div>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-4 py-2 bg-bg-primary border border-border-default text-text-secondary hover:text-text-primary rounded-full text-xs font-medium hover:bg-bg-hover active:scale-95 transition-all cursor-pointer"
                >
                  <X size={14} />
                  <span>Batal</span>
                </button>
              </div>
            </div>
          )}

          {/* Status: Stopped -> Review & Save Screen */}
          {!recorderError && !errorMessage && !saveSuccess && !isSaving && !isConvertingAI && !isRecording && (audioBlob || audioBase64) && (
            <div className="w-full flex flex-col space-y-4 animate-in fade-in">
              
              {/* Title Editor */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Judul Voice Memo
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Beri judul memo suara..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-bg-primary border border-border-default focus:border-accent-primary focus:outline-none text-xs text-text-primary"
                />
              </div>

              {/* Audio Preview Wave / Player Bar */}
              <div className="p-3.5 rounded-2xl bg-bg-primary border border-border-subtle flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="w-10 h-10 rounded-xl bg-accent-primary text-accent-contrast flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-transform cursor-pointer"
                >
                  {isPlayingPreview ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-primary transition-all duration-100"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                    <span>{isPlayingPreview && previewAudioRef.current ? formatTime(previewAudioRef.current.currentTime) : '00:00'}</span>
                    <span>{formatTime(audioDuration || recordSeconds)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRestart}
                  title="Rekam Ulang"
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 border border-border-default hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X size={15} />
                  <span>Batal</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToMedia}
                  className="flex-1 py-2.5 px-4 bg-accent-primary hover:opacity-90 text-accent-contrast text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  <span>Simpan Voice Memo</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
