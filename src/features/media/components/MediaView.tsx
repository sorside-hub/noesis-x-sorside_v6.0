import React, { useState } from 'react';
import { 
  Search, 
  X, 
  AlertCircle, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useMediaManager } from '../hooks/useMediaManager';
import { MediaHeader } from './MediaHeader';
import { MediaHubHome } from './MediaHubHome';
import { MediaCategoryDetail } from './MediaCategoryDetail';
import { DeleteConfirmModal, ImagePreviewModal, EmptyTrashModal } from './MediaModals';
import { DocumentPreviewModal } from '../../editor/components/DocumentPreviewModal';
import { MediaAttachment } from '../../../lib/db';
import { SortOption } from '../types';

interface MediaViewProps {
  vaultState?: any;
}

export const MediaView: React.FC<MediaViewProps> = ({ vaultState }) => {
  const [previewDoc, setPreviewDoc] = useState<MediaAttachment | null>(null);

  const {
    isLoading,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isUploading,
    uploadError,
    setUploadError,
    isScanning,
    scanBanner,
    setScanBanner,
    playingId,
    copiedId,
    editingId,
    editTitle,
    setEditTitle,
    deletingId,
    previewMedia,
    setPreviewMedia,
    confirmDeleteMedia,
    setConfirmDeleteMedia,
    showEmptyTrashModal,
    setShowEmptyTrashModal,
    isEmptyingTrash,
    handleConfirmEmptyTrash,
    transcribingId,
    fileInputRef,
    loadData,
    handleOpenCategory,
    handleBackToMain,
    handleFileUpload,
    handleScanStorage,
    toggleAudio,
    handleCopy,
    startEdit,
    saveRename,
    handleRenameKeyDown,
    handleMoveToTrash,
    handleRestoreFromTrash,
    handleDeleteMedia,
    handleEmptyTrash,
    handleTranscribeMediaToNote,
    activeMedia,
    trashedMedia,
    getCategoryCount,
    getLinkedNotes,
    currentCategoryMeta,
    filteredMediaList,
    openModal,
    navigateToNote
  } = useMediaManager(vaultState?.vault);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg-primary p-4 sm:p-8 custom-scrollbar">
      {/* Hidden File Input for Uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* 1. Dynamic Header Section */}
        <MediaHeader
          selectedCategory={selectedCategory}
          currentCategoryMeta={currentCategoryMeta}
          getCategoryCount={getCategoryCount}
          isLoading={isLoading}
          isScanning={isScanning}
          isUploading={isUploading}
          onOpenVoiceMemo={() => openModal('voice-memo')}
          onScanStorage={handleScanStorage}
          onRefresh={loadData}
          onUploadClick={() => fileInputRef.current?.click()}
          onEmptyTrash={handleEmptyTrash}
        />

        {/* Scan Status Banner */}
        {scanBanner && (
          <div className={`p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in ${
            scanBanner.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-500'
              : 'bg-red-500/10 border border-red-500/25 text-red-500'
          }`}>
            <div className="flex items-center gap-2">
              {scanBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{scanBanner.message}</span>
            </div>
            <button onClick={() => setScanBanner(null)} className="hover:opacity-80 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between text-xs text-red-500 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="hover:opacity-80 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Search & Sort Bar */}
        <div className="flex items-center gap-2.5 bg-bg-surface p-2 rounded-2xl border border-border-default shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={
                selectedCategory 
                  ? `Cari di ${currentCategoryMeta?.title || 'kategori ini'}...`
                  : 'Cari seluruh file media & rekaman...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-bg-elevated border border-border-default focus:border-accent-primary focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedCategory && (
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-3.5 pr-8 py-2 text-xs font-medium rounded-xl bg-bg-elevated hover:bg-bg-hover border border-border-default hover:border-accent-primary/50 text-text-primary focus:outline-none focus:border-accent-primary cursor-pointer transition-all shadow-xs"
              >
                <option value="newest" className="bg-bg-surface text-text-primary">Terbaru</option>
                <option value="oldest" className="bg-bg-surface text-text-primary">Terlama</option>
                <option value="name" className="bg-bg-surface text-text-primary">Nama (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          )}
        </div>

        {/* 3. Main Views: Hub Home vs Category Detail */}
        {selectedCategory === null && !searchQuery ? (
          <MediaHubHome
            activeMedia={activeMedia}
            getCategoryCount={getCategoryCount}
            onOpenCategory={handleOpenCategory}
          />
        ) : (
          <MediaCategoryDetail
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            filteredMediaList={filteredMediaList}
            trashedMedia={trashedMedia}
            isLoading={isLoading}
            getLinkedNotes={getLinkedNotes}
            playingId={playingId}
            copiedId={copiedId}
            editingId={editingId}
            editTitle={editTitle}
            transcribingId={transcribingId}
            onEmptyTrash={handleEmptyTrash}
            onOpenVoiceMemo={() => openModal('voice-memo')}
            onUploadClick={() => fileInputRef.current?.click()}
            onToggleAudio={toggleAudio}
            onPreviewImage={(item) => setPreviewMedia(item)}
            onPreviewDocument={(item) => setPreviewDoc(item)}
            onStartEdit={startEdit}
            onEditTitleChange={setEditTitle}
            onRenameKeyDown={handleRenameKeyDown}
            onSaveRename={saveRename}
            onCopyLink={handleCopy}
            onTranscribe={handleTranscribeMediaToNote}
            onMoveToTrash={handleMoveToTrash}
            onRestoreFromTrash={handleRestoreFromTrash}
            onConfirmPermanentDelete={(item) => setConfirmDeleteMedia(item)}
            onNavigateToNote={navigateToNote}
          />
        )}
      </div>

      {/* Confirmation Modal for Permanent Delete */}
      <DeleteConfirmModal
        media={confirmDeleteMedia}
        deletingId={deletingId}
        onClose={() => setConfirmDeleteMedia(null)}
        onConfirm={handleDeleteMedia}
      />

      {/* Confirmation Modal for Empty Trash */}
      <EmptyTrashModal
        isOpen={showEmptyTrashModal}
        itemCount={trashedMedia.length}
        isLoading={isEmptyingTrash}
        onClose={() => setShowEmptyTrashModal(false)}
        onConfirm={handleConfirmEmptyTrash}
      />

      {/* Image Fullscreen Preview Modal */}
      <ImagePreviewModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      {/* Document Fullscreen Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={previewDoc !== null}
          onClose={() => setPreviewDoc(null)}
          url={previewDoc.url}
          title={previewDoc.title || 'Dokumen'}
          filename={previewDoc.url.split('/').pop()?.split('?')[0] || previewDoc.title}
        />
      )}
    </div>
  );
};
