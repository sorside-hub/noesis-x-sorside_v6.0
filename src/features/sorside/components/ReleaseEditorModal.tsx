import React, { useState, useEffect } from 'react';
import { SorsideRelease, SorsideReleaseType, SorsideTrack } from '../../../types/sorside';
import { generateSlug, DEFAULT_SORSIDE_COVER_URL } from '../../../lib/sorsideService';
import {
  X,
  Save,
  Disc,
  Music,
  FileText,
  Share2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  Headphones,
  Check
} from 'lucide-react';

interface ReleaseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: SorsideRelease | null;
  onSave: (releaseData: Partial<SorsideRelease> & { id: string; title: string; type: SorsideReleaseType }) => Promise<any>;
  onOpenTrackEditor?: (releaseId: string, nextNumber: number, track?: SorsideTrack) => void;
  onDeleteTrack?: (trackId: string, trackTitle: string, releaseId: string) => void;
}

export const ReleaseEditorModal: React.FC<ReleaseEditorModalProps> = ({
  isOpen,
  onClose,
  release,
  onSave,
  onOpenTrackEditor,
  onDeleteTrack
}) => {
  const isEditing = Boolean(release);

  const [activeTab, setActiveTab] = useState<'info' | 'lyrics' | 'tracks' | 'credits'>('info');

  // Basic Info
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [type, setType] = useState<SorsideReleaseType>('SINGLE');
  const [year, setYear] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [duration, setDuration] = useState('');
  const [songCount, setSongCount] = useState('1 SONG');
  const [cover, setCover] = useState(DEFAULT_SORSIDE_COVER_URL);
  const [audioUrl, setAudioUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [conceptStory, setConceptStory] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [published, setPublished] = useState<boolean>(false);

  // Credits
  const [writer, setWriter] = useState('sor');
  const [producer, setProducer] = useState('sorside');
  const [mixing, setMixing] = useState('sorside');
  const [mastering, setMastering] = useState('sorside');
  const [label, setLabel] = useState('Independent');

  // Stream Links
  const [spotify, setSpotify] = useState('');
  const [appleMusic, setAppleMusic] = useState('');
  const [youtube, setYoutube] = useState('');
  const [soundcloud, setSoundcloud] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (release && isOpen) {
      setTitle(release.title || '');
      setId(release.id || '');
      setType(release.type || 'SINGLE');
      setYear(release.year || new Date().getFullYear().toString());
      setReleaseDate(release.release_date || '');
      setDuration(release.duration || '');
      setSongCount(release.song_count || (release.type === 'SINGLE' ? '1 SONG' : ''));
      setCover(
        release.cover && release.cover !== 'cover-all'
          ? release.cover
          : release.cover_url && release.cover_url !== 'cover-all'
          ? release.cover_url
          : DEFAULT_SORSIDE_COVER_URL
      );
      setAudioUrl(release.audio_url || '');
      setTagline(release.tagline || '');
      setConceptStory(release.concept_story || '');
      setLyrics(release.lyrics || '');
      setPublished(release.published !== undefined ? Boolean(release.published) : false);

      const cr = (typeof release.credits === 'object' && release.credits !== null ? release.credits : {}) as Record<string, string>;
      setWriter(cr.writer || 'sor');
      setProducer(cr.producer || 'sorside');
      setMixing(cr.mixing || 'sorside');
      setMastering(cr.mastering || 'sorside');
      setLabel(cr.label || 'Independent');

      const sl = release.stream_links || {};
      setSpotify(sl.spotify || '');
      setAppleMusic(sl.appleMusic || '');
      setYoutube(sl.youtube || '');
      setSoundcloud(sl.soundcloud || '');
    } else if (isOpen) {
      setTitle('');
      setId('');
      setType('SINGLE');
      setYear(new Date().getFullYear().toString());
      setReleaseDate('');
      setDuration('');
      setSongCount('1 SONG');
      setCover(DEFAULT_SORSIDE_COVER_URL);
      setAudioUrl('');
      setTagline('');
      setConceptStory('');
      setLyrics('');

      setWriter('sor');
      setProducer('sorside');
      setMixing('sorside');
      setMastering('sorside');
      setLabel('Independent');

      setSpotify('');
      setAppleMusic('');
      setYoutube('');
      setSoundcloud('');
    }
    setError(null);
    setActiveTab('info');
  }, [release, isOpen]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setId(generateSlug(val));
    }
  };

  const handleTypeChange = (newType: SorsideReleaseType) => {
    setType(newType);
    if (newType === 'SINGLE') {
      setSongCount('1 SONG');
    } else if (songCount === '1 SONG') {
      setSongCount('6 SONGS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul rilisan wajib diisi.');
      return;
    }
    if (!id.trim()) {
      setError('Slug ID wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const creditsPayload: Record<string, string> = {
      writer: writer.trim(),
      producer: producer.trim(),
      mixing: mixing.trim(),
      mastering: mastering.trim(),
      label: label.trim()
    };

    const streamLinksPayload: Record<string, string> = {
      spotify: spotify.trim(),
      appleMusic: appleMusic.trim(),
      youtube: youtube.trim(),
      soundcloud: soundcloud.trim()
    };

    try {
      const cleanSlug = generateSlug(id);
      await onSave({
        id: release?.id || cleanSlug,
        slug: cleanSlug,
        title: title.trim(),
        type,
        year: year.trim() || new Date().getFullYear().toString(),
        release_date: releaseDate.trim() || null,
        duration: duration.trim() || null,
        song_count: songCount.trim() || (type === 'SINGLE' ? '1 SONG' : ''),
        cover_url: cover.trim() && cover.trim() !== 'cover-all' ? cover.trim() : DEFAULT_SORSIDE_COVER_URL,
        cover: cover.trim() && cover.trim() !== 'cover-all' ? cover.trim() : DEFAULT_SORSIDE_COVER_URL,
        cover_art: cover.trim() && cover.trim() !== 'cover-all' ? cover.trim() : DEFAULT_SORSIDE_COVER_URL,
        audio_url: audioUrl.trim() || null,
        tagline: tagline.trim() || null,
        concept_story: conceptStory.trim() || null,
        lyrics: lyrics.trim() || null,
        spotify_url: spotify.trim() || null,
        apple_music_url: appleMusic.trim() || null,
        youtube_url: youtube.trim() || null,
        credits: creditsPayload,
        published: published,
        stream_links: streamLinksPayload
      });
      onClose();
    } catch (err: any) {
      console.error('Error in release submit:', err);
      setError(err.message || 'Gagal menyimpan rilisan ke Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const tracks = release?.tracks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-surface/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
              <Disc size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-heading">
                {isEditing ? `Edit Rilisan: ${release?.title}` : 'Buat Rilisan Musik Baru'}
              </h2>
              <p className="text-xs text-text-muted">
                Tersambung langsung ke tabel <code className="text-accent-primary font-mono text-[11px]">public.releases</code> di Supabase.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-border-default bg-bg-primary/50 flex items-center gap-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Disc size={13} />
            <span>Informasi Utama</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lyrics')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'lyrics'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText size={13} />
            <span>Lirik Rilisan / Catatan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracks')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'tracks'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Music size={13} />
            <span>Daftar Trek Lagu</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bg-surface border border-border-default text-text-muted">
              {tracks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credits')}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'credits'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Share2 size={13} />
            <span>Kredit & Link Streaming</span>
          </button>
        </div>

        {error && (
          <div className="px-6 py-2.5 bg-status-error-bg text-status-error text-xs font-medium border-b border-status-error/30 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">
                    Judul Rilisan (Single/EP/Album) <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: TITIK KOMA."
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-sm font-semibold text-text-primary outline-none"
                  />
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">
                    Slug ID <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="titik-koma"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
                  />
                </div>
              </div>

              {/* Release Type selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-heading">Format Rilisan</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['SINGLE', 'EP', 'ALBUM'] as SorsideReleaseType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        type === t
                          ? 'bg-accent-primary/10 border-accent-primary ring-1 ring-accent-primary text-accent-primary'
                          : 'bg-bg-primary border-border-default text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year, Date, Duration, Song Count */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">Tahun</label>
                  <input
                    type="text"
                    placeholder="2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">Tanggal Rilis</label>
                  <input
                    type="text"
                    placeholder="15 November 2024"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">Total Durasi</label>
                  <input
                    type="text"
                    placeholder="3:42 atau 22:15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">Jumlah Lagu</label>
                  <input
                    type="text"
                    placeholder="1 SONG / 6 SONGS"
                    value={songCount}
                    onChange={(e) => setSongCount(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                </div>
              </div>

              {/* Cover & Audio URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">
                    Cover ID / Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan untuk default cover-all.webp, atau https://..."
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
                  />
                  <p className="text-[10px] text-text-muted">Gunakan nama file aset SORSIDE atau URL gambar.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-heading">
                    Audio Stream URL (File MP3/WAV/Streaming)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... / audio preview url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                  <p className="text-[10px] text-text-muted">Khusus single atau preview audio player.</p>
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-heading">Tagline</label>
                <input
                  type="text"
                  placeholder="sebuah jeda sebelum kalimat baru..."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none italic"
                />
              </div>

              {/* Concept Story */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-text-heading">
                  Cerita Konsep / Latar Belakang (Concept Story)
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan latar belakang, filosofi, dan narasi dari album atau single ini..."
                  value={conceptStory}
                  onChange={(e) => setConceptStory(e.target.value)}
                  className="w-full p-3 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none leading-relaxed resize-y"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LYRICS */}
          {activeTab === 'lyrics' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-text-heading">Lirik Rilisan</h4>
                  <p className="text-[11px] text-text-muted">
                    Untuk rilisan single, lirik ini akan langsung tampil di halaman detail single pada website.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-text-muted">
                  {lyrics.split('\n').length} baris
                </span>
              </div>
              <textarea
                rows={16}
                placeholder={`[Verse 1]\nDi sudut kamar yang redup...\nSecangkir kopi yang telah dingin...\n\n[Chorus]\nKita hanya butuh titik koma, bukan titik akhir...`}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full p-4 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none resize-y leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: TRACKS */}
          {activeTab === 'tracks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-text-heading">Daftar Trek Lagu</h4>
                  <p className="text-[11px] text-text-muted">
                    Kelola lagu-lagu di dalam EP atau Album ini.
                  </p>
                </div>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => onOpenTrackEditor?.(id, tracks.length + 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Tambah Trek</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-accent-primary italic">
                    Simpan rilisan terlebih dahulu untuk menambah trek.
                  </span>
                )}
              </div>

              {tracks.length === 0 ? (
                <div className="py-12 border border-dashed border-border-default rounded-xl text-center space-y-2">
                  <Music size={24} className="mx-auto text-text-muted" />
                  <p className="text-xs text-text-muted">Belum ada trek untuk rilisan ini.</p>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => onOpenTrackEditor?.(id, 1)}
                      className="px-3 py-1 text-xs font-medium text-accent-primary hover:underline cursor-pointer"
                    >
                      + Tambah Trek Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((tr) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between p-3 bg-bg-primary border border-border-default rounded-xl hover:border-border-hover transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-6 text-center font-mono font-bold text-xs text-accent-primary">
                          {tr.number}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-text-heading truncate">
                            {tr.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
                            {tr.duration && <span>{tr.duration}</span>}
                            {tr.lyrics && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400">Ada Lirik</span>
                              </>
                            )}
                            {tr.story && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-400">Ada Story</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenTrackEditor?.(id, tr.number, tr)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer"
                          title="Edit Lirik & Info Trek"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTrack?.(tr.id, tr.title, id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error-bg transition-colors cursor-pointer"
                          title="Hapus Trek"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CREDITS & STREAM LINKS */}
          {activeTab === 'credits' && (
            <div className="space-y-6">
              {/* Credits */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-heading uppercase tracking-wider text-accent-primary">
                  Kredit Produksi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">Writer</label>
                    <input
                      type="text"
                      value={writer}
                      onChange={(e) => setWriter(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">Producer</label>
                    <input
                      type="text"
                      value={producer}
                      onChange={(e) => setProducer(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">Mixing</label>
                    <input
                      type="text"
                      value={mixing}
                      onChange={(e) => setMixing(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">Mastering</label>
                    <input
                      type="text"
                      value={mastering}
                      onChange={(e) => setMastering(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-heading">Record Label</label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Streaming Links */}
              <div className="space-y-3 pt-4 border-t border-border-default">
                <h4 className="text-xs font-bold text-text-heading uppercase tracking-wider text-accent-primary">
                  Tautan Platform Streaming
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">Spotify URL</label>
                    <input
                      type="text"
                      placeholder="https://open.spotify.com/..."
                      value={spotify}
                      onChange={(e) => setSpotify(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">Apple Music URL</label>
                    <input
                      type="text"
                      placeholder="https://music.apple.com/..."
                      value={appleMusic}
                      onChange={(e) => setAppleMusic(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">YouTube / YT Music URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/..."
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-heading">SoundCloud URL</label>
                    <input
                      type="text"
                      placeholder="https://soundcloud.com/..."
                      value={soundcloud}
                      onChange={(e) => setSoundcloud(e.target.value)}
                      className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-5 border-t border-border-default flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-accent-contrast shadow-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isEditing ? 'Perbarui Rilisan' : 'Simpan Rilisan Musik'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
