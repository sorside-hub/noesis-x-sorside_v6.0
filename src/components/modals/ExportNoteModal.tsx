import React, { useState } from 'react';
import { 
  FileText, 
  FileDown, 
  FileCode, 
  Printer, 
  Copy, 
  Check, 
  X,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { FileNode } from '../../types/vault';
import { 
  exportNoteAsMarkdown, 
  exportNoteAsPDF, 
  exportNoteAsDocx, 
  exportNoteAsHTML, 
  copyNoteAsMarkdown 
} from '../../lib/exportUtils';

interface ExportNoteModalProps {
  node: FileNode | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportNoteModal: React.FC<ExportNoteModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  if (!isOpen || !node) return null;

  const handleCopyMarkdown = async () => {
    const ok = await copyNoteAsMarkdown(node);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async (type: 'md' | 'pdf' | 'docx' | 'html') => {
    setExportingType(type);
    try {
      if (type === 'md') exportNoteAsMarkdown(node);
      if (type === 'pdf') await exportNoteAsPDF(node);
      if (type === 'docx') await exportNoteAsDocx(node);
      if (type === 'html') exportNoteAsHTML(node);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => {
        setExportingType(null);
        onClose();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-base/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shrink-0">
              <FileDown size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-text-heading truncate">Export Catatan</h2>
              <p className="text-[11px] text-text-muted truncate">{node.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Export Formats Grid */}
        <div className="p-5 space-y-2.5">
          <p className="text-xs text-text-secondary mb-3 font-medium">
            Pilih format file untuk mengunduh atau menyalin catatan ini:
          </p>

          {/* Markdown Option */}
          <button
            type="button"
            onClick={() => handleExport('md')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-hover transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                  Markdown (.md)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Format teks murni standar PKM dengan metadata frontmatter
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              Unduh →
            </span>
          </button>

          {/* PDF Option */}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-hover transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                {exportingType === 'pdf' ? <Loader2 size={18} className="animate-spin text-rose-500" /> : <Printer size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                  PDF Document (.pdf)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {exportingType === 'pdf' ? 'Sedang memproses & mengunduh PDF...' : 'Dokumen siap simpan & cetak dengan tipografi rapi'}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              {exportingType === 'pdf' ? 'Membuat...' : 'Unduh PDF →'}
            </span>
          </button>

          {/* Word Option */}
          <button
            type="button"
            onClick={() => handleExport('docx')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-hover transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                  Microsoft Word (.docx)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Dokumen asli .docx kompatibel langsung dengan Google Docs & MS Word
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              Unduh →
            </span>
          </button>

          {/* HTML Option */}
          <button
            type="button"
            onClick={() => handleExport('html')}
            disabled={exportingType !== null}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-hover transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <FileCode size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                  Standalone Webpage (.html)
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  Dokumen HTML interaktif dengan styling responsif mandiri
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              Unduh →
            </span>
          </button>

          <div className="h-px bg-border-subtle my-2" />

          {/* Copy to Clipboard Option */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-hover transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 shrink-0">
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-text-heading group-hover:text-accent-primary transition-colors">
                  {copied ? 'Tersalin ke Clipboard!' : 'Salin sebagai Markdown'}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {copied ? 'Markdown siap ditempel' : 'Salin teks mentah berformat ke clipboard'}
                </div>
              </div>
            </div>
            {copied && (
              <span className="text-[11px] font-semibold text-emerald-500 shrink-0 ml-2">
                Tersalin!
              </span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-subtle bg-bg-base/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-bg-surface hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
