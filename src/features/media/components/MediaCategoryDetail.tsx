import React from 'react';
import { 
  Trash2, 
  Mic, 
  FolderOpen, 
  Upload, 
  Loader2 
} from 'lucide-react';
import { MediaAttachment } from '../../../lib/db';
import { MediaCategory, LinkedNoteInfo } from '../types';
import { MediaItemCard } from './MediaItemCard';

interface MediaCategoryDetailProps {
  selectedCategory: MediaCategory | null;
  searchQuery: string;
  filteredMediaList: MediaAttachment[];
  trashedMedia: MediaAttachment[];
  isLoading: boolean;
  getLinkedNotes: (url: string) => LinkedNoteInfo[];
  playingId: string | null;
  copiedId: string | null;
  editingId: string | null;
  editTitle: string;
  transcribingId: string | null;
  onEmptyTrash: () => void;
  onOpenVoiceMemo: () => void;
  onUploadClick: () => void;
  onToggleAudio: (item: MediaAttachment) => void;
  onPreviewImage: (item: MediaAttachment) => void;
  onPreviewDocument?: (item: MediaAttachment) => void;
  onStartEdit: (item: MediaAttachment) => void;
  onEditTitleChange: (val: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onSaveRename: (id: string) => void;
  onCopyLink: (item: MediaAttachment, type?: 'markdown' | 'url') => void;
  onTranscribe: (item: MediaAttachment) => void;
  onMoveToTrash: (item: MediaAttachment) => void;
  onRestoreFromTrash: (item: MediaAttachment) => void;
  onConfirmPermanentDelete: (item: MediaAttachment) => void;
  onNavigateToNote: (noteId: string) => void;
}

export const MediaCategoryDetail: React.FC<MediaCategoryDetailProps> = ({
  selectedCategory,
  searchQuery,
  filteredMediaList,
  trashedMedia,
  isLoading,
  getLinkedNotes,
  playingId,
  copiedId,
  editingId,
  editTitle,
  transcribingId,
  onEmptyTrash,
  onOpenVoiceMemo,
  onUploadClick,
  onToggleAudio,
  onPreviewImage,
  onPreviewDocument,
  onStartEdit,
  onEditTitleChange,
  onRenameKeyDown,
  onSaveRename,
  onCopyLink,
  onTranscribe,
  onMoveToTrash,
  onRestoreFromTrash,
  onConfirmPermanentDelete,
  onNavigateToNote,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Breadcrumb Info if searched from Hub */}
      {selectedCategory === null && searchQuery && (
        <div className="flex items-center justify-between text-xs text-text-muted px-1">
          <span>Hasil pencarian untuk: <strong className="text-text-primary">"{searchQuery}"</strong></span>
          <span className="font-mono">{filteredMediaList.length} ditemukan</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <p className="text-xs">Memuat berkas media...</p>
        </div>
      ) : filteredMediaList.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-border-default bg-bg-surface/50">
          <div className="w-14 h-14 rounded-2xl bg-bg-elevated flex items-center justify-center text-text-muted mb-3">
            {selectedCategory === 'trash' ? (
              <Trash2 className="w-6 h-6" />
            ) : selectedCategory === 'voice_memo' ? (
              <Mic className="w-6 h-6" />
            ) : (
              <FolderOpen className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-text-primary">
            {selectedCategory === 'trash'
              ? 'Kotak Sampah Kosong'
              : selectedCategory === 'voice_memo'
              ? 'Belum Ada Voice Memo'
              : searchQuery
              ? 'Tidak ada media yang cocok'
              : 'Belum ada media di kategori ini'}
          </h3>
          <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">
            {selectedCategory === 'trash'
              ? 'Tidak ada file media yang sedang menunggu penghapusan.'
              : selectedCategory === 'voice_memo'
              ? 'Rekam memo suara atau ide sekilas untuk disimpan langsung di sini.'
              : 'Unggah file dokumen, rekaman audio, atau gambar untuk menunjang catatan Anda.'}
          </p>
          {selectedCategory === 'voice_memo' ? (
            <button
              type="button"
              onClick={onOpenVoiceMemo}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Mulai Rekam Voice Memo</span>
            </button>
          ) : selectedCategory !== 'trash' && (
            <button
              type="button"
              onClick={onUploadClick}
              className="px-4 py-2 rounded-xl bg-accent-primary text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Media Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        /* Media Cards Grid in Detail View (Responsive 1 to 4 columns) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMediaList.map((item) => (
            <MediaItemCard
              key={item.id}
              item={item}
              selectedCategory={selectedCategory}
              linkedNotes={getLinkedNotes(item.url)}
              playingId={playingId}
              copiedId={copiedId}
              editingId={editingId}
              editTitle={editTitle}
              transcribingId={transcribingId}
              onToggleAudio={onToggleAudio}
              onPreviewImage={onPreviewImage}
              onPreviewDocument={onPreviewDocument}
              onStartEdit={onStartEdit}
              onEditTitleChange={onEditTitleChange}
              onRenameKeyDown={onRenameKeyDown}
              onSaveRename={onSaveRename}
              onCopyLink={onCopyLink}
              onTranscribe={onTranscribe}
              onMoveToTrash={onMoveToTrash}
              onRestoreFromTrash={onRestoreFromTrash}
              onConfirmPermanentDelete={onConfirmPermanentDelete}
              onNavigateToNote={onNavigateToNote}
            />
          ))}
        </div>
      )}
    </div>
  );
};
