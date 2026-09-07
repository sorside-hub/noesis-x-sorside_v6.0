import { useState, useEffect, useCallback, useMemo } from 'react';
import { SorsideRelease, SorsideReleaseType, SorsideTrack } from '../../../types/sorside';
import {
  fetchSorsideReleases,
  upsertSorsideRelease,
  deleteSorsideRelease,
  upsertSorsideTrack,
  deleteSorsideTrack,
  autoResequenceAllReleases
} from '../../../lib/sorsideService';

export function useSorsideReleases() {
  const [releases, setReleases] = useState<SorsideRelease[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | SorsideReleaseType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Active Edit States
  const [isReleaseEditorOpen, setIsReleaseEditorOpen] = useState<boolean>(false);
  const [editingRelease, setEditingRelease] = useState<SorsideRelease | null>(null);

  const [isTrackEditorOpen, setIsTrackEditorOpen] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<{
    track: SorsideTrack | null;
    releaseId: string;
    nextNumber: number;
  } | null>(null);

  // Audio preview playback state
  const [activeAudioPreview, setActiveAudioPreview] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadReleases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSorsideReleases();
      setReleases(data);
    } catch (err: any) {
      console.error('Failed to load Sorside releases:', err);
      setError(err.message || 'Gagal memuat rilisan musik dari Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  const handleSaveRelease = async (releaseData: Partial<SorsideRelease> & { id: string; title: string; type: SorsideReleaseType }) => {
    try {
      const saved = await upsertSorsideRelease(releaseData);
      setReleases((prev) => {
        const idx = prev.findIndex((r) => r.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...saved, tracks: saved.tracks || prev[idx].tracks || [] };
          return next;
        }
        return [{ ...saved, tracks: saved.tracks || [] }, ...prev];
      });
      setIsReleaseEditorOpen(false);
      setEditingRelease(null);
      showNotification(`Rilisan "${saved.title}" berhasil disimpan!`);
      return saved;
    } catch (err: any) {
      console.error('Save release failed:', err);
      throw err;
    }
  };

  const handleDeleteRelease = async (id: string, title: string) => {
    try {
      await deleteSorsideRelease(id);
      setReleases((prev) => prev.filter((r) => r.id !== id));
      showNotification(`Rilisan "${title}" berhasil dihapus.`);
    } catch (err: any) {
      console.error('Delete release failed:', err);
      showNotification(`Gagal menghapus rilisan: ${err.message || 'Error Supabase'}`);
    }
  };

  const handleSaveTrack = async (trackData: Partial<SorsideTrack> & { id: string; release_id: string; number: number; title: string }) => {
    try {
      const saved = await upsertSorsideTrack(trackData);
      setReleases((prev) =>
        prev.map((r) => {
          if (r.id !== saved.release_id) return r;
          const currentTracks = r.tracks || [];
          const tIdx = currentTracks.findIndex((t) => t.id === saved.id);
          let newTracks: SorsideTrack[];
          if (tIdx >= 0) {
            newTracks = [...currentTracks];
            newTracks[tIdx] = saved;
          } else {
            newTracks = [...currentTracks, saved];
          }
          newTracks.sort((a, b) => a.number - b.number);
          return {
            ...r,
            song_count: `${newTracks.length} SONGS`,
            tracks: newTracks
          };
        })
      );
      setIsTrackEditorOpen(false);
      setEditingTrack(null);
      showNotification(`Trek "${saved.title}" berhasil disimpan!`);
      return saved;
    } catch (err: any) {
      console.error('Save track failed:', err);
      showNotification(`Gagal menyimpan trek: ${err.message || 'Error Supabase'}`);
      throw err;
    }
  };

  const handleDeleteTrack = async (trackId: string, trackTitle: string, releaseId: string) => {
    try {
      await deleteSorsideTrack(trackId);
      setReleases((prev) =>
        prev.map((r) => {
          if (r.id !== releaseId) return r;
          const updatedTracks = (r.tracks || []).filter((t) => t.id !== trackId);
          return {
            ...r,
            song_count: `${updatedTracks.length} SONGS`,
            tracks: updatedTracks
          };
        })
      );
      showNotification(`Trek "${trackTitle}" telah dihapus.`);
    } catch (err: any) {
      console.error('Delete track failed:', err);
      showNotification(`Gagal menghapus trek: ${err.message || 'Error Supabase'}`);
    }
  };

  const [isResequencing, setIsResequencing] = useState<boolean>(false);

  const handleResequenceAll = async () => {
    if (releases.length === 0) return;
    setIsResequencing(true);
    try {
      const updated = await autoResequenceAllReleases(releases);
      setReleases(updated);
      showNotification('Semua rilisan berhasil diurutkan otomatis! Catalog Number & Order Index kini unik.');
      return updated;
    } catch (err: any) {
      console.error('Failed to resequence releases:', err);
      showNotification(`Gagal mengurutkan rilisan: ${err.message || 'Error Supabase'}`);
      throw err;
    } finally {
      setIsResequencing(false);
    }
  };

  const openNewReleaseModal = () => {
    setEditingRelease(null);
    setIsReleaseEditorOpen(true);
  };

  const openEditReleaseModal = (release: SorsideRelease) => {
    setEditingRelease(release);
    setIsReleaseEditorOpen(true);
  };

  const openNewTrackModal = (releaseId: string, nextNumber: number) => {
    setEditingTrack({
      track: null,
      releaseId,
      nextNumber
    });
    setIsTrackEditorOpen(true);
  };

  const openEditTrackModal = (track: SorsideTrack) => {
    setEditingTrack({
      track,
      releaseId: track.release_id,
      nextNumber: track.number
    });
    setIsTrackEditorOpen(true);
  };

  // Filtered releases
  const filteredReleases = useMemo(() => {
    return releases.filter((rel) => {
      if (typeFilter !== 'ALL' && rel.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rel.title.toLowerCase().includes(q);
        const matchesTagline = (rel.tagline || '').toLowerCase().includes(q);
        const matchesStory = (rel.concept_story || '').toLowerCase().includes(q);
        const matchesTracks = (rel.tracks || []).some((t) =>
          t.title.toLowerCase().includes(q)
        );
        return matchesTitle || matchesTagline || matchesStory || matchesTracks;
      }
      return true;
    });
  }, [releases, typeFilter, searchQuery]);

  return {
    releases: filteredReleases,
    allReleases: releases,
    allReleasesCount: releases.length,
    isLoading,
    isResequencing,
    error,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
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
    notification,
    refresh: loadReleases,
    handleSaveRelease,
    handleDeleteRelease,
    handleSaveTrack,
    handleDeleteTrack,
    handleResequenceAll
  };
}
