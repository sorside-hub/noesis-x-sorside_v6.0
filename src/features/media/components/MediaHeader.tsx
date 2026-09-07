import React from 'react';
import { 
  FolderOpen, 
  Mic, 
  RefreshCw, 
  CloudDownload, 
  Upload, 
  Loader2,
  Trash2
} from 'lucide-react';
import { MediaCategory, CategoryConfig } from '../types';

interface MediaHeaderProps {
  selectedCategory: MediaCategory | null;
  currentCategoryMeta: CategoryConfig | undefined;
  getCategoryCount: (catId: MediaCategory) => number;
  isLoading: boolean;
  isScanning: boolean;
  isUploading: boolean;
  onOpenVoiceMemo: () => void;
  onScanStorage: () => void;
  onRefresh: () => void;
  onUploadClick: () => void;
  onEmptyTrash: () => void;
}

export const MediaHeader: React.FC<MediaHeaderProps> = ({
  selectedCategory,
  currentCategoryMeta,
  getCategoryCount,
  isLoading,
  isScanning,
  isUploading,
  onOpenVoiceMemo,
  onScanStorage,
  onRefresh,
  onUploadClick,
  onEmptyTrash
}) => {
  const IconComponent = selectedCategory && currentCategoryMeta
    ? currentCategoryMeta.icon
    : FolderOpen;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
          selectedCategory && currentCategoryMeta
            ? `${currentCategoryMeta.iconBg} ${currentCategoryMeta.iconColor}`
            : 'bg-accent-primary/10 text-accent-primary'
        }`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              {selectedCategory && currentCategoryMeta ? currentCategoryMeta.title : 'Media & Lampiran'}
            </h1>
            {selectedCategory && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-muted">
                {getCategoryCount(selectedCategory)} File
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {selectedCategory && currentCategoryMeta
              ? currentCategoryMeta.description
              : 'Pusat pengelolaan file audio, gambar, voice memo, dan dokumen'
            }
          </p>
        </div>
      </div>

      {/* Action Hub Buttons */}
      {selectedCategory === null ? (
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenVoiceMemo}
            className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Rekam Memo</span>
          </button>

          <button
            type="button"
            onClick={onScanStorage}
            disabled={isScanning || isLoading}
            title="Pindai file di Cloud Storage"
            className="px-3 py-2 rounded-xl border border-border-default hover:bg-bg-hover text-text-primary text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <CloudDownload className={`w-3.5 h-3.5 text-sky-500 ${isScanning ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isScanning ? 'Memindai...' : 'Pindai Storage'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isScanning}
            title="Refresh Media List"
            className="p-2 rounded-xl border border-border-default hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent-primary' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onUploadClick}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl bg-accent-primary text-accent-contrast font-medium text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah File</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Action buttons in Detail View */
        <div className="flex items-center flex-wrap gap-2">
          {selectedCategory === 'voice_memo' ? (
            <button
              type="button"
              onClick={onOpenVoiceMemo}
              className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Rekam Memo</span>
            </button>
          ) : selectedCategory === 'trash' ? (
            <button
              type="button"
              onClick={onEmptyTrash}
              disabled={getCategoryCount('trash') === 0 || isLoading}
              className="px-3.5 py-2 rounded-xl bg-red-500 text-white font-semibold text-xs hover:bg-red-600 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengosongkan...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Sampah</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onUploadClick}
              disabled={isUploading}
              className="px-3 py-2 rounded-xl bg-accent-primary text-accent-contrast font-medium text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah di Sini</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isScanning}
            title="Refresh Media List"
            className="p-2 rounded-xl border border-border-default hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent-primary' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};
