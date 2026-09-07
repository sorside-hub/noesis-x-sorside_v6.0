import React from 'react';
import { SorsideRelease } from '../../../types/sorside';
import { getReleaseTimestamp, formatReleaseDate, resolveCoverImageUrl } from '../../../lib/sorsideService';
import { ArrowDown10, AlertCircle, CheckCircle2, Loader2, X, Sparkles, ArrowRight } from 'lucide-react';

interface ResequenceConfirmModalProps {
  isOpen: boolean;
  releases: SorsideRelease[];
  isResequencing: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ResequenceConfirmModal: React.FC<ResequenceConfirmModalProps> = ({
  isOpen,
  releases = [],
  isResequencing,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  // Calculate sorted preview (oldest to newest)
  const sorted = [...releases].sort((a, b) => {
    const timeA = getReleaseTimestamp(a);
    const timeB = getReleaseTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    return (a.title || '').localeCompare(b.title || '');
  });

  const previewItems = sorted.map((rel, idx) => {
    const nextOrder = idx + 1;
    const nextCatalog = `SS-${String(idx + 1).padStart(3, '0')}`;
    const currentOrder =
      typeof rel.order_index === 'number'
        ? rel.order_index
        : parseInt(String(rel.order_index || 0), 10);
    const currentCatalog = (rel.catalog_number || '').trim().toUpperCase();

    const isChanged = currentOrder !== nextOrder || currentCatalog !== nextCatalog;

    return {
      rel,
      nextOrder,
      nextCatalog,
      currentOrder,
      currentCatalog: currentCatalog || 'Belum ada',
      isChanged
    };
  });

  const totalChanges = previewItems.filter((p) => p.isChanged).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        className="w-full max-w-xl bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between shrink-0 bg-bg-primary/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/15 text-accent-primary border border-accent-primary/30 flex items-center justify-center shrink-0 shadow-xs">
              <ArrowDown10 size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-heading tracking-tight flex items-center gap-2">
                <span>Urutkan Ulang Semua Rilisan</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                  {releases.length} Rilisan
                </span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Penyusunan urutan kronologis otomatis & validasi anti-duplikat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isResequencing}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body info */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-bg-primary border border-border-default space-y-1.5 leading-relaxed">
            <div className="font-semibold text-text-heading flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-accent-primary shrink-0" />
              <span>Bagaimana sistem merapikan rilisan?</span>
            </div>
            <p className="text-text-muted text-[11px]">
              Sistem menyortir seluruh rilisan dari tanggal paling awal ke paling baru:
            </p>
            <ul className="text-[11px] text-text-primary/90 list-disc list-inside space-y-0.5 ml-1">
              <li>
                <strong>Catalog Number:</strong> Berurutan unik (<code className="text-accent-primary">SS-001</code>, <code className="text-accent-primary">SS-002</code>, dst.).
              </li>
              <li>
                <strong>Order Index:</strong> Urutan kronologis (#1, #2, dst.) tanpa ada nomor yang bentrok.
              </li>
              <li>Data trek lagu, lirik, dan tautan streaming 100% aman dan tidak terganggu.</li>
            </ul>
          </div>

          {/* Preview list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-muted px-1">
              <span>PRATINJAU URUTAN BARU</span>
              <span>{totalChanges} perubahan terdeteksi</span>
            </div>

            <div className="divide-y divide-border-default/60 border border-border-default rounded-xl overflow-hidden bg-bg-primary/30 max-h-60 overflow-y-auto">
              {previewItems.map(({ rel, nextOrder, nextCatalog, currentOrder, currentCatalog, isChanged }) => (
                <div
                  key={rel.id}
                  className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-bg-hover/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={resolveCoverImageUrl(rel.cover_art || rel.cover)}
                      alt={rel.title}
                      className="w-9 h-9 rounded-lg object-cover border border-border-default shrink-0 bg-bg-surface"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-text-heading truncate text-xs">
                        {rel.title}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {formatReleaseDate(rel.release_date || rel.created_at)} • {rel.type}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] flex items-center gap-2">
                    {isChanged ? (
                      <div className="flex items-center gap-1.5 bg-accent-primary/10 border border-accent-primary/20 px-2 py-1 rounded-lg">
                        <span className="text-text-muted line-through text-[10px]">
                          {currentCatalog} (#{currentOrder})
                        </span>
                        <ArrowRight size={11} className="text-accent-primary" />
                        <span className="font-bold text-accent-primary">
                          {nextCatalog} (#{nextOrder})
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        <span>{nextCatalog} (#{nextOrder})</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border-default bg-bg-primary/40 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isResequencing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isResequencing || releases.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-accent-primary hover:bg-accent-hover text-bg-primary transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isResequencing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memperbaiki & Menyimpan...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Urutkan & Simpan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
