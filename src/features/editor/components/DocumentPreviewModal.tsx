import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Loader2, 
  AlertCircle, 
  FileSpreadsheet, 
  Presentation, 
  FileCode,
  Copy,
  Check,
  Maximize2
} from 'lucide-react';
import mammoth from 'mammoth';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  filename?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  filename,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cleanFilename = filename || url.split('/').pop()?.split('?')[0] || '';
  const ext = (cleanFilename.split('.').pop() || '').toLowerCase();

  const isPdf = ext === 'pdf' || url.toLowerCase().includes('.pdf');
  const isDocx = ext === 'docx' || ext === 'doc';
  const isText = ['txt', 'md', 'markdown', 'csv', 'json', 'log', 'xml', 'yaml', 'yml'].includes(ext);
  const isSheet = ['xlsx', 'xls', 'csv'].includes(ext);
  const isSlide = ['pptx', 'ppt'].includes(ext);

  // Close on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load content for DOCX or Text files
  useEffect(() => {
    if (!isOpen || !url) return;

    setError(null);
    setContentHtml(null);
    setRawText(null);

    if (isPdf) {
      setLoading(false);
      return;
    }

    if (isDocx) {
      setLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Gagal mengunduh berkas dokumen.');
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          return mammoth.convertToHtml({ arrayBuffer });
        })
        .then((result) => {
          setContentHtml(result.value || '<p className="text-text-muted">Dokumen kosong.</p>');
          setLoading(false);
        })
        .catch((err) => {
          console.error('Docx conversion error:', err);
          setError('Tidak dapat mengonversi dokumen Word secara langsung. Anda dapat membukanya di tab baru atau mengunduhnya.');
          setLoading(false);
        });
      return;
    }

    if (isText) {
      setLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Gagal membaca isi berkas teks.');
          return res.text();
        })
        .then((text) => {
          setRawText(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Text load error:', err);
          setError('Gagal membaca berkas teks.');
          setLoading(false);
        });
      return;
    }

    // Default other formats
    setLoading(false);
  }, [isOpen, url, isPdf, isDocx, isText]);

  const handleCopyText = () => {
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBadgeStyle = () => {
    if (isPdf) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (isDocx) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (isSheet) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (isSlide) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  };

  const getIcon = () => {
    if (isSheet) return <FileSpreadsheet className="w-4 h-4" />;
    if (isSlide) return <Presentation className="w-4 h-4" />;
    if (isText) return <FileCode className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl h-[92vh] bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border-subtle bg-bg-elevated/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${getBadgeStyle()}`}>
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate" title={title}>
                {title || cleanFilename || 'Pratinjau Dokumen'}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                <span className="uppercase font-bold tracking-wider">{ext || 'DOKUMEN'}</span>
                <span>•</span>
                <span className="truncate max-w-[200px]">{cleanFilename}</span>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {rawText && (
              <button
                type="button"
                onClick={handleCopyText}
                title="Salin isi teks"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary text-xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin Teks'}</span>
              </button>
            )}

            <a
              href={url}
              download={cleanFilename || title}
              target="_blank"
              rel="noopener noreferrer"
              title="Unduh berkas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </a>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di tab baru"
              className="p-2 rounded-xl border border-border-default bg-bg-surface hover:bg-bg-hover text-text-muted hover:text-text-primary text-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-bg-canvas/50 relative overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-surface/80 backdrop-blur-xs z-10 text-text-muted text-xs gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-accent-primary" />
              <p>Memuat dan memproses pratinjau dokumen...</p>
            </div>
          )}

          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Tidak Dapat Menampilkan Pratinjau</h4>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{error}</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-accent-primary text-accent-contrast hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </a>
                <a
                  href={url}
                  download={cleanFilename || title}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border-default hover:bg-bg-hover text-text-primary transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </a>
              </div>
            </div>
          ) : isPdf ? (
            <div className="w-full flex-1 min-h-0 flex flex-col p-2 sm:p-4 overflow-hidden">
              <PdfCanvasViewer
                url={url}
                title={title}
                className="w-full h-full border-none rounded-xl"
              />
            </div>
          ) : isDocx && contentHtml ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto bg-bg-surface border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-10">
                <div 
                  className="prose dark:prose-invert max-w-none text-text-primary text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </div>
            </div>
          ) : isText && rawText !== null ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <pre className="max-w-4xl mx-auto p-5 rounded-2xl bg-bg-surface border border-border-subtle font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap word-break">
                {rawText}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-xl font-bold uppercase ${getBadgeStyle()}`}>
                {ext || 'FILE'}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
                <p className="text-xs text-text-muted mt-1">
                  Format berkas ini dapat dibuka langsung di aplikasi komputer atau browser Anda.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-accent-primary text-accent-contrast hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </a>
                <a
                  href={url}
                  download={cleanFilename || title}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border-default hover:bg-bg-hover text-text-primary transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
