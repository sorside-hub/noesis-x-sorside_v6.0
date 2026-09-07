import React, { useState, useEffect, useRef } from 'react';
import { SorsideRelease, SorsideReleaseType, SorsideTrack, SorsideArticle, SorsideCreditItem } from '../../../types/sorside';
import {
  generateSlug,
  formatReleaseDate,
  resolveCoverImageUrl,
  getCloudinaryCloudName,
  DEFAULT_SORSIDE_COVER_URL,
  getNextCatalogNumber,
  getNextOrderIndex,
  findDuplicateCatalogNumber,
  findDuplicateOrderIndex
} from '../../../lib/sorsideService';
import { CreditsBuilder, DEFAULT_SORSIDE_CREDITS_TEMPLATE } from './CreditsBuilder';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  Save,
  Disc,
  Music,
  Plus,
  Trash2,
  FileText,
  Share2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Image as ImageIcon,
  ArrowLeft,
  BookOpen,
  Hash,
  Layers,
  Sparkles,
  Video,
  Eye,
  EyeOff,
  Globe,
  History,
  Wand2,
  Check,
  ArrowDown10
} from 'lucide-react';

interface ReleaseEditorViewProps {
  release: SorsideRelease | null;
  releases?: SorsideRelease[];
  articles?: SorsideArticle[];
  onBack: () => void;
  onSave: (releaseData: Partial<SorsideRelease> & { id: string; title: string; type: SorsideReleaseType }) => Promise<any>;
  onSaveTrack?: (trackData: Partial<SorsideTrack> & { id: string; release_id: string; number: number; title: string }) => Promise<any>;
  onOpenTrackEditor?: (releaseId: string, nextNumber: number, track?: SorsideTrack) => void;
  onDeleteTrack?: (trackId: string, trackTitle: string, releaseId: string) => void;
  activeAudioPreview?: { title: string; url: string } | null;
  onToggleAudioPreview?: (title: string, url: string) => void;
}

// Helper to extract credits items from raw record/string/array
const parseCreditsToItems = (credits: any, creditsText?: string | null): SorsideCreditItem[] => {
  if (Array.isArray(credits) && credits.length > 0) {
    return credits.map((item) => ({
      role: String(item.role || item.key || ''),
      name: String(item.name || item.value || '')
    }));
  }

  const textToParse =
    creditsText ||
    (typeof credits === 'string' ? credits : '') ||
    credits?.liner_notes ||
    credits?.text;

  if (textToParse && typeof textToParse === 'string') {
    const trimmed = textToParse.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            role: String(item.role || item.key || ''),
            name: String(item.name || item.value || '')
          }));
        }
      } catch {}
    }
    const lines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      return lines.map((line) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          return {
            role: line.substring(0, colonIdx).trim(),
            name: line.substring(colonIdx + 1).trim()
          };
        }
        return { role: 'Credit', name: line };
      });
    }
  }

  if (typeof credits === 'object' && credits !== null) {
    return Object.entries(credits)
      .filter(([k]) => k !== 'liner_notes' && k !== 'text')
      .map(([k, v]) => ({
        role: k.charAt(0).toUpperCase() + k.slice(1),
        name: String(v)
      }));
  }

  return [];
};

