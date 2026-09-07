import React, { useState, useEffect } from 'react';
import { useSorsideArticles } from '../hooks/useSorsideArticles';
import { useSorsideReleases } from '../hooks/useSorsideReleases';
import { ArticleCard } from './ArticleCard';
import { ArticleEditorView } from './ArticleEditorView';
import { ImportNoteModal } from './ImportNoteModal';
import { ReleaseCard } from './ReleaseCard';
import { ReleaseEditorView } from './ReleaseEditorView';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ResequenceConfirmModal } from './ResequenceConfirmModal';
import { AudioPreviewPlayer } from './AudioPreviewPlayer';
import { SorsideSide, SORSIDE_CATEGORIES, SorsideReleaseType, SorsideArticle, SorsideRelease } from '../../../types/sorside';
import { htmlToArticleText, generateSlug, calculateReadTime, formatReleaseDate, checkReleaseDuplicates } from '../../../lib/sorsideService';
import { FileNode } from '../../../types/vault';
import {
  Globe,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  Disc,
  FileDown,
  CheckCircle2,
  AlertCircle,
  ArrowDown10,
  Wand2
} from 'lucide-react';

interface SorsideViewProps {
  vaultState: {
    vault: any;
    [key: string]: any;
  };
}

export const SorsideView: React.FC<SorsideViewProps> = ({ vaultState }) => {
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'releases'>('articles');

  // Articles Hook
  const {
    articles,
    allArticlesCount,
    isLoading: isArticlesLoading,
    error: articlesError,
    selectedSide,
    setSelectedSide,
    statusFilter,
    setStatusFilter,
    searchQuery: articleSearchQuery,
    setSearchQuery: setArticleSearchQuery,
    isEditorOpen: isArticleEditorOpen,
    setIsEditorOpen: setIsArticleEditorOpen,
    editingArticle,
    openNewArticleModal,
    openEditArticleModal,
    isImportOpen,
    setIsImportOpen,
    actionSuccessMessage: articleSuccessMessage,
    refresh: refreshArticles,
    handleSave: handleSaveArticle,
    handleDelete: handleDeleteArticle,
    handleTogglePublish
  } = useSorsideArticles();

  // Releases Hook
  const {
    releases,
    allReleases,
    allReleasesCount,
    isLoading: isReleasesLoading,
    isResequencing,
    error: releasesError,
    typeFilter,
    setTypeFilter,
    searchQuery: releaseSearchQuery,
    setSearchQuery: setReleaseSearchQuery,
    isReleaseEditorOpen,
    setIsReleaseEditorOpen,
    editingRelease,
    openNewReleaseModal,
    openEditReleaseModal,
    isTrackEditorOpen,
    setIsTrackEditorOpen,
    editingTrack,
    openNewTrackModal,
    openEditTrackModal,
    activeAudioPreview,
    setActiveAudioPreview,
    notification: releaseNotification,
    refresh: refreshReleases,
    handleSaveRelease,
    handleDeleteRelease,
    handleSaveTrack,
    handleDeleteTrack,
    handleResequenceAll
  } = useSorsideReleases();

  // Temporary imported article state to pass to ArticleEditorView
  const [importedArticleDraft, setImportedArticleDraft] = useState<any | null>(null);

  // Delete confirm modal target state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; type: 'article' | 'release' } | null>(null);

  const handleSelectVaultNote = (node: FileNode) => {
    const text = htmlToArticleText(node.content || '');
    const cleanSlug = generateSlug(node.name || 'untitled');
    const draft = {
      slug: cleanSlug,
      title: node.name || 'Untitled',
      category: 'stories' as SorsideSide,
      side: 'stories' as SorsideSide,
      date: formatReleaseDate(new Date()),
      release_date: formatReleaseDate(new Date()),
      snippet: text.slice(0, 160).replace(/\n+/g, ' ').trim(),
      content: text,
      full_text: text,
      published: false
    };
    openNewArticleModal();
    setImportedArticleDraft(draft);
    setIsReleaseEditorOpen(false);
  };

  const handleToggleAudio = (title: string, url: string) => {
    if (activeAudioPreview?.url === url) {
      setActiveAudioPreview(null);
    } else {
      setActiveAudioPreview({ title, url });
    }
  };

  const handleRefreshAll = () => {
    if (activeSubTab === 'articles') {
      refreshArticles();
    } else {
      refreshReleases();
    }
  };

  const handleNewArticle = () => {
    setIsReleaseEditorOpen(false);
    setImportedArticleDraft(null);
    openNewArticleModal();
  };

  const handleNewRelease = () => {
    setIsArticleEditorOpen(false);
    setImportedArticleDraft(null);
    openNewReleaseModal();
  };

  // Check for any duplicate catalog numbers or order indexes in the database
  const duplicateCheck = checkReleaseDuplicates(allReleases);

  // Modal confirmation for auto-resequencing (no iframe-blocked window.confirm)
  const [isResequenceModalOpen, setIsResequenceModalOpen] = useState<boolean>(false);

  const handleOpenResequenceModal = () => {
    if (allReleases.length === 0) return;
    setIsResequenceModalOpen(true);
  };

  const handleConfirmResequence = async () => {
    try {
      await handleResequenceAll();
      setIsResequenceModalOpen(false);
    } catch (err) {
      console.error('Failed to resequence releases:', err);
    }
  };

  const handleCloseEditors = () => {
    setIsArticleEditorOpen(false);
    setIsReleaseEditorOpen(false);
    setIsTrackEditorOpen(false);
    setIsImportOpen(false);
    setImportedArticleDraft(null);
  };

  // Listen for reset-sorside-view event (e.g. user clicks SORSIDE tab from anywhere or sub-page)
  useEffect(() => {
    const handleReset = () => {
      handleCloseEditors();
    };

    const handlePublishNote = (e: Event) => {
      const customEvent = e as CustomEvent<FileNode>;
      if (customEvent.detail) {
        setActiveSubTab('articles');
        handleSelectVaultNote(customEvent.detail);
      }
    };

    window.addEventListener('reset-sorside-view', handleReset);
    window.addEventListener('publish-note-to-sorside', handlePublishNote);

    return () => {
      window.removeEventListener('reset-sorside-view', handleReset);
      window.removeEventListener('publish-note-to-sorside', handlePublishNote);
    };
  }, []);

  const activeNotification = articleSuccessMessage || releaseNotification;
  const isLoading = activeSubTab === 'articles' ? isArticlesLoading : isReleasesLoading;

  return (
    <div className="h-full w-full flex flex-col bg-bg-primary overflow-hidden select-none relative">
      {/* MAIN WORKSPACE / CONTENT AREA */}
      {isArticleEditorOpen ? (
        /* CASE A: Full-page Article Editor ("The Side") */
        <ArticleEditorView
          article={editingArticle || importedArticleDraft}
          onBack={handleCloseEditors}
          onSave={async (data) => {
            await handleSaveArticle(data);
            setIsArticleEditorOpen(false);
            setImportedArticleDraft(null);
          }}
        />
      ) : isReleaseEditorOpen ? (
        /* CASE B: Full-page Music Release Studio */
        <ReleaseEditorView
          release={editingRelease}
          releases={allReleases}
          articles={articles}
          onBack={handleCloseEditors}
          onSave={async (data) => {
            await handleSaveRelease(data);
            setIsReleaseEditorOpen(false);
          }}
          onSaveTrack={handleSaveTrack}
          onOpenTrackEditor={(releaseId, nextNumber, track) => {
            if (track) {
              openEditTrackModal(track);
            } else {
              openNewTrackModal(releaseId, nextNumber);
            }
          }}
          onDeleteTrack={handleDeleteTrack}
          activeAudioPreview={activeAudioPreview}
          onToggleAudioPreview={handleToggleAudio}
        />
      ) : (
        /* CASE C: Standard Catalog Grid View (Articles or Releases) */
        <div className="h-full w-full flex flex-col bg-bg-primary overflow-hidden select-none">
          {/* Top Banner Header */}
          <header className="px-4 sm:px-6 py-3 sm:py-4 bg-bg-surface border-b border-border-default shrink-0 flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary shadow-xs shrink-0">
                <Globe size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-text-heading tracking-tight truncate">
                    SORSIDE Studio
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider bg-accent-primary/10 text-accent-primary border border-accent-primary/30 uppercase shrink-0">
                    CMS Website
                  </span>
                </div>
                <p className="text-[11px] text-text-muted truncate hidden sm:block">
                  Pusat manajemen konten publik website SORSIDE (Musik & Artikel "The Side").
                </p>
              </div>
            </div>

            {/* Global Header Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {activeSubTab === 'articles' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(true)}
                    title="Import catatan dari Vault Noesis"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-border-default transition-colors cursor-pointer"
                  >
                    <FileDown size={14} className="text-accent-primary" />
                    <span>Import Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewArticle}
                    title="Tambah Artikel Baru"
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-sm hover:opacity-90 transition-opacity cursor-pointer active:scale-98"
                  >
                    <Plus size={15} />
                    <span className="hidden sm:inline">Artikel Baru</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleNewRelease}
                  title="Tambah Rilisan Baru"
                  className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-sm hover:opacity-90 transition-opacity cursor-pointer active:scale-98"
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">Rilisan Baru</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRefreshAll}
                title="Muat ulang data dari Supabase"
                disabled={isLoading}
                className="p-1.5 sm:p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer border border-border-default shrink-0"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-accent-primary' : ''} />
              </button>
            </div>
          </header>

          {/* Sub Tabs Navigation (Articles vs Releases) */}
          <div className="px-4 sm:px-6 pt-2.5 border-b border-border-default bg-bg-surface/50 flex items-center justify-center shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-6 sm:gap-10">
              <button
                type="button"
                onClick={() => setActiveSubTab('articles')}
                className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeSubTab === 'articles'
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <BookOpen size={14} />
                <span>The Side</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bg-primary border border-border-default text-text-muted">
                  {allArticlesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('releases')}
                className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeSubTab === 'releases'
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <Disc size={14} />
                <span>Discography</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bg-primary border border-border-default text-text-muted">
                  {allReleasesCount}
                </span>
              </button>
            </div>
          </div>

            {/* Notification Banner */}
            {activeNotification && (
              <div className="mx-4 sm:mx-6 mt-3 p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 shrink-0">
                <CheckCircle2 size={15} className="shrink-0" />
                <span className="truncate">{activeNotification}</span>
              </div>
            )}

            {/* Main View Grid Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
              {activeSubTab === 'articles' ? (
                /* ARTICLES CMS GRID */
                <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                  {/* Filters & Search Control Bar */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-bg-surface border border-border-default p-2.5 sm:p-3 rounded-2xl shadow-xs">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Cari artikel, konten, atau tags..."
                        value={articleSearchQuery}
                        onChange={(e) => setArticleSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSelectedSide('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                          selectedSide === 'ALL'
                            ? 'bg-accent-primary text-accent-contrast shadow-xs'
                            : 'bg-bg-primary text-text-muted hover:text-text-primary border border-border-default'
                        }`}
                      >
                        All
                      </button>

                      {SORSIDE_CATEGORIES.map((cat) => {
                        const isSelected = selectedSide === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedSide(cat.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium font-mono lowercase transition-colors cursor-pointer shrink-0 border ${
                              isSelected
                                ? 'bg-accent-primary text-accent-contrast border-accent-primary shadow-xs'
                                : 'bg-bg-primary text-text-muted hover:text-text-primary border-border-default'
                            }`}
                          >
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-bg-primary p-0.5 rounded-xl border border-border-default shrink-0">
                      {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatusFilter(status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
                            statusFilter === status
                              ? 'bg-bg-surface text-text-primary font-semibold shadow-xs'
                              : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {status === 'ALL' ? 'All' : status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Display */}
                  {isArticlesLoading && articles.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-text-muted space-y-3">
                      <RefreshCw size={24} className="animate-spin text-accent-primary" />
                      <p className="text-xs">Memuat artikel dari Supabase...</p>
                    </div>
                  ) : articlesError ? (
                    <div className="p-6 bg-status-error-bg border border-status-error/30 rounded-2xl text-status-error text-center space-y-3">
                      <AlertCircle size={24} className="mx-auto" />
                      <p className="text-sm font-semibold">{articlesError}</p>
                      <button
                        type="button"
                        onClick={refreshArticles}
                        className="px-4 py-1.5 rounded-xl text-xs bg-bg-surface text-text-primary border border-border-default hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        Coba Muat Ulang
                      </button>
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="py-16 sm:py-20 bg-bg-surface border border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center text-center px-4 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <BookOpen size={24} />
                      </div>
                      <div className="max-w-md">
                        <h3 className="text-sm font-bold text-text-heading">Belum Ada Artikel SORSIDE</h3>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                          {articleSearchQuery || selectedSide !== 'ALL' || statusFilter !== 'ALL'
                            ? 'Tidak ada artikel yang cocok dengan filter pencarian.'
                            : 'Mulai publikasikan pemikiran, refleksi batin, atau kisah manusia ke website Anda.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleNewArticle}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Tulis Artikel Baru</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsImportOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary border border-border-default transition-colors cursor-pointer"
                        >
                          <FileDown size={14} className="text-accent-primary" />
                          <span>Import dari Catatan</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {articles.map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          onEdit={openEditArticleModal}
                          onDelete={(id, title) => setDeleteTarget({ id, title, type: 'article' })}
                          onTogglePublish={handleTogglePublish}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* RELEASES CMS GRID */
                <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                  {/* Filter & Search Bar for Releases */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-bg-surface border border-border-default p-2.5 sm:p-3 rounded-2xl shadow-xs">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[180px]">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Cari judul rilisan, trek, atau konsep..."
                        value={releaseSearchQuery}
                        onChange={(e) => setReleaseSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Release Type Filter Buttons */}
                      <div className="flex items-center gap-1 bg-bg-primary p-0.5 rounded-xl border border-border-default shrink-0">
                        {(['ALL', 'SINGLE', 'EP', 'ALBUM'] as const).map((format) => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => setTypeFilter(format as any)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              typeFilter === format
                                ? 'bg-bg-surface text-accent-primary shadow-xs border border-border-default'
                                : 'text-text-muted hover:text-text-primary border border-transparent'
                            }`}
                          >
                            {format === 'ALL' ? 'ALL RELEASES' : format}
                          </button>
                        ))}
                      </div>

                      {/* Resequence button */}
                      <button
                        type="button"
                        onClick={handleOpenResequenceModal}
                        disabled={isResequencing || isReleasesLoading || allReleases.length === 0}
                        title="Urutkan semua catalog number dan order index secara kronologis tanpa nilai ganda"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-bg-primary hover:bg-bg-hover text-text-heading border border-border-default hover:border-accent-primary transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <ArrowDown10 size={14} className={isResequencing ? 'animate-spin text-accent-primary' : 'text-accent-primary'} />
                        <span className="hidden sm:inline">{isResequencing ? 'Mengurutkan...' : 'Urutkan Otomatis'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Duplicate Alert Banner if collisions detected */}
                  {duplicateCheck.hasDuplicates && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-status-error/10 border border-status-error/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                      <div className="flex items-start sm:items-center gap-2.5 text-status-error">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <p className="font-bold">
                            Perhatian: Terdeteksi nilai ganda pada Catalog Number atau Order Index!
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {duplicateCheck.duplicateCatalogs.length > 0 && `Catalog Number ganda: ${duplicateCheck.duplicateCatalogs.join(', ')}. `}
                            {duplicateCheck.duplicateOrders.length > 0 && `Order Index ganda: #${duplicateCheck.duplicateOrders.join(', #')}.`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenResequenceModal}
                        disabled={isResequencing}
                        className="px-3.5 py-1.5 rounded-xl bg-status-error hover:bg-status-error/90 text-white font-semibold text-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Wand2 size={13} />
                        <span>{isResequencing ? 'Memperbaiki...' : 'Perbaiki Urutan Sekarang'}</span>
                      </button>
                    </div>
                  )}

                  {/* Releases Content Display */}
                  {isReleasesLoading && releases.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-text-muted space-y-3">
                      <RefreshCw size={24} className="animate-spin text-accent-primary" />
                      <p className="text-xs">Memuat rilisan musik dari Supabase...</p>
                    </div>
                  ) : releasesError ? (
                    <div className="p-6 bg-status-error-bg border border-status-error/30 rounded-2xl text-status-error text-center space-y-3">
                      <AlertCircle size={24} className="mx-auto" />
                      <p className="text-sm font-semibold">{releasesError}</p>
                      <button
                        type="button"
                        onClick={refreshReleases}
                        className="px-4 py-1.5 rounded-xl text-xs bg-bg-surface text-text-primary border border-border-default hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        Coba Muat Ulang
                      </button>
                    </div>
                  ) : releases.length === 0 ? (
                    <div className="py-16 sm:py-20 bg-bg-surface border border-dashed border-border-default rounded-2xl flex flex-col items-center justify-center text-center px-4 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <Disc size={24} />
                      </div>
                      <div className="max-w-md">
                        <h3 className="text-sm font-bold text-text-heading">Belum Ada Rilisan Musik</h3>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                          {releaseSearchQuery || typeFilter !== 'ALL'
                            ? 'Tidak ada rilisan yang sesuai dengan filter pencarian.'
                            : 'Tambahkan Single, EP, atau Album SORSIDE Anda untuk langsung tampil di website!'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleNewRelease}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Tambah Rilisan Baru</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {releases.map((rel) => (
                        <ReleaseCard
                          key={rel.id}
                          release={rel}
                          onEdit={openEditReleaseModal}
                          onDelete={(id, title) => setDeleteTarget({ id, title, type: 'release' })}
                          onAddTrack={openNewTrackModal}
                          onEditTrack={openEditTrackModal}
                          onDeleteTrack={handleDeleteTrack}
                          activeAudioPreview={activeAudioPreview}
                          onToggleAudioPreview={handleToggleAudio}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Floating Audio Preview Player */}
      <AudioPreviewPlayer
        preview={activeAudioPreview}
        onClose={() => setActiveAudioPreview(null)}
      />

      {/* Modals & Dialogs */}
      <ImportNoteModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        vault={vaultState.vault}
        onSelectNote={handleSelectVaultNote}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'article' ? 'Hapus Artikel SORSIDE' : 'Hapus Rilisan Musik'}
        itemTitle={deleteTarget?.title || ''}
        itemType={deleteTarget?.type === 'article' ? 'Artikel' : 'Rilisan'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'article') {
            await handleDeleteArticle(deleteTarget.id, deleteTarget.title);
          } else {
            await handleDeleteRelease(deleteTarget.id, deleteTarget.title);
          }
        }}
      />

      <ResequenceConfirmModal
        isOpen={isResequenceModalOpen}
        releases={allReleases}
        isResequencing={isResequencing}
        onClose={() => setIsResequenceModalOpen(false)}
        onConfirm={handleConfirmResequence}
      />
    </div>
  );
};
