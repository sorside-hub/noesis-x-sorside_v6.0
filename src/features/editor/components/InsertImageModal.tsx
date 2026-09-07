import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, 
  X, 
  Loader2, 
  AlertCircle, 
  Image as ImageIcon,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { uploadMediaFile, syncMediaFromSupabaseStorage } from '../../../lib/mediaStorage';
import { db } from '../../../lib/db';
import { getSupabaseConfig } from '../../../lib/supabase';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (imageData: { src: string; alt: string; title?: string }) => void;
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [imageTitle, setImageTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase check
  const supabaseConfig = getSupabaseConfig();
  const isStorageReady = supabaseConfig.isConfigured;

  // Local Image Preview (for uploaded file)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Helper untuk membersihkan dan menampilkan judul gambar yang rapi
  const getDisplayTitle = (title?: string, url?: string): string => {
    if (title && title.trim()) {
      const cleaned = title.replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '').replace(/[-_]/g, ' ').trim();
      if (cleaned) return cleaned;
      return title.trim();
    }
    if (url) {
      const filename = url.split('/').pop()?.split('?')[0] || '';
      const withoutExt = filename.replace(/\.[^/.]+$/, '');
      const cleaned = withoutExt.replace(/^(image|audio|video|media)_/i, '').replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '').replace(/[-_]/g, ' ').trim();
      return cleaned || filename || 'Gambar';
    }
    return 'Gambar';
  };

  // Filter ketat agar HANYA gambar yang masuk ke tab pustaka gambar
  const isImageAttachment = (item: any): boolean => {
    if (item.deletedAt) return false;
    // Kecualikan audio, voice_memo, video, dokumen secara mutlak
    if (item.type === 'audio' || item.type === 'voice_memo' || item.type === 'document' || item.type === 'video') return false;
    if (/\.(mp3|wav|m4a|webm|ogg|aac|flac)($|\?)/i.test(item.url || '')) return false;

    if (item.type === 'image') return true;
    if (item.url?.startsWith('data:image/')) return true;
    return /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)($|\?)/i.test(item.url || '');
  };

  const loadImages = React.useCallback(async (forceSync = false) => {
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
      let images = items.filter(isImageAttachment);

      // Jika pustaka gambar lokal kosong dan belum forceSync, coba sinkronisasi sekali dari storage
      if (images.length === 0 && !forceSync) {
        try {
          const config = getSupabaseConfig();
          if (config.isConfigured) {
            await syncMediaFromSupabaseStorage();
            items = await db.media_attachments.toArray();
            images = items.filter(isImageAttachment);
          }
        } catch (e) {
          // ignore
        }
      }

      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLibraryItems(images);
    } catch (err) {
      console.error('Failed to load image library:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'library' && isOpen) {
      loadImages();
    }
  }, [activeTab, isOpen, loadImages]);

  useEffect(() => {
    const handleUpdate = () => {
      if (activeTab === 'library' && isOpen) {
        loadImages();
      }
    };
    window.addEventListener('media-updated', handleUpdate);
    return () => window.removeEventListener('media-updated', handleUpdate);
  }, [activeTab, isOpen, loadImages]);

  // Reset states on modal open/close
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsUploading(false);
      setUploadProgressMsg('');
      setImageTitle('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } else {
      if (previewUrl && selectedFile) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [isOpen]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format file tidak didukung. Harap pilih file gambar (JPG, PNG, GIF, WEBP).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!imageTitle) {
      setImageTitle(cleanName);
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle Submit & Insert
  const handleSubmit = async () => {
    setErrorMessage(null);

    if (activeTab === 'upload') {
      if (!isStorageReady) {
        setErrorMessage('Supabase belum dikonfigurasi. Silakan buka Pengaturan > Sinkronisasi untuk menyetel koneksi Supabase Anda.');
        return;
      }

      if (!selectedFile) {
        setErrorMessage('Silakan pilih file gambar terlebih dahulu.');
        return;
      }

      setIsUploading(true);
      setUploadProgressMsg('Mengunggah gambar ke Supabase Storage...');

      try {
        const titleToUse = imageTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, '') || 'Gambar';
        const publicUrl = await uploadMediaFile(selectedFile, titleToUse);
        setUploadProgressMsg('Berhasil diunggah!');
        
        onInsertImage({
          src: publicUrl,
          alt: titleToUse,
          title: titleToUse,
        });

        onClose();
      } catch (err: any) {
        console.error('Upload image error:', err);
        setErrorMessage(err.message || 'Gagal mengunggah gambar ke Supabase Storage.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2.5 text-text-primary font-semibold text-sm">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span>Sisipkan Gambar</span>
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
        <div className="grid grid-cols-2 border-b border-border-subtle bg-bg-surface px-5 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-accent-primary text-accent-primary font-semibold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Gambar</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'library'
                ? 'border-accent-primary text-accent-primary font-semibold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Pustaka Gambar</span>
          </button>
        </div>

        {/* Storage Notice if not configured */}
        {!isStorageReady && activeTab === 'upload' && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
            <HardDrive className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Supabase Storage Belum Terhubung</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                File gambar akan diunggah ke bucket <code className="font-mono bg-bg-elevated px-1 py-0.5 rounded">noesis-attachments</code>. Harap atur Supabase di Pengaturan.
              </p>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
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
                  <p className="text-sm font-medium text-text-primary">Pilih File Gambar</p>
                  <p className="text-xs text-text-muted mt-1">
                    JPG, PNG, GIF, WEBP, SVG (Maks. 25MB)
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
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Ganti File
                    </button>
                  </div>

                  {/* Image Preview */}
                  {previewUrl && (
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-bg-surface border border-border-subtle flex items-center justify-center">
                       <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PUSTAKA GAMBAR */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Cari gambar..." 
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-bg-surface border border-border-default focus:border-accent-primary focus:ring-1 focus:ring-accent-primary rounded-xl text-text-primary placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={() => loadImages(true)}
                  disabled={isLoadingLibrary}
                  title="Sinkronisasi dengan Storage"
                  className="p-2 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLibrary ? 'animate-spin text-accent-primary' : ''}`} />
                </button>
              </div>
              
              <div className="max-h-64 sm:max-h-72 overflow-y-auto grid grid-cols-3 gap-2.5 pr-1 custom-scrollbar">
                {isLoadingLibrary ? (
                  <div className="col-span-3 h-48 flex flex-col items-center justify-center text-text-muted text-xs py-8">
                    <Loader2 className="w-6 h-6 mb-2 animate-spin text-accent-primary" />
                    <p>Memuat pustaka gambar...</p>
                  </div>
                ) : libraryItems.length === 0 ? (
                  <div className="col-span-3 h-48 flex flex-col items-center justify-center text-text-muted text-xs py-8">
                    <HardDrive className="w-6 h-6 mb-2 opacity-50" />
                    <p>Pustaka gambar Anda masih kosong.</p>
                  </div>
                ) : (
                  (() => {
                    const filtered = libraryItems.filter(item => {
                      const displayTitle = getDisplayTitle(item.title, item.url);
                      const q = librarySearch.toLowerCase();
                      return displayTitle.toLowerCase().includes(q) || (item.title || '').toLowerCase().includes(q);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="col-span-3 h-32 flex flex-col items-center justify-center text-text-muted text-xs">
                          <p>Tidak ada gambar yang cocok dengan pencarian.</p>
                        </div>
                      );
                    }

                    return filtered.map((item) => {
                      const displayTitle = getDisplayTitle(item.title, item.url);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            onInsertImage({ src: item.url, alt: displayTitle, title: displayTitle });
                            onClose();
                          }}
                          className="group flex flex-col p-1.5 rounded-xl border border-border-subtle bg-bg-surface hover:border-accent-primary hover:bg-bg-elevated/40 transition-all cursor-pointer text-left"
                        >
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-bg-elevated/60 border border-border-subtle/50">
                            <img 
                              src={item.url} 
                              alt={displayTitle} 
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="mt-1.5 px-0.5 min-w-0">
                            <p 
                              className="text-xs font-medium text-text-primary truncate capitalize leading-tight" 
                              title={displayTitle}
                            >
                              {displayTitle}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          )}

          {/* Common Input: Alt/Title */}
          {(activeTab !== 'library') && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                {activeTab === 'upload' ? 'Nama / Judul Gambar' : 'Keterangan (Alt Text / Judul)'}
              </label>
              <input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder={activeTab === 'upload' ? 'Beri nama gambar (misal: Foto Liburan Pantai)...' : 'Deskripsi singkat gambar...'}
                className="w-full px-3 py-2 text-sm bg-bg-elevated/60 border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/50 focus:outline-hidden focus:border-accent-primary transition-all"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-xs text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
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
              <span>Pilih Gambar di Atas</span>
            ) : (
              <span>Sisipkan Gambar</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
