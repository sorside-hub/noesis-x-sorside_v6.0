import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db, MediaAttachment } from '../../../lib/db';
import { useNavigation } from '../../../context/NavigationContext';
import { useVault } from '../../../hooks/useVault';
import { 
  deleteMediaAttachment, 
  moveMediaToTrash, 
  restoreMediaFromTrash, 
  renameMediaAttachment, 
  uploadMediaFile, 
  syncMediaFromSupabaseStorage 
} from '../../../lib/mediaStorage';
import { handleCopyMediaLink, convertAudioUrlToBase64 } from '../utils/mediaUtils';
import { computeCategoryCounts, filterAndSortMedia } from '../utils/mediaFilters';
import { MediaCategory, SortOption, ScanBannerState, LinkedNoteInfo } from '../types';
import { CATEGORIES_CONFIG } from '../constants';

export const useMediaManager = (externalVault?: any) => {
  const { view, navigateView, navigateToNote, openModal, mediaCategory, navigateToMediaCategory, goBack } = useNavigation();
  const internalVaultState = useVault();
  const vault = externalVault || internalVaultState.vault;

  // State Management
  const [mediaList, setMediaList] = useState<MediaAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const notesList = useMemo(() => {
    if (!vault?.nodes) return [];
    return Object.values(vault.nodes)
      .filter((n: any) => n.type === 'file' || n.type === 'note')
      .map((n: any) => ({ id: n.id, name: n.name, content: n.content || '' }));
  }, [vault?.nodes]);
  const selectedCategory = (mediaCategory as MediaCategory) || null;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanBanner, setScanBanner] = useState<ScanBannerState | null>(null);

  // Audio Playback & Action States
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaAttachment | null>(null);
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState<MediaAttachment | null>(null);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch Media Data from IndexedDB
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allMedia = await db.media_attachments.toArray();
      setMediaList(allMedia);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to cloud sync media updates
  useEffect(() => {
    const handleMediaUpdated = () => {
      loadData();
    };
    window.addEventListener('media-updated', handleMediaUpdated);
    return () => {
      window.removeEventListener('media-updated', handleMediaUpdated);
    };
  }, [loadData]);

  // Navigation Category Handlers with History integration
  const handleOpenCategory = useCallback((catId: MediaCategory) => {
    setSearchQuery('');
    navigateToMediaCategory(catId);
  }, [navigateToMediaCategory]);

  const handleBackToMain = useCallback(() => {
    setSearchQuery('');
    if (typeof window !== 'undefined' && window.history?.state?.mediaCategory) {
      goBack();
    } else {
      navigateToMediaCategory(null);
    }
  }, [goBack, navigateToMediaCategory]);

  // Upload & Scan Storage Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadMediaFile(files[0]);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleScanStorage = async () => {
    setIsScanning(true);
    setScanBanner(null);
    try {
      const res = await syncMediaFromSupabaseStorage();
      await loadData();
      setScanBanner({ type: 'success', message: res.message });
      setTimeout(() => setScanBanner(null), 5000);
    } catch (err: any) {
      setScanBanner({ type: 'error', message: err.message || 'Gagal memindai storage.' });
      setTimeout(() => setScanBanner(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  // Audio Playback
  const toggleAudio = (item: MediaAttachment) => {
    if (playingId === item.id) {
      setPlayingId(null);
    } else {
      setPlayingId(item.id);
    }
  };

  // Copy & Rename Handlers
  const handleCopy = (item: MediaAttachment, type: 'markdown' | 'url' = 'markdown') => {
    handleCopyMediaLink(item, type);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (item: MediaAttachment) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const saveRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    await renameMediaAttachment(id, editTitle.trim());
    setEditingId(null);
    await loadData();
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveRename(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  // Trash & Delete Handlers
  const handleMoveToTrash = async (item: MediaAttachment) => {
    await moveMediaToTrash(item.id);
    await loadData();
  };

  const handleRestoreFromTrash = async (item: MediaAttachment) => {
    await restoreMediaFromTrash(item.id);
    await loadData();
  };

  const handleDeleteMedia = async () => {
    if (!confirmDeleteMedia) return;
    setDeletingId(confirmDeleteMedia.id);
    try {
      await deleteMediaAttachment(confirmDeleteMedia.id, confirmDeleteMedia.url);
      setConfirmDeleteMedia(null);
      await loadData();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = () => {
    setShowEmptyTrashModal(true);
  };

  const handleConfirmEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const trashed = mediaList.filter(m => !!m.deletedAt);
      await Promise.all(trashed.map(m => deleteMediaAttachment(m.id, m.url)));
      await loadData();
      setShowEmptyTrashModal(false);
    } catch (err) {
      console.error('Failed to empty trash:', err);
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  // Transcribe Audio to AI Note
  const handleTranscribeMediaToNote = async (item: MediaAttachment) => {
    setTranscribingId(item.id);
    try {
      const { base64, mimeType } = await convertAudioUrlToBase64(item.url);
      const res = await fetch('/api/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      });

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP error ${res.status}`);
      const data = await res.json();
      let noteTitle = item.title || 'Voice Note AI';
      let contentBody = data.structuredNote || '';
      const titleMatch = contentBody.match(/^#\s+(.+)$/m);
      if (titleMatch?.[1]) {
        noteTitle = titleMatch[1].trim();
        contentBody = contentBody.replace(/^#\s+(.+)$\n*/m, '').trim();
      }

      const newNoteId = await internalVaultState.createNote(null, noteTitle);
      if (newNoteId) {
        await internalVaultState.updateNoteContent(newNoteId, contentBody);
        navigateToNote(newNoteId);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah audio menjadi catatan AI.');
    } finally {
      setTranscribingId(null);
    }
  };

  // Computed Values
  const activeMedia = useMemo(() => mediaList.filter(m => !m.deletedAt), [mediaList]);
  const trashedMedia = useMemo(() => mediaList.filter(m => !!m.deletedAt), [mediaList]);

  const getCategoryCount = useCallback((catId: MediaCategory) => {
    return computeCategoryCounts(activeMedia, trashedMedia, notesList, catId);
  }, [activeMedia, trashedMedia, notesList]);

  const getLinkedNotes = useCallback((url: string): LinkedNoteInfo[] => {
    return notesList.filter(n => n.content?.includes(url)).map(n => ({ id: n.id, name: n.name }));
  }, [notesList]);

  const currentCategoryMeta = useMemo(() => {
    return selectedCategory ? CATEGORIES_CONFIG.find(c => c.id === selectedCategory) : undefined;
  }, [selectedCategory]);

  const filteredMediaList = useMemo(() => {
    return filterAndSortMedia(mediaList, selectedCategory, searchQuery, sortBy, notesList);
  }, [mediaList, selectedCategory, searchQuery, sortBy, notesList]);

  return {
    mediaList,
    notesList,
    isLoading,
    selectedCategory,
    setSelectedCategory: (cat: MediaCategory | null) => navigateToMediaCategory(cat),
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
  };
};
