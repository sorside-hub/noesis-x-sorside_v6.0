import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Mic, 
  Upload, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Music,
  FileAudio,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { uploadAudioBlob, saveMediaMetadata, syncMediaFromSupabaseStorage } from '../../../lib/mediaStorage';
import { db } from '../../../lib/db';
import { getSupabaseConfig } from '../../../lib/supabase';

interface InsertAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAudio: (audioData: { src: string; title: string }) => void;
}

export const InsertAudioModal: React.FC<InsertAudioModalProps> = ({
  isOpen,
  onClose,
  onInsertAudio,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'library'>('record');
  const [audioTitle, setAudioTitle] = useState('Voice Note');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase check
  const supabaseConfig = getSupabaseConfig();
  const isStorageReady = supabaseConfig.isConfigured;

  // Recording State & Hook
  const {
    isRecording,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Local Audio Preview (for recorded or uploaded file)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Filter ketat agar HANYA audio dan voice memo yang muncul di tab pustaka audio
  const isAudioAttachment = (item: any): boolean => {
    if (item.deletedAt) return false;
    // Kecualikan gambar, video, dan dokumen secara mutlak
    if (item.type === 'image' || item.type === 'video' || item.type === 'document') return false;
    if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)($|\?)/i.test(item.url || '')) return false;

    if (item.type === 'audio' || item.type === 'voice_memo') return true;
    if (item.url?.startsWith('data:audio/')) return true;
    return /\.(mp3|wav|m4a|webm|ogg|aac|flac)($|\?)/i.test(item.url || '');
  };

  const loadAudios = React.useCallback(async (forceSync = false) => {
    setIsLoadingLibrary(true);
    try {
      if (forceSync) {
        try {
          const config = getSupabaseConfig();
          if (config.isConfigured) {
            await syncMediaFromSupabaseStorage();
          }
        } catch (syncErr) {
          console.warn('Sync media error:', syncErr);
        }
      }

      let items = await db.media_attachments.toArray();
      let audios = items.filter(isAudioAttachment);

      // Jika pustaka audio lokal kosong dan belum forceSync, coba sinkronisasi sekali dari storage
      if (audios.length === 0 && !forceSync) {
        try {
          const config = getSupabaseConfig();
          if (config.isConfigured) {
            await syncMediaFromSupabaseStorage();
            items = await db.media_attachments.toArray();
            audios = items.filter(isAudioAttachment);
          }
        } catch (e) {
          // ignore
        }
      }

      audios.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLibraryItems(audios);
    } catch (err) {
      console.error('Failed to load audio library:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'library' && isOpen) {
      loadAudios();
    }
  }, [activeTab, isOpen, loadAudios]);

  useEffect(() => {
    const handleUpdate = () => {
      if (activeTab === 'library' && isOpen) {
        loadAudios();
      }
    };
    window.addEventListener('media-updated', handleUpdate);
    return () => window.removeEventListener('media-updated', handleUpdate);
  }, [activeTab, isOpen, loadAudios]);


  // Timer logic for recording
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // When recording stops and we have audioBlob, generate previewUrl
  useEffect(() => {
    if (audioBlob && !isRecording) {
      const url = URL.createObjectURL(audioBlob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob, isRecording]);

  // Reset states on modal open/close
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsUploading(false);
      setUploadProgressMsg('');
      setAudioTitle(`Voice Note ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`);
      clearRecording();
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsPlayingPreview(false);
    } else {
      stopRecording();
      clearRecording();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    }
  }, [isOpen]);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Preview Play/Pause
  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|webm|wav|ogg|aac|flac)$/i)) {
      setErrorMessage('Format file tidak didukung. Harap pilih file audio (.mp3, .m4a, .webm, .wav).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    setAudioTitle(cleanName);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleReRecord = () => {
    clearRecording();
    setPreviewUrl(null);
    setIsPlayingPreview(false);
    setRecordSeconds(0);
    setErrorMessage(null);
  };

  const handleStartRecord = () => {
    setErrorMessage(null);
    setPreviewUrl(null);
    setIsPlayingPreview(false);
    startRecording();
  };

  const handleStopRecord = () => {
    stopRecording();
  };

  // Handle Upload & Insert
  const handleSubmit = async () => {
    if (!isStorageReady) {
      setErrorMessage('Supabase belum dikonfigurasi. Silakan buka Pengaturan > Sinkronisasi untuk menyetel koneksi Supabase Anda.');
      return;
    }

    let blobToUpload: Blob | File | null = null;
    let ext = 'webm';

    if (activeTab === 'record') {
      if (!audioBlob) {
        setErrorMessage('Belum ada rekaman suara. Silakan rekam terlebih dahulu.');
        return;
      }
      blobToUpload = audioBlob;
      ext = audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a') ? 'm4a' : 'webm';
    } else {
      if (!selectedFile) {
        setErrorMessage('Silakan pilih file audio terlebih dahulu.');
        return;
      }
      blobToUpload = selectedFile;
      const fileExt = selectedFile.name.split('.').pop() || 'mp3';
      ext = fileExt.toLowerCase();
    }

    setIsUploading(true);
    setUploadProgressMsg('Mengunggah file audio ke Supabase Storage...');
    setErrorMessage(null);

    try {
      const titleToUse = audioTitle.trim() || (activeTab === 'record' ? 'Voice Memo' : selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Audio');
      const publicUrl = await uploadAudioBlob(blobToUpload, ext, titleToUse);
      await saveMediaMetadata(publicUrl, titleToUse);
      setUploadProgressMsg('Berhasil diunggah!');
      
      // Send to editor
      onInsertAudio({
        src: publicUrl,
        title: titleToUse,
      });

      onClose();
    } catch (err: any) {
      console.error('Upload audio error:', err);
      setErrorMessage(err.message || 'Gagal mengunggah audio ke Supabase Storage.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading && !isRecording) onClose();
      }}
    >
      <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2.5 text-text-primary font-semibold text-sm">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <span>Sisipkan Lampiran Audio</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 border-b border-border-subtle bg-bg-surface px-5 pt-3">
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              setActiveTab('record');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'record'
                ? 'border-accent-primary text-accent-primary font-semibold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Rekam Langsung</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              setActiveTab('upload');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-accent-primary text-accent-primary font-semibold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Audio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              setActiveTab('library');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'library'
                ? 'border-accent-primary text-accent-primary font-semibold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Pustaka Audio</span>
          </button>
        </div>

        {/* Storage Notice if not configured */}
        {!isStorageReady && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
            <HardDrive className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Supabase Storage Belum Terhubung</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                File audio akan diunggah ke bucket <code className="font-mono bg-bg-elevated px-1 py-0.5 rounded">noesis-attachments</code>. Harap atur Supabase di Pengaturan agar file dapat disimpan permanen di cloud.
              </p>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Global Hidden Audio for Preview Playback across all tabs */}
          <audio
            ref={previewAudioRef}
            src={previewUrl || undefined}
            onEnded={() => setIsPlayingPreview(false)}
            className="hidden"
          />

          {/* Audio Title Input - Only in Record & Upload tabs */}
          {activeTab !== 'library' && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Judul / Label Audio
              </label>
              <input
                type="text"
                value={audioTitle}
                onChange={(e) => setAudioTitle(e.target.value)}
                placeholder="Contoh: Rekaman Rapat, Catatan Suara"
                className="w-full px-3 py-2 text-sm bg-bg-elevated/60 border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/50 focus:outline-hidden focus:border-accent-primary transition-all"
              />
            </div>
          )}

          {/* TAB 1: RECORD DIRECTLY */}
          {activeTab === 'record' && (
            <div className="space-y-4">
              {!previewUrl ? (
                /* Recording Stage */
                <div className="py-6 flex flex-col items-center justify-center rounded-2xl bg-bg-elevated/40 border border-border-subtle">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-3">
                      {/* Pulsing record indicator */}
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-red-400 opacity-40"></span>
                        <button
                          type="button"
                          onClick={handleStopRecord}
                          className="relative w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-md transition-transform active:scale-95 cursor-pointer"
                          title="Hentikan Rekaman"
                        >
                          <Square className="w-6 h-6 fill-current" />
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="font-mono font-bold text-lg text-red-500">
                          {formatSeconds(recordSeconds)}
                        </p>
                        <p className="text-xs text-text-muted">Sedang merekam suara... Klik untuk selesai</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={handleStartRecord}
                        className="w-14 h-14 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center hover:opacity-90 shadow-md transition-transform active:scale-95 cursor-pointer"
                        title="Mulai Rekam"
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-text-primary">Mulai Rekaman Baru</p>
                        <p className="text-xs text-text-muted">Klik ikon mic untuk mulai bicara</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Recorded Review Stage */
                <div className="p-4 rounded-2xl bg-bg-elevated/60 border border-border-default space-y-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="font-medium flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" /> Rekaman Siap ({formatSeconds(recordSeconds)})
                    </span>
                    <button
                      type="button"
                      onClick={handleReRecord}
                      className="flex items-center gap-1 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rekam Ulang</span>
                    </button>
                  </div>

                  {/* Audio Player Preview */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-surface border border-border-subtle">
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="w-8 h-8 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 text-xs truncate">
                      <p className="font-medium text-text-primary truncate">{audioTitle || 'Voice Note'}</p>
                      <p className="text-text-muted text-[11px]">Klik play untuk dengar hasil rekaman</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.webm,.wav,.ogg,.aac"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-8 px-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default hover:border-accent-primary/60 bg-bg-elevated/30 hover:bg-bg-elevated/50 transition-all cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">Pilih File Audio</p>
                  <p className="text-xs text-text-muted mt-1">
                    Mendukung format MP3, M4A, WAV, WebM (Maks. 25MB)
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-bg-elevated/60 border border-border-default space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary truncate max-w-[240px]">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Ganti File
                    </button>
                  </div>

                  {/* Audio Player Preview */}
                  {previewUrl && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-surface border border-border-subtle">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="w-8 h-8 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
                      >
                        {isPlayingPreview ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 text-xs truncate">
                        <p className="font-medium text-text-primary truncate">{selectedFile.name}</p>
                        <p className="text-text-muted text-[11px]">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* TAB 3: PUSTAKA AUDIO */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Cari file audio..." 
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-bg-surface border border-border-default focus:border-accent-primary focus:ring-1 focus:ring-accent-primary rounded-xl text-text-primary placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={() => loadAudios(true)}
                  disabled={isLoadingLibrary}
                  title="Sinkronisasi dengan Storage"
                  className="p-2 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLibrary ? 'animate-spin text-accent-primary' : ''}`} />
                </button>
              </div>
              
              <div className="h-64 sm:h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {isLoadingLibrary ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs py-8">
                    <Loader2 className="w-6 h-6 mb-2 animate-spin text-accent-primary" />
                    <p>Memuat pustaka audio...</p>
                  </div>
                ) : libraryItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs py-8">
                    <HardDrive className="w-6 h-6 mb-2 opacity-50" />
                    <p>Pustaka audio Anda masih kosong.</p>
                  </div>
                ) : (
                  libraryItems
                    .filter(item => item.title.toLowerCase().includes(librarySearch.toLowerCase()))
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle bg-bg-surface hover:border-accent-primary/50 transition-colors">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => {
                              if (previewUrl === item.url && isPlayingPreview) {
                                previewAudioRef.current?.pause();
                                setIsPlayingPreview(false);
                              } else {
                                setPreviewUrl(item.url);
                                setTimeout(() => {
                                  previewAudioRef.current?.play().catch(console.warn);
                                  setIsPlayingPreview(true);
                                }, 50);
                              }
                            }}
                            className="w-7 h-7 shrink-0 rounded-full bg-accent-primary/15 text-accent-primary flex items-center justify-center hover:bg-accent-primary hover:text-accent-contrast transition-colors"
                          >
                            {previewUrl === item.url && isPlayingPreview ? (
                              <Pause className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            )}
                          </button>
                          <div className="truncate text-xs">
                            <p className="font-medium text-text-primary truncate">{item.title}</p>
                            <p className="text-[10px] text-text-muted">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertAudio({ src: item.url, title: item.title });
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-xs font-medium hover:bg-accent-primary hover:text-accent-contrast transition-all shrink-0 ml-2"
                        >
                          Sisipkan
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {(errorMessage || recorderError) && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage || recorderError}</span>
            </div>
          )}

          {/* Upload Progress Status */}
          {isUploading && (
            <div className="p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center gap-2.5 text-xs text-accent-primary animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploadProgressMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border-subtle bg-bg-elevated/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isUploading ||
              (activeTab === 'record' && (!audioBlob || isRecording)) ||
              (activeTab === 'upload' && !selectedFile) ||
              activeTab === 'library'
            }
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : activeTab === 'library' ? (
              <span>Pilih dari List di Atas</span>
            ) : (
              <span>Sisipkan ke Catatan</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
