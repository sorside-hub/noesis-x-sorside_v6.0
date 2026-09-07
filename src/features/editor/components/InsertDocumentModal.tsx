import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, 
  X, 
  Loader2, 
  AlertCircle, 
  FileText,
  HardDrive,
  RefreshCw,
  Search,
  File,
  Check
} from 'lucide-react';
import { uploadMediaFile, syncMediaFromSupabaseStorage } from '../../../lib/mediaStorage';
import { db } from '../../../lib/db';
import { getSupabaseConfig } from '../../../lib/supabase';

interface InsertDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDocument: (docData: { url: string; title: string; filename?: string }) => void;
}

export const InsertDocumentModal: React.FC<InsertDocumentModalProps> = ({
  isOpen,
  onClose,
  onInsertDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [docTitle, setDocTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase check
  const supabaseConfig = getSupabaseConfig();
  const isStorageReady = supabaseConfig.isConfigured;

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Library State
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Helper untuk membersihkan dan menampilkan judul dokumen yang rapi
  const getDisplayTitle = (title?: string, url?: string): string => {
    if (title && title.trim()) {
      const cleaned = title.replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '').replace(/[-_]/g, ' ').trim();
      if (cleaned) return cleaned;
      return title.trim();
    }
    if (url) {
      const filename = url.split('/').pop()?.split('?')[0] || '';
      const withoutExt = filename.replace(/\.[^/.]+$/, '');
      const cleaned = withoutExt.replace(/^(doc|document|file|media)_/i, '').replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '').replace(/[-_]/g, ' ').trim();
      return cleaned || filename || 'Dokumen';
    }
    return 'Dokumen';
  };

  const getFileExtension = (url?: string, filename?: string): string => {
    const target = filename || url || '';
    const clean = target.split('?')[0];
    const ext = clean.split('.').pop();
    return ext && ext.length <= 5 ? ext.toUpperCase() : 'FILE';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter agar HANYA dokumen yang masuk ke tab pustaka dokumen
  const isDocumentAttachment = (item: any): boolean => {
    if (item.deletedAt) return false;
    // Kecualikan audio, voice memo, video, gambar
    if (item.type === 'audio' || item.type === 'voice_memo' || item.type === 'video' || item.type === 'image') return false;
    if (/\.(mp3|wav|m4a|webm|ogg|aac|flac|png|jpg|jpeg|gif|webp|svg|bmp|ico)($|\?)/i.test(item.url || '')) return false;

    if (item.type === 'document') return true;
    return /\.(pdf|docx?|xlsx?|pptx?|txt|csv|md|zip|rar|tar|gz|json)($|\?)/i.test(item.url || '');
  };

  const loadDocuments = useCallback(async (forceSync = false) => {
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
      let documents = items.filter(isDocumentAttachment);

      if (documents.length === 0 && !forceSync) {
        try {
          const config = getSupabaseConfig();
          if (config.isConfigured) {
            await syncMediaFromSupabaseStorage();
            items = await db.media_attachments.toArray();
            documents = items.filter(isDocumentAttachment);
          }
        } catch (e) {
          // ignore
        }
      }

      documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLibraryItems(documents);
    } catch (err) {
      console.error('Failed to load document library:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'library' && isOpen) {
      loadDocuments();
    }
  }, [activeTab, isOpen, loadDocuments]);

  useEffect(() => {
    const handleUpdate = () => {
      if (activeTab === 'library' && isOpen) {
        loadDocuments();
      }
    };
    window.addEventListener('media-updated', handleUpdate);
    return () => window.removeEventListener('media-updated', handleUpdate);
  }, [activeTab, isOpen, loadDocuments]);

  // Reset states on modal open/close
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsUploading(false);
      setUploadProgressMsg('');
      setDocTitle('');
      setSelectedFile(null);
      setIsDragOver(false);
    }
  }, [isOpen]);

  const handleSelectFile = (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!docTitle) {
      setDocTitle(cleanName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleSelectFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleSelectFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
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
        setErrorMessage('Silakan pilih file dokumen terlebih dahulu.');
        return;
      }

      setIsUploading(true);
      setUploadProgressMsg('Mengunggah dokumen ke Supabase Storage...');

      try {
        const titleToUse = docTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, '') || 'Dokumen';
        const publicUrl = await uploadMediaFile(selectedFile, titleToUse);
        setUploadProgressMsg('Berhasil diunggah!');
        
        onInsertDocument({
          url: publicUrl,
          title: titleToUse,
          filename: selectedFile.name
        });

        onClose();
      } catch (err: any) {
        console.error('Upload document error:', err);
        setErrorMessage(err.message || 'Gagal mengunggah dokumen ke Supabase Storage.');
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
              <FileText className="w-4 h-4" />
            </div>
            <span>Sisipkan Dokumen</span>
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

        {/* Tab Selection: Centered Grid 2 Kolom */}
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
            <span>Unggah Dokumen</span>
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
            <span>Pustaka Dokumen</span>
          </button>
        </div>

        {/* Storage Notice if not configured */}
        {!isStorageReady && activeTab === 'upload' && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Supabase Storage Belum Dikonfigurasi:</span> Unggah dokumen memerlukan koneksi Supabase Storage. Harap setel URL dan Anon Key di Pengaturan &gt; Sinkronisasi.
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.rar,.tar,.gz,.json"
                className="hidden" 
              />

              {/* Upload Drop Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-accent-primary bg-accent-primary/10'
                    : selectedFile
                    ? 'border-accent-primary/40 bg-accent-primary/5 hover:border-accent-primary'
                    : 'border-border-default hover:border-accent-primary/50 hover:bg-bg-elevated/40'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-bold text-xs uppercase tracking-wider">
                      {getFileExtension(undefined, selectedFile.name)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary truncate max-w-[260px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {formatFileSize(selectedFile.size)} • Klik untuk ganti file
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-text-primary">
                      Klik atau seret file dokumen ke sini
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      PDF, Word, Excel, PowerPoint, Text, ZIP, dll.
                    </p>
                  </>
                )}
              </div>

              {/* Document Title Input */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Nama / Label Dokumen
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Beri label dokumen (misal: Laporan Keuangan 2026)..."
                  className="w-full px-3 py-2 text-sm bg-bg-elevated/60 border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/50 focus:outline-hidden focus:border-accent-primary transition-all"
                />
              </div>
            </div>
          ) : (
            /* Library Tab */
            <div className="space-y-3">
              {/* Search & Sync Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Cari dokumen..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-bg-elevated/60 border border-border-default rounded-xl text-text-primary placeholder:text-text-muted/50 focus:outline-hidden focus:border-accent-primary transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadDocuments(true)}
                  disabled={isLoadingLibrary}
                  title="Sinkronisasi dengan Storage"
                  className="p-2 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLibrary ? 'animate-spin text-accent-primary' : ''}`} />
                </button>
              </div>

              {/* Document List */}
              <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {isLoadingLibrary ? (
                  <div className="h-48 flex flex-col items-center justify-center text-text-muted text-xs py-8">
                    <Loader2 className="w-6 h-6 mb-2 animate-spin text-accent-primary" />
                    <p>Memuat pustaka dokumen...</p>
                  </div>
                ) : libraryItems.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-text-muted text-xs py-8">
                    <HardDrive className="w-6 h-6 mb-2 opacity-50" />
                    <p>Pustaka dokumen Anda masih kosong.</p>
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
                        <div className="h-32 flex flex-col items-center justify-center text-text-muted text-xs">
                          <p>Tidak ada dokumen yang cocok dengan pencarian.</p>
                        </div>
                      );
                    }

                    return filtered.map((item) => {
                      const displayTitle = getDisplayTitle(item.title, item.url);
                      const ext = getFileExtension(item.url, item.title);

                      return (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            onInsertDocument({ 
                              url: item.url, 
                              title: displayTitle,
                              filename: item.title 
                            });
                            onClose();
                          }}
                          className="group flex items-center justify-between p-2.5 rounded-xl border border-border-subtle bg-bg-surface hover:border-accent-primary hover:bg-bg-elevated/50 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0 font-bold text-[10px] uppercase tracking-wider">
                              {ext}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate" title={displayTitle}>
                                {displayTitle}
                              </p>
                              <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium text-accent-primary bg-accent-primary/10 group-hover:bg-accent-primary group-hover:text-accent-contrast transition-colors"
                          >
                            Sisipkan
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
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
              <span>Pilih Dokumen di Atas</span>
            ) : (
              <span>Sisipkan Dokumen</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