export const ReleaseEditorView: React.FC<ReleaseEditorViewProps> = ({
  release,
  releases = [],
  articles = [],
  onBack,
  onSave,
  onSaveTrack,
  onDeleteTrack
}) => {
  const isEditing = Boolean(release);

  // Compute auto sequential catalog number and order index
  const autoNextCatalog = getNextCatalogNumber(releases, release?.id);
  const autoNextOrder = getNextOrderIndex(releases, release?.id);

  // Release Level Info
  const [title, setTitle] = useState(() => release?.title || '');
  const [slugId, setSlugId] = useState(() => release?.slug || release?.id || '');
  const [type, setType] = useState<SorsideReleaseType>(() => release?.type || 'SINGLE');
  const [releaseDate, setReleaseDate] = useState(() => release?.release_date || release?.year || formatReleaseDate(new Date()));
  const [songCount, setSongCount] = useState(() => release?.song_count || (release?.type === 'SINGLE' ? '1 SONG' : '0 SONGS'));
  const [coverArt, setCoverArt] = useState(() => release?.cover || release?.cover_art || '');
  const [tagline, setTagline] = useState(() => release?.tagline || '');
  const [catalogNumber, setCatalogNumber] = useState(() => release?.catalog_number || autoNextCatalog);
  const [originSlug, setOriginSlug] = useState(() => release?.origin_slug || '');
  const [orderIndex, setOrderIndex] = useState<string>(() =>
    release?.order_index !== undefined && release?.order_index !== null
      ? String(release.order_index)
      : String(autoNextOrder)
  );
  const [published, setPublished] = useState<boolean>(() => release?.published !== undefined ? Boolean(release.published) : false);

  // Real-time uniqueness validation
  const duplicateCatalogRel = findDuplicateCatalogNumber(catalogNumber, releases, release?.id);
  const duplicateOrderRel = findDuplicateOrderIndex(orderIndex, releases, release?.id);

  // Single Lyrics
  const [lyrics, setLyrics] = useState(() => release?.lyrics || '');

  // Credits JSONB Items list
  const [creditsItems, setCreditsItems] = useState<SorsideCreditItem[]>(() =>
    parseCreditsToItems(release?.credits, release?.credits_text)
  );

  // Streaming Links (Only 3: Spotify, YouTube, Apple Music)
  const [spotify, setSpotify] = useState(() => release?.stream_links?.spotify || '');
  const [youtube, setYoutube] = useState(() => release?.stream_links?.youtube || '');
  const [appleMusic, setAppleMusic] = useState(() => release?.stream_links?.apple_music || release?.stream_links?.appleMusic || '');

  // Multi-track state (for EP / ALBUM)
  const [tracks, setTracks] = useState<SorsideTrack[]>(() => release?.tracks ? [...release.tracks].sort((a, b) => a.number - b.number) : []);
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (release?.type !== 'SINGLE' && release?.tracks && release.tracks.length > 0) {
      return release.tracks[0].id;
    }
    return 'album-info';
  });
  const [mobileView, setMobileView] = useState<'tracklist' | 'album-metadata' | 'track-editor'>('tracklist');

  // Sub-tabs for SINGLE mode: 'lyrics' | 'metadata'
  const [singleTab, setSingleTab] = useState<'lyrics' | 'metadata'>('lyrics');

  // Sub-tabs for TRACK mode (EP / ALBUM): 'lyrics' | 'metadata'
  const [trackTab, setTrackTab] = useState<'lyrics' | 'metadata'>('lyrics');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Draft storage key for local autosave
  const draftKey = `sorside_release_draft_${release?.id || 'new'}`;

  // Initial values reference to compute isDirty
  const initialValuesRef = useRef({
    title: release?.title || '',
    slugId: release?.slug || release?.id || '',
    type: release?.type || 'SINGLE',
    releaseDate: release?.release_date || release?.year || formatReleaseDate(new Date()),
    songCount: release?.song_count || (release?.type === 'SINGLE' ? '1 SONG' : '0 SONGS'),
    coverArt: release?.cover || release?.cover_art || '',
    tagline: release?.tagline || '',
    catalogNumber: release?.catalog_number || autoNextCatalog,
    originSlug: release?.origin_slug || '',
    orderIndex: release?.order_index !== undefined && release?.order_index !== null ? String(release.order_index) : String(autoNextOrder),
    published: release?.published !== undefined ? Boolean(release.published) : false,
    lyrics: release?.lyrics || '',
    creditsJson: JSON.stringify(parseCreditsToItems(release?.credits, release?.credits_text)),
    spotify: release?.stream_links?.spotify || '',
    youtube: release?.stream_links?.youtube || '',
    appleMusic: release?.stream_links?.apple_music || release?.stream_links?.appleMusic || '',
    tracksJson: JSON.stringify(release?.tracks || [])
  });

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<any | null>(null);

  // Determine if there are unsaved changes
  const isDirty =
    title !== initialValuesRef.current.title ||
    slugId !== initialValuesRef.current.slugId ||
    type !== initialValuesRef.current.type ||
    releaseDate !== initialValuesRef.current.releaseDate ||
    coverArt !== initialValuesRef.current.coverArt ||
    tagline !== initialValuesRef.current.tagline ||
    catalogNumber !== initialValuesRef.current.catalogNumber ||
    originSlug !== initialValuesRef.current.originSlug ||
    orderIndex !== initialValuesRef.current.orderIndex ||
    published !== initialValuesRef.current.published ||
    lyrics !== initialValuesRef.current.lyrics ||
    JSON.stringify(creditsItems) !== initialValuesRef.current.creditsJson ||
    spotify !== initialValuesRef.current.spotify ||
    youtube !== initialValuesRef.current.youtube ||
    appleMusic !== initialValuesRef.current.appleMusic ||
    JSON.stringify(tracks) !== initialValuesRef.current.tracksJson;

  // Local Autosave Effect
  useEffect(() => {
    if (isDirty && (title.trim() || lyrics.trim() || tracks.length > 0 || creditsItems.length > 0)) {
      const draftData = {
        title,
        slugId,
        type,
        releaseDate,
        songCount,
        coverArt,
        tagline,
        catalogNumber,
        originSlug,
        orderIndex,
        published,
        lyrics,
        creditsItems,
        spotify,
        youtube,
        appleMusic,
        tracks,
        timestamp: Date.now()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [
    title,
    slugId,
    type,
    releaseDate,
    songCount,
    coverArt,
    tagline,
    catalogNumber,
    originSlug,
    orderIndex,
    published,
    lyrics,
    creditsItems,
    spotify,
    youtube,
    appleMusic,
    tracks,
    isDirty,
    draftKey
  ]);

  // Check for existing local draft recovery on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          (parsed.title !== initialValuesRef.current.title ||
            parsed.lyrics !== initialValuesRef.current.lyrics ||
            JSON.stringify(parsed.creditsItems || []) !== initialValuesRef.current.creditsJson ||
            JSON.stringify(parsed.tracks || []) !== initialValuesRef.current.tracksJson) &&
          (parsed.title?.trim() || parsed.lyrics?.trim() || (parsed.tracks && parsed.tracks.length > 0) || (parsed.creditsItems && parsed.creditsItems.length > 0))
        ) {
          setRecoveredDraft(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved release draft:', err);
    }
  }, [draftKey]);

  // Browser / Phone Back navigation integration & unsaved prompt
  useEffect(() => {
    window.history.pushState({ sorsideReleaseEditor: true }, '');
    const handlePopState = () => {
      if (mobileView === 'track-editor') {
        setMobileView('tracklist');
      } else if (isDirty) {
        setIsExitModalOpen(true);
      } else {
        localStorage.removeItem(draftKey);
        onBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack, mobileView, isDirty, draftKey]);

  // Tab close / refresh warning when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Initialize form state when release prop changes
  useEffect(() => {
    if (release) {
      const relType = release.type || 'SINGLE';
      const loadedTracks = release.tracks ? [...release.tracks].sort((a, b) => a.number - b.number) : [];
      const parsedCredits = parseCreditsToItems(release.credits, release.credits_text);
      const initVals = {
        title: release.title || '',
        slugId: release.slug || release.id || '',
        type: relType,
        releaseDate: release.release_date || release.year || formatReleaseDate(new Date()),
        songCount: release.song_count || (relType === 'SINGLE' ? '1 SONG' : `${loadedTracks.length} SONGS`),
        coverArt: release.cover || release.cover_art || '',
        tagline: release.tagline || '',
        catalogNumber: release.catalog_number || 'SS-001',
        originSlug: release.origin_slug || '',
        orderIndex: release.order_index !== undefined && release.order_index !== null ? String(release.order_index) : '1',
        published: release.published !== undefined ? Boolean(release.published) : false,
        lyrics: release.lyrics || '',
        creditsJson: JSON.stringify(parsedCredits),
        spotify: release.stream_links?.spotify || '',
        youtube: release.stream_links?.youtube || '',
        appleMusic: release.stream_links?.apple_music || release.stream_links?.appleMusic || '',
        tracksJson: JSON.stringify(loadedTracks)
      };
      initialValuesRef.current = initVals;

      setTitle(initVals.title);
      setSlugId(initVals.slugId);
      setType(initVals.type);
      setReleaseDate(initVals.releaseDate);
      setSongCount(initVals.songCount);
      setCoverArt(initVals.coverArt);
      setTagline(initVals.tagline);
      setCatalogNumber(initVals.catalogNumber);
      setOriginSlug(initVals.originSlug);
      setOrderIndex(initVals.orderIndex);
      setPublished(initVals.published);
      setLyrics(initVals.lyrics);
      setCreditsItems(parsedCredits);
      setSpotify(initVals.spotify);
      setYoutube(initVals.youtube);
      setAppleMusic(initVals.appleMusic);
      setTracks(loadedTracks);

      if (relType !== 'SINGLE') {
        setSelectedItemId(loadedTracks.length > 0 ? loadedTracks[0].id : 'album-info');
      }
    } else {
      const initVals = {
        title: '',
        slugId: '',
        type: 'SINGLE' as SorsideReleaseType,
        releaseDate: formatReleaseDate(new Date()),
        songCount: '1 SONG',
        coverArt: '',
        tagline: '',
        catalogNumber: 'SS-001',
        originSlug: '',
        orderIndex: '1',
        published: false,
        lyrics: '',
        creditsJson: '[]',
        spotify: '',
        youtube: '',
        appleMusic: '',
        tracksJson: '[]'
      };
      initialValuesRef.current = initVals;

      setTitle('');
      setSlugId('');
      setType('SINGLE');
      setReleaseDate(formatReleaseDate(new Date()));
      setSongCount('1 SONG');
      setCoverArt('');
      setTagline('');
      setCatalogNumber('SS-001');
      setOriginSlug('');
      setOrderIndex('1');
      setPublished(false);
      setLyrics('');
      setCreditsItems([]);
      setSpotify('');
      setYoutube('');
      setAppleMusic('');
      setTracks([]);
      setSelectedItemId('album-info');
    }
    setError(null);
  }, [release]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft) return;
    if (recoveredDraft.title !== undefined) setTitle(recoveredDraft.title);
    if (recoveredDraft.slugId !== undefined) setSlugId(recoveredDraft.slugId);
    if (recoveredDraft.type !== undefined) setType(recoveredDraft.type);
    if (recoveredDraft.releaseDate !== undefined) setReleaseDate(recoveredDraft.releaseDate);
    if (recoveredDraft.songCount !== undefined) setSongCount(recoveredDraft.songCount);
    if (recoveredDraft.coverArt !== undefined) setCoverArt(recoveredDraft.coverArt);
    if (recoveredDraft.tagline !== undefined) setTagline(recoveredDraft.tagline);
    if (recoveredDraft.catalogNumber !== undefined) setCatalogNumber(recoveredDraft.catalogNumber);
    if (recoveredDraft.originSlug !== undefined) setOriginSlug(recoveredDraft.originSlug);
    if (recoveredDraft.orderIndex !== undefined) setOrderIndex(recoveredDraft.orderIndex);
    if (recoveredDraft.published !== undefined) setPublished(recoveredDraft.published);
    if (recoveredDraft.lyrics !== undefined) setLyrics(recoveredDraft.lyrics);
    if (recoveredDraft.creditsItems !== undefined && Array.isArray(recoveredDraft.creditsItems)) {
      setCreditsItems(recoveredDraft.creditsItems);
    }
    if (recoveredDraft.spotify !== undefined) setSpotify(recoveredDraft.spotify);
    if (recoveredDraft.youtube !== undefined) setYoutube(recoveredDraft.youtube);
    if (recoveredDraft.appleMusic !== undefined) setAppleMusic(recoveredDraft.appleMusic);
    if (recoveredDraft.tracks !== undefined && Array.isArray(recoveredDraft.tracks)) {
      setTracks(recoveredDraft.tracks);
      if (recoveredDraft.tracks.length > 0) {
        setSelectedItemId(recoveredDraft.tracks[0].id);
      }
    }
    setSuccessNotice('Draf rilisan lokal berhasil dipulihkan!');
    setTimeout(() => setSuccessNotice(null), 3000);
    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setRecoveredDraft(null);
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsExitModalOpen(true);
    } else {
      localStorage.removeItem(draftKey);
      onBack();
    }
  };

  const handleConfirmExit = () => {
    localStorage.removeItem(draftKey);
    setIsExitModalOpen(false);
    onBack();
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlugId(generateSlug(val));
    }
  };

  const handleTypeChange = (newType: SorsideReleaseType) => {
    setType(newType);
    if (newType === 'SINGLE') {
      setSongCount('1 SONG');
      setSelectedItemId('album-info');
    } else {
      setSongCount(`${tracks.length} SONGS`);
      if (tracks.length > 0 && selectedItemId === 'album-info') {
        setSelectedItemId(tracks[0].id);
      }
    }
  };

  // Selected Track object (for EP/Album)
  const selectedTrack = tracks.find((t) => t.id === selectedItemId) || null;

  const handleUpdateCurrentTrack = (field: keyof SorsideTrack, val: any) => {
    if (!selectedTrack) return;
    setTracks((prev) =>
      prev.map((t) => (t.id === selectedTrack.id ? { ...t, [field]: val } : t))
    );
  };

  const handleAddNewTrack = () => {
    const nextNum = tracks.length + 1;
    const newTrackId = `${slugId || 'temp-rel'}-${Date.now().toString().slice(-4)}`;
    const newTrack: SorsideTrack = {
      id: newTrackId,
      release_id: slugId || generateSlug(title) || 'release',
      number: nextNum,
      title: `Track ${nextNum}`,
      duration: '',
      audio_url: '',
      youtube_url: '',
      origin_slug: '',
      lyrics: '',
      story: ''
    };
    setTracks((prev) => [...prev, newTrack]);
    setSelectedItemId(newTrackId);
    setTrackTab('lyrics');
    setMobileView('track-editor');
  };

  const [trackToDelete, setTrackToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteCurrentTrack = (trackId: string, trackTitle: string) => {
    setTrackToDelete({ id: trackId, title: trackTitle });
  };

  const handleConfirmDeleteTrack = () => {
    if (!trackToDelete) return;
    const { id: trackId, title: trackTitle } = trackToDelete;
    if (onDeleteTrack && release?.id) {
      onDeleteTrack(trackId, trackTitle, release.id);
    }
    const updated = tracks.filter((t) => t.id !== trackId);
    setTracks(updated);
    if (selectedItemId === trackId) {
      setSelectedItemId(updated.length > 0 ? updated[0].id : 'album-info');
      setMobileView('tracklist');
    }
    setTrackToDelete(null);
  };

  // Submit full release (EP, Album, or Single)
  const handleSubmitRelease = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Default title to 'Untitled' if empty
    const effectiveTitle = title.trim() || 'Untitled';
    if (!title.trim()) {
      setTitle('Untitled');
    }

    // Default slug if empty
    const effectiveSlug = slugId.trim() || generateSlug(effectiveTitle) || 'untitled';
    if (!slugId.trim()) {
      setSlugId(effectiveSlug);
    }

    // Uniqueness validation: check duplicate catalog_number or order_index
    if (duplicateCatalogRel) {
      setError(
        `Catalog number "${catalogNumber}" sudah digunakan oleh rilisan "${duplicateCatalogRel.title}". Setiap rilisan harus memiliki catalog number yang unik! Silakan gunakan nomor lain atau klik Auto.`
      );
      return;
    }

    if (duplicateOrderRel) {
      setError(
        `Order index "${orderIndex}" sudah digunakan oleh rilisan "${duplicateOrderRel.title}". Setiap rilisan harus memiliki order index yang unik! Silakan gunakan urutan lain atau klik Auto.`
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    const streamData: Record<string, string> = {};
    if (spotify.trim()) streamData.spotify = spotify.trim();
    if (youtube.trim()) streamData.youtube = youtube.trim();
    if (appleMusic.trim()) streamData.apple_music = appleMusic.trim();

    try {
      const cleanSlug = generateSlug(effectiveSlug) || 'untitled';
      const parsedOrderIndex = orderIndex ? parseInt(orderIndex, 10) : 0;
      const effectiveCatalog = catalogNumber.trim() || autoNextCatalog;
      const effectiveOrderIndex =
        isNaN(parsedOrderIndex) || parsedOrderIndex <= 0 ? autoNextOrder : parsedOrderIndex;

      // Normalize tracks: make sure every track has a title and sequential number
      const normalizedTracks = (type !== 'SINGLE' ? tracks : []).map((t, idx) => ({
        ...t,
        number: idx + 1,
        track_number: idx + 1,
        title: (t.title || `Track ${idx + 1}`).trim()
      }));

      if (type !== 'SINGLE' && tracks.length > 0) {
        setTracks(normalizedTracks);
      }

      const rawCoverInput = coverArt.trim();
      const finalCover = (!rawCoverInput || rawCoverInput === 'cover-all')
        ? DEFAULT_SORSIDE_COVER_URL
        : resolveCoverImageUrl(rawCoverInput);

      await onSave({
        id: release?.id || cleanSlug,
        slug: cleanSlug,
        title: effectiveTitle,
        type,
        release_date: releaseDate.trim() || null,
        song_count: type === 'SINGLE' ? '1 SONG' : `${normalizedTracks.length} ${normalizedTracks.length === 1 ? 'SONG' : 'SONGS'}`,
        cover_url: finalCover,
        cover: finalCover,
        cover_art: finalCover,
        tagline: tagline.trim() || null,
        catalog_number: effectiveCatalog,
        origin_slug: originSlug.trim() || null,
        order_index: effectiveOrderIndex,
        lyrics: type === 'SINGLE' ? lyrics.trim() || null : null,
        spotify_url: spotify.trim() || null,
        apple_music_url: appleMusic.trim() || null,
        youtube_url: youtube.trim() || null,
        credits: creditsItems.length > 0 ? creditsItems : null,
        credits_text: creditsItems.map((c) => `${c.role}: ${c.name}`).join('\n') || null,
        published: published,
        stream_links: Object.keys(streamData).length > 0 ? streamData : null,
        tracks: normalizedTracks
      });

      // Clear local auto-saved draft upon successful save
      localStorage.removeItem(draftKey);

      // Update initial values ref to reset isDirty
      initialValuesRef.current = {
        title: effectiveTitle,
        slugId: cleanSlug,
        type,
        releaseDate: releaseDate.trim(),
        songCount: type === 'SINGLE' ? '1 SONG' : `${normalizedTracks.length} ${normalizedTracks.length === 1 ? 'SONG' : 'SONGS'}`,
        coverArt: coverArt.trim(),
        tagline: tagline.trim(),
        catalogNumber: catalogNumber.trim(),
        originSlug: originSlug.trim(),
        orderIndex: String(parsedOrderIndex),
        published,
        lyrics: type === 'SINGLE' ? lyrics.trim() : '',
        creditsJson: JSON.stringify(creditsItems),
        spotify: spotify.trim(),
        youtube: youtube.trim(),
        appleMusic: appleMusic.trim(),
        tracksJson: JSON.stringify(normalizedTracks)
      };

      setSuccessNotice('Rilisan musik berhasil disimpan ke Supabase!');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      console.error('Save release error:', err);
      setError(err.message || 'Gagal menyimpan rilisan musik.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSingle = type === 'SINGLE';

  return (
    <div className="h-full w-full flex flex-col bg-bg-primary select-none overflow-hidden animate-in fade-in duration-200 relative">
      {/* Top Main Header */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-bg-surface border-b border-border-default shrink-0 z-20 space-y-2">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Back + Release Title */}
          <div className="min-w-0 flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackClick}
              title="Kembali"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/30 shrink-0 uppercase">
              {type}
            </span>
            <span className="text-xs font-semibold text-text-heading truncate max-w-[120px] sm:max-w-[220px] md:max-w-[320px]">
              {title || 'Rilisan Baru'}
            </span>
          </div>

          {/* Center: Interactive Type Release Selector */}
          <div className="flex items-center bg-bg-primary p-0.5 sm:p-1 rounded-xl border border-border-default shrink-0">
            {(['SINGLE', 'EP', 'ALBUM'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleTypeChange(fmt)}
                className={`px-2.5 sm:px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  type === fmt
                    ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Right: Read-only Status Dot + Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              title={published ? 'Status: Published (Ubah di tab Metadata)' : 'Status: Draft (Ubah di tab Metadata)'}
              className={`w-2.5 h-2.5 rounded-full shrink-0 select-none ${
                published ? 'bg-emerald-400 animate-pulse' : 'bg-text-muted/60'
              }`}
            />

            <button
              type="button"
              onClick={() => handleSubmitRelease()}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shrink-0 active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="hidden sm:inline">Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-header Tabs for SINGLE mode: Only Lyrics and Metadata */}
        {isSingle && (
          <div className="pt-1 flex items-center justify-center">
            <div className="flex items-center bg-bg-primary p-0.5 rounded-xl border border-border-default">
              <button
                type="button"
                onClick={() => setSingleTab('lyrics')}
                className={`flex items-center gap-1.5 px-4 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  singleTab === 'lyrics'
                    ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <FileText size={13} />
                <span>lyrics</span>
              </button>
              <button
                type="button"
                onClick={() => setSingleTab('metadata')}
                className={`flex items-center gap-1.5 px-4 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  singleTab === 'metadata'
                    ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>metadata</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Sub-header Tabs for EP / ALBUM mode */}
        {!isSingle && mobileView !== 'track-editor' && (
          <div className="md:hidden pt-1 flex items-center justify-center">
            <div className="flex items-center w-full bg-bg-primary p-0.5 rounded-xl border border-border-default">
              <button
                type="button"
                onClick={() => setMobileView('tracklist')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mobileView === 'tracklist'
                    ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Disc size={13} />
                <span>Daftar Track ({tracks.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedItemId('album-info');
                  setMobileView('album-metadata');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mobileView === 'album-metadata'
                    ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Info {type === 'EP' ? 'EP' : 'Album'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Local Draft Recovery Banner */}
      {recoveredDraft && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 text-xs text-amber-300 animate-in slide-in-from-top-1 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <History size={15} className="shrink-0 text-amber-400" />
            <span className="truncate">
              Ditemukan draf rilisan lokal tersimpan dari sesi sebelumnya ({recoveredDraft.timestamp ? new Date(recoveredDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'sebelumnya'}).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-2.5 py-1 bg-amber-500 text-black font-bold text-[11px] rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Pulihkan Draf
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2 py-1 text-amber-400 hover:text-amber-200 text-[11px] transition-colors cursor-pointer"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="px-4 sm:px-6 py-2.5 bg-status-error-bg border-b border-status-error/30 text-status-error text-xs font-medium flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="underline cursor-pointer text-xs">
            Tutup
          </button>
        </div>
      )}

      {successNotice && (
        <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in">
          <CheckCircle2 size={15} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 1: SINGLE RELEASE MODE (Only Lyrics and Metadata) */}
      {/* ========================================================================= */}
      {isSingle ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
          {singleTab === 'lyrics' ? (
            /* TAB 1: LYRICS */
            <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-8">
              <div className="max-w-3xl w-full mx-auto h-full flex flex-col space-y-3">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-semibold text-text-heading flex items-center gap-1.5">
                    <FileText size={14} className="text-accent-primary" />
                    <span>Lirik Lagu "{title || 'Single'}"</span>
                  </span>
                  <span className="font-mono text-[11px] bg-bg-surface px-2 py-0.5 rounded border border-border-default">
                    {lyrics.split('\n').filter(Boolean).length} baris
                  </span>
                </div>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder={`[Verse 1]\nTulis bait pertama lirik di sini...\n\n[Chorus]\nTulis bagian reff / chorus di sini...`}
                  className="w-full flex-1 min-h-[380px] p-4 sm:p-6 bg-bg-surface border border-border-default focus:border-accent-primary rounded-2xl text-xs sm:text-sm text-text-primary outline-none font-mono leading-relaxed resize-none shadow-xs placeholder:text-text-muted/50"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: METADATA */
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="max-w-3xl mx-auto space-y-6 pb-20">
                {/* Status Publikasi (Published vs Draft) */}
                <div className="bg-bg-surface border border-border-default p-4 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-text-heading flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe size={14} className="text-accent-primary" />
                      <span>Status Publikasi Website</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      published
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-text-muted/10 text-text-muted border-border-default'
                    }`}>
                      {published ? '● PUBLISHED' : '○ DRAFT'}
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPublished(true)}
                      className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        published
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                          : 'bg-bg-primary text-text-muted border-border-default hover:text-text-primary hover:border-border-hover'
                      }`}
                    >
                      <Eye size={15} />
                      <span>Published</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPublished(false)}
                      className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        !published
                          ? 'bg-text-muted/15 text-text-primary border-text-muted/40 shadow-xs ring-1 ring-text-muted/20'
                          : 'bg-bg-primary text-text-muted border-border-default hover:text-text-primary hover:border-border-hover'
                      }`}
                    >
                      <EyeOff size={15} />
                      <span>Draft</span>
                    </button>
                  </div>
                </div>

                {/* 1. Type Release Selector Card */}
                <div className="space-y-2 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                  <div className="font-bold text-text-heading text-xs uppercase tracking-wider">
                    type release
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SINGLE', 'EP', 'ALBUM'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleTypeChange(fmt)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          type === fmt
                            ? 'bg-accent-primary/10 border-accent-primary text-accent-primary font-bold shadow-xs'
                            : 'bg-bg-primary border-border-default text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <div className="text-xs font-bold">{fmt}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {fmt === 'SINGLE' ? '1 Lagu' : fmt === 'EP' ? '2–6 Lagu' : '6+ Lagu'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Informasi Utama (Title, Slug ID, Release Date) */}
                <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                  <div className="font-bold text-text-heading text-xs uppercase tracking-wider">
                    Informasi Utama
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-text-heading">title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Judul Single"
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-heading">slug id</label>
                      <input
                        type="text"
                        value={slugId}
                        onChange={(e) => setSlugId(e.target.value)}
                        placeholder="e.g. titik-koma"
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-heading">release date</label>
                      <input
                        type="text"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        placeholder="25-09-2026"
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Metadata Tambahan: Tagline, Catalog Number, Origin Slug, Order Index */}
                <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                  <div className="font-bold text-text-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent-primary" />
                    <span>metadata rilisan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Tagline */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-text-heading">tagline</label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="Catatan singkat / kutipan rilisan"
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>

                    {/* Catalog Number */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-text-heading flex items-center gap-1">
                          <Hash size={12} className="text-accent-primary" />
                          <span>catalog number</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setCatalogNumber(autoNextCatalog)}
                          className="text-[10px] font-semibold text-accent-primary hover:underline flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
                          title="Generate catalog number berikutnya secara otomatis"
                        >
                          <Wand2 size={10} />
                          <span>Auto ({autoNextCatalog})</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={catalogNumber}
                        onChange={(e) => setCatalogNumber(e.target.value)}
                        placeholder={autoNextCatalog}
                        className={`w-full px-3 py-2 bg-bg-primary border rounded-xl text-xs outline-none font-mono uppercase transition-colors ${
                          duplicateCatalogRel
                            ? 'border-status-error text-status-error focus:border-status-error bg-status-error/5'
                            : 'border-border-default focus:border-accent-primary text-text-primary'
                        }`}
                      />
                      {duplicateCatalogRel ? (
                        <div className="p-2 rounded-lg bg-status-error/10 border border-status-error/30 text-[11px] text-status-error flex items-center justify-between gap-2 animate-in fade-in duration-200">
                          <div className="flex items-center gap-1.5 truncate">
                            <AlertCircle size={13} className="shrink-0" />
                            <span className="truncate">
                              Dipakai oleh <strong>{duplicateCatalogRel.title}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCatalogNumber(autoNextCatalog)}
                            className="px-2 py-0.5 rounded bg-status-error text-white font-semibold text-[10px] shrink-0 hover:opacity-90 cursor-pointer shadow-xs"
                          >
                            Pakai {autoNextCatalog}
                          </button>
                        </div>
                      ) : catalogNumber.trim() ? (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Check size={11} />
                          <span>Unik & valid</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Order Index */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-text-heading flex items-center gap-1">
                          <Layers size={12} className="text-accent-primary" />
                          <span>order index</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setOrderIndex(String(autoNextOrder))}
                          className="text-[10px] font-semibold text-accent-primary hover:underline flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
                          title="Generate nomor urutan berikutnya secara otomatis"
                        >
                          <Wand2 size={10} />
                          <span>Auto (#{autoNextOrder})</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(e.target.value)}
                        placeholder={String(autoNextOrder)}
                        min="1"
                        className={`w-full px-3 py-2 bg-bg-primary border rounded-xl text-xs outline-none font-mono transition-colors ${
                          duplicateOrderRel
                            ? 'border-status-error text-status-error focus:border-status-error bg-status-error/5'
                            : 'border-border-default focus:border-accent-primary text-text-primary'
                        }`}
                      />
                      {duplicateOrderRel ? (
                        <div className="p-2 rounded-lg bg-status-error/10 border border-status-error/30 text-[11px] text-status-error flex items-center justify-between gap-2 animate-in fade-in duration-200">
                          <div className="flex items-center gap-1.5 truncate">
                            <AlertCircle size={13} className="shrink-0" />
                            <span className="truncate">
                              Dipakai oleh <strong>{duplicateOrderRel.title}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOrderIndex(String(autoNextOrder))}
                            className="px-2 py-0.5 rounded bg-status-error text-white font-semibold text-[10px] shrink-0 hover:opacity-90 cursor-pointer shadow-xs"
                          >
                            Pakai #{autoNextOrder}
                          </button>
                        </div>
                      ) : orderIndex && parseInt(orderIndex, 10) > 0 ? (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Check size={11} />
                          <span>Urutan unik (posisi #{orderIndex})</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Origin Slug (Reads all slugs from articles table) */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-text-heading flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <BookOpen size={12} className="text-accent-primary" />
                          <span>origin slug (artikel The Side)</span>
                        </div>
                        {originSlug && (
                          <button
                            type="button"
                            onClick={() => setOriginSlug('')}
                            className="text-[10px] text-text-muted hover:text-accent-primary cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </label>

                      <div className="space-y-1.5">
                        {/* Dropdown Select from existing articles */}
                        {articles.length > 0 && (
                          <select
                            value={originSlug}
                            onChange={(e) => setOriginSlug(e.target.value)}
                            className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none cursor-pointer"
                          >
                            <option value="">-- Pilih dari Artikel yang Ada --</option>
                            {articles.map((art) => {
                              const artSlug = art.slug || art.id;
                              return (
                                <option key={art.id || artSlug} value={artSlug}>
                                  {art.title} ({artSlug})
                                </option>
                              );
                            })}
                          </select>
                        )}

                        {/* Manual / custom slug input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={originSlug}
                            onChange={(e) => setOriginSlug(e.target.value)}
                            placeholder="Atau ketik slug artikel manual: e.g. malam-dan-pertanyaan"
                            className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Cover Art */}
                <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-text-heading flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-accent-primary" />
                      <span>cover art</span>
                    </label>
                    <span className="text-[10px] text-text-muted font-mono">
                      {getCloudinaryCloudName() ? `Cloudinary: ${getCloudinaryCloudName()}` : 'URL / Cloudinary ID'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={coverArt}
                    onChange={(e) => setCoverArt(e.target.value)}
                    placeholder="Kosongkan untuk default cover-all.webp, atau tempel URL..."
                    className="w-full px-3.5 py-2.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
                  />
                  <p className="text-[11px] text-text-muted flex items-center justify-between">
                    <span>
                      {coverArt.trim() && coverArt.trim() !== 'cover-all'
                        ? 'Custom Cover Art'
                        : 'Default resmi SORSIDE'}
                    </span>
                    <span className="text-[10px] font-mono text-accent-primary">cover-all.webp</span>
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      const trimmed = coverArt.trim();
                      const isDefault = !trimmed || trimmed === 'cover-all';
                      const isFullUrl =
                        trimmed.startsWith('http://') ||
                        trimmed.startsWith('https://') ||
                        trimmed.startsWith('data:') ||
                        trimmed.startsWith('blob:');
                      const cloudName = getCloudinaryCloudName();
                      const resolvedUrl = resolveCoverImageUrl(trimmed);

                      if (!isDefault && !isFullUrl && !cloudName) {
                        return (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5 text-amber-400">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>Cloudinary Cloud Name Belum Dikonfigurasi</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-amber-300/90">
                              Kamu memasukkan Public ID <code className="px-1 py-0.5 bg-black/40 rounded text-amber-200">{trimmed}</code>. Agar gambar otomatis muncul dari Public ID, tambahkan <code className="px-1 py-0.5 bg-black/40 rounded text-amber-200">VITE_CLOUDINARY_CLOUD_NAME=nama_cloud</code> di file <code className="px-1 py-0.5 bg-black/40 rounded text-amber-200">.env</code>, atau langsung tempel <strong>URL lengkap</strong> gambar Cloudinary (misal: <code>https://res.cloudinary.com/nama-cloud/image/upload/...</code>).
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="relative rounded-xl overflow-hidden border border-border-default max-h-56 bg-bg-primary shadow-sm flex items-center justify-center group">
                          <img
                            src={resolvedUrl}
                            alt="Cover Preview"
                            className="w-full h-auto max-h-56 object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.cover-error-notice')) {
                                const notice = document.createElement('div');
                                notice.className = 'cover-error-notice p-4 text-center text-xs text-status-error space-y-1';
                                notice.innerHTML = `
                                  <div class="font-bold">⚠️ Gambar Tidak Ditemukan</div>
                                  <div class="text-[11px] text-text-muted break-all max-w-sm">${resolvedUrl}</div>
                                `;
                                parent.appendChild(notice);
                              }
                            }}
                          />
                          {isDefault && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white/90 border border-white/10 shadow-xs">
                              Default cover-all.webp
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 5. Platform Streaming (Only 3: Spotify, YouTube, Apple Music) */}
                <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                  <div className="font-bold text-text-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 size={14} className="text-accent-primary" />
                    <span>platform streaming</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-400">spotify</label>
                      <input
                        type="text"
                        value={spotify}
                        onChange={(e) => setSpotify(e.target.value)}
                        placeholder="https://open.spotify.com/track/..."
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-red-400">youtube</label>
                      <input
                        type="text"
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-rose-400">apple music</label>
                      <input
                        type="text"
                        value={appleMusic}
                        onChange={(e) => setAppleMusic(e.target.value)}
                        placeholder="https://music.apple.com/album/..."
                        className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Credits & Personel (JSONB Builder) */}
                <CreditsBuilder credits={creditsItems} onChange={setCreditsItems} />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: MULTI-TRACK RELEASE (EP / ALBUM) */
        /* ========================================================================= */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-bg-primary">
          {/* DESKTOP LEFT PANE / MOBILE OVERVIEW PANE: Tracklist & Album Navigation */}
          <div
            className={`w-full md:w-72 lg:w-80 bg-bg-surface border-r border-border-default flex flex-col shrink-0 overflow-hidden ${
              mobileView === 'tracklist' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Album Header Card (Desktop) */}
            <div className="hidden md:block p-3.5 border-b border-border-default bg-bg-surface/60">
              <button
                type="button"
                onClick={() => setSelectedItemId('album-info')}
                className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 border ${
                  selectedItemId === 'album-info'
                    ? 'bg-accent-primary/10 border-accent-primary text-accent-primary shadow-xs'
                    : 'bg-bg-primary border-border-default hover:border-border-hover text-text-heading'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                  <Disc size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">Metadata {type === 'EP' ? 'EP' : 'Album'}</div>
                  <div className="text-[10px] text-text-muted truncate">
                    {releaseDate || 'Tanpa Tanggal'} • {tracks.length} Track
                  </div>
                </div>
              </button>
            </div>

            {/* Tracklist List */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5">
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <span>Track {type} ({tracks.length})</span>
                <span className="text-[10px] font-mono lowercase text-accent-primary">klik untuk edit</span>
              </div>

              {tracks.length === 0 ? (
                <div className="py-12 text-center text-text-muted space-y-2">
                  <Music size={24} className="mx-auto opacity-40" />
                  <p className="text-xs">Belum ada track di {type} ini.</p>
                </div>
              ) : (
                [...tracks]
                  .sort((a, b) => (a.number || 0) - (b.number || 0))
                  .map((trk) => {
                    const isSelected = selectedItemId === trk.id;
                    const hasLyrics = Boolean(trk.lyrics?.trim());
                    const hasYoutube = Boolean(trk.youtube_url?.trim());

                    return (
                      <div
                        key={trk.id}
                        onClick={() => {
                          setSelectedItemId(trk.id);
                          setMobileView('track-editor');
                        }}
                        className={`group p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-accent-primary/10 border-accent-primary ring-1 ring-accent-primary/30 shadow-xs'
                            : 'bg-bg-primary border-border-default hover:border-border-hover'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="font-mono text-xs font-bold text-accent-primary w-6 shrink-0 text-center bg-accent-primary/10 py-0.5 rounded">
                            {String(trk.number || 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-text-heading truncate">
                              {trk.title || `Track ${trk.number || 1}`}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                              {hasLyrics && (
                                <span className="px-1 py-0.2 rounded bg-bg-surface border border-border-default text-[9px]">
                                  Lirik ✓
                                </span>
                              )}
                              {hasYoutube && (
                                <span className="px-1 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]">
                                  YouTube ✓
                                </span>
                              )}
                              {trk.origin_slug && (
                                <span className="text-[9px] font-mono text-text-muted truncate max-w-[80px]">
                                  📖 {trk.origin_slug}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Bottom Add Track Button */}
            <div className="p-3 border-t border-border-default bg-bg-surface shrink-0">
              <button
                type="button"
                onClick={handleAddNewTrack}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-bg-primary hover:bg-bg-hover text-accent-primary border border-accent-primary/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Track Baru</span>
              </button>
            </div>
          </div>

          {/* DESKTOP RIGHT PANE / MOBILE DRILL-DOWN PANE: Editor Canvas */}
          <div
            className={`flex-1 flex flex-col overflow-hidden bg-bg-primary ${
              mobileView === 'tracklist' && 'hidden md:flex'
            }`}
          >
            {/* If Mobile Album Metadata Mode or Desktop Album Info Selected */}
            {mobileView === 'album-metadata' || selectedItemId === 'album-info' ? (
              /* ALBUM INFO & METADATA CANVAS */
              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-6 pb-20">
                  {/* Status Publikasi (Published vs Draft) */}
                  <div className="bg-bg-surface border border-border-default p-4 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold text-text-heading flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={14} className="text-accent-primary" />
                        <span>Status Publikasi Website</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        published
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-text-muted/10 text-text-muted border-border-default'
                      }`}>
                        {published ? '● PUBLISHED' : '○ DRAFT'}
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPublished(true)}
                        className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          published
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                            : 'bg-bg-primary text-text-muted border-border-default hover:text-text-primary hover:border-border-hover'
                        }`}
                      >
                        <Eye size={15} />
                        <span>Published</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublished(false)}
                        className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          !published
                            ? 'bg-text-muted/15 text-text-primary border-text-muted/40 shadow-xs ring-1 ring-text-muted/20'
                            : 'bg-bg-primary text-text-muted border-border-default hover:text-text-primary hover:border-border-hover'
                        }`}
                      >
                        <EyeOff size={15} />
                        <span>Draft</span>
                      </button>
                    </div>
                  </div>

                  {/* Format Selector Card */}
                  <div className="space-y-2 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                    <div className="font-bold text-text-heading text-xs uppercase tracking-wider">
                      type release
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['SINGLE', 'EP', 'ALBUM'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => handleTypeChange(fmt)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            type === fmt
                              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary font-bold shadow-xs'
                              : 'bg-bg-primary border-border-default text-text-muted hover:text-text-primary'
                          }`}
                        >
                          <div className="text-xs font-bold">{fmt}</div>
                          <div className="text-[10px] opacity-75 mt-0.5">
                            {fmt === 'SINGLE' ? '1 Lagu' : fmt === 'EP' ? '2–6 Lagu' : '6+ Lagu'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 1. Basic Info */}
                  <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                    <div className="font-bold text-text-heading text-xs uppercase tracking-wider">
                      Informasi Utama {type}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold text-text-heading">title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder={`Judul ${type}`}
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-heading">slug id</label>
                        <input
                          type="text"
                          value={slugId}
                          onChange={(e) => setSlugId(e.target.value)}
                          placeholder="e.g. album-titik-koma"
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-heading">release date</label>
                        <input
                          type="text"
                          value={releaseDate}
                          onChange={(e) => setReleaseDate(e.target.value)}
                          placeholder="25-09-2026"
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Metadata: Tagline, Catalog Number, Origin Slug, Order Index */}
                  <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                    <div className="font-bold text-text-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-accent-primary" />
                      <span>metadata rilisan</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold text-text-heading">tagline</label>
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          placeholder="Perjalanan batin menuju titik pulang"
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                        />
                      </div>

                      {/* Catalog Number */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-text-heading flex items-center gap-1">
                            <Hash size={12} className="text-accent-primary" />
                            <span>catalog number</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setCatalogNumber(autoNextCatalog)}
                            className="text-[10px] font-semibold text-accent-primary hover:underline flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
                            title="Generate catalog number berikutnya secara otomatis"
                          >
                            <Wand2 size={10} />
                            <span>Auto ({autoNextCatalog})</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={catalogNumber}
                          onChange={(e) => setCatalogNumber(e.target.value)}
                          placeholder={autoNextCatalog}
                          className={`w-full px-3 py-2 bg-bg-primary border rounded-xl text-xs outline-none font-mono uppercase transition-colors ${
                            duplicateCatalogRel
                              ? 'border-status-error text-status-error focus:border-status-error bg-status-error/5'
                              : 'border-border-default focus:border-accent-primary text-text-primary'
                          }`}
                        />
                        {duplicateCatalogRel ? (
                          <div className="p-2 rounded-lg bg-status-error/10 border border-status-error/30 text-[11px] text-status-error flex items-center justify-between gap-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5 truncate">
                              <AlertCircle size={13} className="shrink-0" />
                              <span className="truncate">
                                Dipakai oleh <strong>{duplicateCatalogRel.title}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCatalogNumber(autoNextCatalog)}
                              className="px-2 py-0.5 rounded bg-status-error text-white font-semibold text-[10px] shrink-0 hover:opacity-90 cursor-pointer shadow-xs"
                            >
                              Pakai {autoNextCatalog}
                            </button>
                          </div>
                        ) : catalogNumber.trim() ? (
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <Check size={11} />
                            <span>Unik & valid</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Order Index */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-text-heading flex items-center gap-1">
                            <Layers size={12} className="text-accent-primary" />
                            <span>order index</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setOrderIndex(String(autoNextOrder))}
                            className="text-[10px] font-semibold text-accent-primary hover:underline flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
                            title="Generate nomor urutan berikutnya secara otomatis"
                          >
                            <Wand2 size={10} />
                            <span>Auto (#{autoNextOrder})</span>
                          </button>
                        </div>
                        <input
                          type="number"
                          value={orderIndex}
                          onChange={(e) => setOrderIndex(e.target.value)}
                          placeholder={String(autoNextOrder)}
                          min="1"
                          className={`w-full px-3 py-2 bg-bg-primary border rounded-xl text-xs outline-none font-mono transition-colors ${
                            duplicateOrderRel
                              ? 'border-status-error text-status-error focus:border-status-error bg-status-error/5'
                              : 'border-border-default focus:border-accent-primary text-text-primary'
                          }`}
                        />
                        {duplicateOrderRel ? (
                          <div className="p-2 rounded-lg bg-status-error/10 border border-status-error/30 text-[11px] text-status-error flex items-center justify-between gap-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5 truncate">
                              <AlertCircle size={13} className="shrink-0" />
                              <span className="truncate">
                                Dipakai oleh <strong>{duplicateOrderRel.title}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOrderIndex(String(autoNextOrder))}
                              className="px-2 py-0.5 rounded bg-status-error text-white font-semibold text-[10px] shrink-0 hover:opacity-90 cursor-pointer shadow-xs"
                            >
                              Pakai #{autoNextOrder}
                            </button>
                          </div>
                        ) : orderIndex && parseInt(orderIndex, 10) > 0 ? (
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <Check size={11} />
                            <span>Urutan unik (posisi #{orderIndex})</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold text-text-heading flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <BookOpen size={12} className="text-accent-primary" />
                            <span>origin slug (artikel The Side)</span>
                          </div>
                          {originSlug && (
                            <button
                              type="button"
                              onClick={() => setOriginSlug('')}
                              className="text-[10px] text-text-muted hover:text-accent-primary cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </label>

                        <div className="space-y-1.5">
                          {articles.length > 0 && (
                            <select
                              value={originSlug}
                              onChange={(e) => setOriginSlug(e.target.value)}
                              className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih dari Artikel yang Ada --</option>
                              {articles.map((art) => {
                                const artSlug = art.slug || art.id;
                                return (
                                  <option key={art.id || artSlug} value={artSlug}>
                                    {art.title} ({artSlug})
                                  </option>
                                );
                              })}
                            </select>
                          )}

                          <input
                            type="text"
                            value={originSlug}
                            onChange={(e) => setOriginSlug(e.target.value)}
                            placeholder="Atau ketik slug artikel manual: e.g. malam-dan-pertanyaan"
                            className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Cover Art */}
                  <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-text-heading flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-accent-primary" />
                        <span>cover art</span>
                      </label>
                      <span className="text-[10px] text-text-muted font-mono">
                        {getCloudinaryCloudName() ? `Cloudinary: ${getCloudinaryCloudName()}` : 'URL / Cloudinary ID'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={coverArt}
                      onChange={(e) => setCoverArt(e.target.value)}
                      placeholder="Kosongkan untuk default cover-all.webp, atau tempel URL..."
                      className="w-full px-3.5 py-2.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
                    />
                    <p className="text-[11px] text-text-muted flex items-center justify-between">
                      <span>
                        {coverArt.trim() && coverArt.trim() !== 'cover-all'
                          ? 'Custom Cover Art'
                          : 'Default resmi SORSIDE'}
                      </span>
                      <span className="text-[10px] font-mono text-accent-primary">cover-all.webp</span>
                    </p>
                    <div className="space-y-2">
                      {(() => {
                        const trimmed = coverArt.trim();
                        const isDefault = !trimmed || trimmed === 'cover-all';
                        const isFullUrl =
                          trimmed.startsWith('http://') ||
                          trimmed.startsWith('https://') ||
                          trimmed.startsWith('data:') ||
                          trimmed.startsWith('blob:');
                        const cloudName = getCloudinaryCloudName();
                        const resolvedUrl = resolveCoverImageUrl(trimmed);

                        if (!isDefault && !isFullUrl && !cloudName) {
                          return (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1.5">
                              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>Cloudinary Cloud Name Belum Dikonfigurasi</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-amber-300/90">
                                Kamu memasukkan Public ID <code className="px-1 py-0.5 bg-black/40 rounded text-amber-200">{trimmed}</code>. Agar gambar otomatis muncul dari Public ID, tambahkan <code className="px-1 py-0.5 bg-black/40 rounded text-amber-200">VITE_CLOUDINARY_CLOUD_NAME=nama_cloud</code> di file <code className="px-1 py-0.5 bg-black/40 rounded text-amber-200">.env</code>, atau langsung tempel <strong>URL lengkap</strong> gambar Cloudinary (misal: <code>https://res.cloudinary.com/nama-cloud/image/upload/...</code>).
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="relative rounded-xl overflow-hidden border border-border-default max-h-56 bg-bg-primary shadow-sm flex items-center justify-center group">
                            <img
                              src={resolvedUrl}
                              alt="Cover Preview"
                              className="w-full h-auto max-h-56 object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.cover-error-notice')) {
                                  const notice = document.createElement('div');
                                  notice.className = 'cover-error-notice p-4 text-center text-xs text-status-error space-y-1';
                                  notice.innerHTML = `
                                    <div class="font-bold">⚠️ Gambar Tidak Ditemukan</div>
                                    <div class="text-[11px] text-text-muted break-all max-w-sm">${resolvedUrl}</div>
                                  `;
                                  parent.appendChild(notice);
                                }
                              }}
                            />
                            {isDefault && (
                              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white/90 border border-white/10 shadow-xs">
                                Default cover-all.webp
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 4. Platform Streaming */}
                  <div className="space-y-3 bg-bg-surface border border-border-default p-4 sm:p-5 rounded-2xl">
                    <div className="font-bold text-text-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 size={14} className="text-accent-primary" />
                      <span>platform streaming</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-400">spotify</label>
                        <input
                          type="text"
                          value={spotify}
                          onChange={(e) => setSpotify(e.target.value)}
                          placeholder="https://open.spotify.com/album/..."
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-red-400">youtube</label>
                        <input
                          type="text"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          placeholder="https://youtube.com/playlist?list=..."
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-rose-400">apple music</label>
                        <input
                          type="text"
                          value={appleMusic}
                          onChange={(e) => setAppleMusic(e.target.value)}
                          placeholder="https://music.apple.com/album/..."
                          className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Credits & Personel (JSONB Builder) */}
                  <CreditsBuilder credits={creditsItems} onChange={setCreditsItems} />
                </div>
              </div>
            ) : selectedTrack ? (
              /* ACTIVE TRACK DEDICATED CANVAS */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Track Bar Header (Title & Number Only) */}
                <div className="px-3 sm:px-6 py-2.5 bg-bg-surface border-b border-border-default flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setMobileView('tracklist')}
                      className="md:hidden p-1 rounded-lg bg-bg-primary border border-border-default text-text-muted hover:text-accent-primary transition-colors cursor-pointer shrink-0"
                      title="Kembali ke Daftar Track"
                    >
                      <ArrowLeft size={13} />
                    </button>

                    <div className="flex items-center bg-accent-primary/10 border border-accent-primary/30 rounded-lg px-1.5 py-0.5 text-accent-primary font-mono text-[11px] font-bold shrink-0">
                      <span className="opacity-70 text-[10px] mr-0.5">#</span>
                      <input
                        type="number"
                        min="1"
                        value={selectedTrack.number ?? 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          handleUpdateCurrentTrack('number', isNaN(val) ? 1 : val);
                        }}
                        className="w-6 bg-transparent text-center font-mono font-bold text-accent-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Klik untuk ubah nomor urut track"
                      />
                    </div>

                    <input
                      type="text"
                      value={selectedTrack.title}
                      onChange={(e) => handleUpdateCurrentTrack('title', e.target.value)}
                      placeholder="Judul Track..."
                      className="text-xs sm:text-sm font-bold text-text-heading bg-transparent border-none outline-none flex-1 min-w-[100px] focus:ring-1 focus:ring-accent-primary/40 rounded px-1"
                    />
                  </div>
                </div>

                {/* Sub-toolbar: lyrics & metadata tabs + Delete & Save buttons in ONE compact line */}
                <div className="px-3 sm:px-6 py-1.5 bg-bg-surface/50 border-b border-border-default flex items-center justify-between gap-1.5 shrink-0">
                  {/* Left: Tab Switcher (lyrics vs metadata) */}
                  <div className="flex items-center bg-bg-primary p-0.5 rounded-lg border border-border-default shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrackTab('lyrics')}
                      className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        trackTab === 'lyrics'
                          ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <FileText size={12} />
                      <span>lyrics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackTab('metadata')}
                      className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        trackTab === 'metadata'
                          ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <SlidersHorizontal size={12} />
                      <span>metadata</span>
                    </button>
                  </div>

                  {/* Right: Actions (Autosave hint & Delete Track) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-text-muted hidden sm:inline">
                      Draf otomatis • Simpan rilis via header
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteCurrentTrack(selectedTrack.id, selectedTrack.title)}
                      className="px-2 py-1 text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Hapus Track Ini"
                    >
                      <Trash2 size={13} />
                      <span className="text-[11px] hidden sm:inline">Hapus Track</span>
                    </button>
                  </div>
                </div>

                {/* Track Content Body */}
                {trackTab === 'lyrics' ? (
                  /* Track Lyrics Canvas */
                  <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="max-w-3xl mx-auto h-full flex flex-col space-y-3">
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span className="font-semibold text-text-heading">
                          Lirik Track #{selectedTrack.number} — {selectedTrack.title}
                        </span>
                        <span className="font-mono text-[11px] bg-bg-surface px-2 py-0.5 rounded border border-border-default">
                          {(selectedTrack.lyrics || '').split('\n').filter(Boolean).length} baris
                        </span>
                      </div>
                      <textarea
                        value={selectedTrack.lyrics || ''}
                        onChange={(e) => handleUpdateCurrentTrack('lyrics', e.target.value)}
                        placeholder={`[Verse 1]\nTulis bait pertama lirik di sini...\n\n[Chorus]\nTulis bagian reff / chorus di sini...`}
                        className="w-full flex-1 min-h-[380px] p-4 sm:p-6 bg-bg-surface border border-border-default focus:border-accent-primary rounded-2xl text-xs sm:text-sm text-text-primary outline-none font-mono leading-relaxed resize-none shadow-xs"
                      />
                    </div>
                  </div>
                ) : (
                  /* Track Metadata Canvas: YouTube URL & Origin Slug */
                  <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="max-w-3xl mx-auto space-y-6 pb-20">
                      <div className="space-y-4 bg-bg-surface border border-border-default p-4 sm:p-6 rounded-2xl">
                        <div className="font-bold text-text-heading text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <SlidersHorizontal size={14} className="text-accent-primary" />
                          <span>Metadata Track #{selectedTrack.number}</span>
                        </div>

                        {/* 1. URL YouTube */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                            <Video size={13} />
                            <span>url youtube</span>
                          </label>
                          <input
                            type="text"
                            value={selectedTrack.youtube_url || ''}
                            onChange={(e) => handleUpdateCurrentTrack('youtube_url', e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-3.5 py-2.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                          />
                        </div>

                        {/* 2. Origin Slug (Dropdown + Manual) */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-text-heading flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <BookOpen size={12} className="text-accent-primary" />
                              <span>origin slug (artikel The Side)</span>
                            </div>
                            {selectedTrack.origin_slug && (
                              <button
                                type="button"
                                onClick={() => handleUpdateCurrentTrack('origin_slug', '')}
                                className="text-[10px] text-text-muted hover:text-accent-primary cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </label>

                          <div className="space-y-2">
                            {articles.length > 0 && (
                              <select
                                value={selectedTrack.origin_slug || ''}
                                onChange={(e) => handleUpdateCurrentTrack('origin_slug', e.target.value)}
                                className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none cursor-pointer"
                              >
                                <option value="">-- Pilih dari Artikel yang Ada --</option>
                                {articles.map((art) => {
                                  const artSlug = art.slug || art.id;
                                  return (
                                    <option key={art.id || artSlug} value={artSlug}>
                                      {art.title} ({artSlug})
                                    </option>
                                  );
                                })}
                              </select>
                            )}

                            <input
                              type="text"
                              value={selectedTrack.origin_slug || ''}
                              onChange={(e) => handleUpdateCurrentTrack('origin_slug', e.target.value)}
                              placeholder="Atau ketik slug artikel manual: e.g. malam-dan-pertanyaan"
                              className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-bg-surface border border-border-default rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-text-heading">Simpan Perubahan Rilisan?</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Anda memiliki perubahan pada rilisan ini yang belum disimpan. Draf Anda telah tersimpan sementara secara lokal di browser.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-default/60">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-status-error-bg text-status-error border border-status-error/30 hover:bg-status-error/20 transition-colors cursor-pointer"
              >
                Keluar Tanpa Menyimpan
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsExitModalOpen(false);
                  await handleSubmitRelease();
                  onBack();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Simpan & Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Track Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(trackToDelete)}
        title="Hapus Track Lagu"
        itemTitle={trackToDelete?.title || ''}
        itemType="Track Lagu"
        onClose={() => setTrackToDelete(null)}
        onConfirm={handleConfirmDeleteTrack}
      />
    </div>
  );
};
