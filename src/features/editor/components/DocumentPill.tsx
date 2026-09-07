import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Maximize2, 
  Loader2, 
  AlertCircle,
  FileSpreadsheet,
  Presentation,
  FileCode,
  X,
  FileCheck
} from 'lucide-react';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { mediaGC } from '../../../lib/mediaGarbageCollector';
import { db } from '../../../lib/db';
import { moveMediaToTrash } from '../../../lib/mediaStorage';
import mammoth from 'mammoth';

export interface DocumentPillProps {
  src: string;
  title?: string;
  filename?: string;
  className?: string;
  onDelete?: () => void;
}

export const DocumentPill: React.FC<DocumentPillProps> = ({
  src,
  title = 'Dokumen',
  filename,
  className = '',
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline content state
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineHtml, setInlineHtml] = useState<string | null>(null);
  const [inlineText, setInlineText] = useState<string | null>(null);

  const cleanFilename = filename || src.split('/').pop()?.split('?')[0] || '';
  const ext = (cleanFilename.split('.').pop() || '').toLowerCase();

  const isPdf = ext === 'pdf' || src.toLowerCase().includes('.pdf');
  const isDocx = ext === 'docx' || ext === 'doc';
  const isText = ['txt', 'md', 'markdown', 'csv', 'json', 'log'].includes(ext);
  const isSheet = ['xlsx', 'xls', 'csv'].includes(ext);
  const isSlide = ['pptx', 'ppt'].includes(ext);

  // Format title
  const getDisplayTitle = (): string => {
    if (title && title.trim() && title !== 'Dokumen') {
      const cleaned = title.replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '').replace(/[-_]/g, ' ').trim();
      return cleaned || title;
    }
    if (cleanFilename) {
      const withoutExt = cleanFilename.replace(/\.[^/.]+$/, '');
      const cleaned = withoutExt
        .replace(/^(doc|document|file|media)_/i, '')
        .replace(/_\d{10,13}(_[a-z0-9]+)?$/i, '')
        .replace(/[-_]/g, ' ')
        .trim();
      return cleaned || cleanFilename;
    }
    return 'Dokumen';
  };

  const displayTitle = getDisplayTitle();

  useEffect(() => {
    // Media GC: When mounted, unmark for deletion.
    if (src.startsWith('http')) {
      mediaGC.unmarkForDeletion(src);
    }
    return () => {
      if (src.startsWith('http')) {
        mediaGC.markForDeletion(src);
      }
    };
  }, [src]);

  // Load inline preview content when expanded
  useEffect(() => {
    if (!isExpanded) return;

    if (isDocx && !inlineHtml && !inlineLoading) {
      setInlineLoading(true);
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error('Gagal memuat dokumen.');
          return res.arrayBuffer();
        })
        .then((buf) => mammoth.convertToHtml({ arrayBuffer: buf }))
        .then((res) => {
          setInlineHtml(res.value || '<p className="text-text-muted">Dokumen kosong.</p>');
          setInlineLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setInlineError('Tidak dapat memproses isi DOCX.');
          setInlineLoading(false);
        });
    } else if (isText && !inlineText && !inlineLoading) {
      setInlineLoading(true);
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error('Gagal memuat teks.');
          return res.text();
        })
        .then((txt) => {
          setInlineText(txt);
          setInlineLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setInlineError('Gagal memuat teks.');
          setInlineLoading(false);
        });
    }
  }, [isExpanded, isDocx, isText, src, inlineHtml, inlineText, inlineLoading]);

  const handleDeleteFromLibrary = async () => {
    setIsDeleting(true);
    try {
      const media = await db.media_attachments.where('url').equals(src).first();
      if (media) {
        await moveMediaToTrash(media.id);
      }
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting document media:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveFromNote = () => {
    if (onDelete) onDelete();
    setShowDeleteModal(false);
  };

  const getBadgeColors = () => {
    if (isPdf) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (isDocx) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (isSheet) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (isSlide) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  };

  const getFileIcon = () => {
    if (isSheet) return <FileSpreadsheet className="w-4 h-4" />;
    if (isSlide) return <Presentation className="w-4 h-4" />;
    if (isText) return <FileCode className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <>
      <div
        className={`noesis-document-pill my-3 rounded-2xl bg-bg-surface/90 dark:bg-[#0c0c0d] border border-border-default/80 hover:border-accent-primary/40 shadow-xs backdrop-blur-md select-none transition-all w-full max-w-xl overflow-hidden ${className}`}
        data-no-swipe
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Document Pill Layout: 2 Rows */}
        <div className="p-3 sm:p-3.5 space-y-2.5">
          {/* Baris 1: Judul di kiri, Type file di kanan */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0 flex items-center justify-center my-auto">
                {getFileIcon()}
              </div>
              <div className="flex items-center min-w-0 flex-1 my-auto">
                <h4 
                  className="text-xs sm:text-sm font-semibold text-text-primary truncate font-sans !m-0 !p-0 !leading-snug" 
                  title={displayTitle}
                >
                  {displayTitle}
                </h4>
              </div>
            </div>

            {/* Type file badge di kanan */}
            <span className={`h-6 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md border shrink-0 font-mono inline-flex items-center justify-center my-auto ${getBadgeColors()}`}>
              {ext || 'BERKAS'}
            </span>
          </div>

          {/* Baris 2: Tombol-tombol aksi */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle/60">
            {/* Kiri: Tombol Baca (Inline toggle) & Layar Penuh */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                title={isExpanded ? 'Tutup pratinjau catatan' : 'Buka pratinjau di dalam catatan'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isExpanded 
                    ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' 
                    : 'border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isExpanded ? 'Tutup' : 'Baca'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewModalOpen(true);
                }}
                title="Pratinjau Layar Penuh"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary text-xs transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </button>
            </div>

            {/* Kanan: Buka di Tab Baru / Download & Hapus */}
            <div className="flex items-center gap-1">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Buka / Unduh berkas di tab baru"
                className="p-1.5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary text-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  title="Hapus dokumen"
                  className="p-1.5 rounded-xl text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Inline Reader / Viewer */}
        {isExpanded && (
          <div className="border-t border-border-subtle bg-bg-elevated/30 p-2 sm:p-3 animate-in slide-in-from-top-2 duration-150">
            {isPdf ? (
              <div className="space-y-2">
                <PdfCanvasViewer
                  url={src}
                  title={displayTitle}
                  className="w-full shadow-inner"
                />
                <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                  <span>Pratinjau PDF langsung di catatan</span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="text-accent-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Layar Penuh</span>
                  </button>
                </div>
              </div>
            ) : isDocx ? (
              <div className="space-y-2">
                <div 
                  data-no-swipe
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  style={{ overscrollBehavior: 'contain' }}
                  className="max-h-[380px] overflow-y-auto rounded-xl border border-border-default bg-bg-surface p-4 sm:p-6 custom-scrollbar"
                >
                  {inlineLoading ? (
                    <div className="h-32 flex flex-col items-center justify-center text-text-muted text-xs gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                      <p>Mengonversi dokumen Word...</p>
                    </div>
                  ) : inlineError ? (
                    <div className="p-4 text-center text-xs text-text-muted space-y-2">
                      <p>{inlineError}</p>
                      <button
                        type="button"
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="text-accent-primary font-medium hover:underline"
                      >
                        Buka di Modal Pratinjau
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="prose dark:prose-invert max-w-none text-text-primary text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: inlineHtml || '' }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                  <span>Isi Dokumen Word (DOCX)</span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="text-accent-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Layar Penuh</span>
                  </button>
                </div>
              </div>
            ) : isText ? (
              <div className="space-y-2">
                <div 
                  data-no-swipe
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  style={{ overscrollBehavior: 'contain' }}
                  className="max-h-[320px] overflow-y-auto rounded-xl border border-border-default bg-bg-surface p-3 sm:p-4 custom-scrollbar"
                >
                  {inlineLoading ? (
                    <div className="h-28 flex flex-col items-center justify-center text-text-muted text-xs gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                      <p>Membaca teks...</p>
                    </div>
                  ) : (
                    <pre className="font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap word-break">
                      {inlineText}
                    </pre>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                  <span>Isi Berkas Teks</span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="text-accent-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Layar Penuh</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border-default bg-bg-surface text-center space-y-3">
                <p className="text-xs text-text-muted">
                  Pratinjau langsung paling optimal dibuka di layar penuh atau di tab browser baru.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-primary text-accent-contrast flex items-center gap-1.5 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Buka Pratinjau</span>
                  </button>
                  <a
                    href={src}
                    download={cleanFilename || displayTitle}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border-default hover:bg-bg-hover text-text-primary flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        url={src}
        title={displayTitle}
        filename={cleanFilename}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Hapus Dokumen?</h3>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleRemoveFromNote}
                disabled={isDeleting}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-bg-elevated border border-border-subtle text-text-primary hover:bg-bg-hover active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Hapus dari Catatan</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteFromLibrary}
                disabled={isDeleting}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                className="w-full px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors mt-2 cursor-pointer"
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
