import React, { useState, useEffect } from 'react';
import { SorsideTrack, SorsideArticle } from '../../../types/sorside';
import { X, Save, Music, FileText, Loader2, SlidersHorizontal, Video, BookOpen } from 'lucide-react';
import { ArticleSlugPickerModal } from './ArticleSlugPickerModal';

interface TrackEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles?: SorsideArticle[];
  trackData: {
    track: SorsideTrack | null;
    releaseId: string;
    nextNumber: number;
  } | null;
  onSave: (trackData: Partial<SorsideTrack> & { id: string; release_id: string; number: number; title: string }) => Promise<any>;
}

export const TrackEditorModal: React.FC<TrackEditorModalProps> = ({
  isOpen,
  onClose,
  articles = [],
  trackData,
  onSave
}) => {
  const isEditing = Boolean(trackData?.track);

  const [tab, setTab] = useState<'lyrics' | 'metadata'>('lyrics');
  const [number, setNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [originSlug, setOriginSlug] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackData && isOpen) {
      setTab('lyrics');
      if (trackData.track) {
        setNumber(trackData.track.number);
        setTitle(trackData.track.title || '');
        setId(trackData.track.id || '');
        setYoutubeUrl(trackData.track.youtube_url || '');
        setOriginSlug(trackData.track.origin_slug || '');
        setLyrics(trackData.track.lyrics || '');
      } else {
        const defaultNum = trackData.nextNumber || 1;
        setNumber(defaultNum);
        setTitle('');
        const shortRel = trackData.releaseId.slice(0, 4).replace(/[^a-zA-Z0-9]/g, '');
        setId(`${shortRel}-${defaultNum}`);
        setYoutubeUrl('');
        setOriginSlug('');
        setLyrics('');
      }
      setError(null);
    }
  }, [trackData, isOpen]);

  if (!isOpen || !trackData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul track wajib diisi.');
      return;
    }
    if (!id.trim()) {
      setError('Track ID wajib diisi (misal cm-1).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        id: id.trim(),
        release_id: trackData.releaseId,
        number: Number(number) || 1,
        title: title.trim(),
        youtube_url: youtubeUrl.trim() || null,
        origin_slug: originSlug.trim() || null,
        lyrics: lyrics.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan track.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-surface/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center border border-accent-primary/20">
              <Music size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">
                {isEditing ? 'Edit Track' : 'Tambah Track Baru'}
              </h3>
              <p className="text-[11px] text-text-muted">
                Rilisan ID: <code className="text-accent-primary font-mono">{trackData.releaseId}</code>
              </p>
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

        {/* Tab switcher: lyrics vs metadata */}
        <div className="px-6 py-2 border-b border-border-default bg-bg-primary/50 flex items-center gap-2">
          <div className="flex items-center bg-bg-primary p-0.5 rounded-xl border border-border-default">
            <button
              type="button"
              onClick={() => setTab('lyrics')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'lyrics'
                  ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileText size={13} />
              <span>lyrics</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('metadata')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'metadata'
                  ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>metadata</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-2 bg-status-error-bg text-status-error text-xs font-medium border-b border-status-error/30">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3 sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-text-heading">No.</label>
              <input
                type="number"
                min="1"
                required
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-center font-bold text-text-primary outline-none"
              />
            </div>

            <div className="col-span-9 sm:col-span-10 space-y-1">
              <label className="block text-xs font-semibold text-text-heading">
                Judul Track <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Suara Hujan di Atap"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-heading">
              Track ID <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="cm-1"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
            />
          </div>

          {tab === 'lyrics' ? (
            /* Lyrics */
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-text-heading flex items-center gap-1.5">
                  <FileText size={13} className="text-accent-primary" />
                  <span>lyrics</span>
                </label>
                <span className="text-[10px] text-text-muted">Gunakan [Verse], [Chorus]</span>
              </div>
              <textarea
                rows={9}
                placeholder={`[Verse 1]\nLangkah terasa berat di jalan yang sama...\n\n[Chorus]\nBukan akhir, ini cuma titik koma...`}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full p-3 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none resize-y leading-relaxed"
              />
            </div>
          ) : (
            /* Metadata: YouTube URL & Origin Slug */
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <Video size={13} />
                  <span>url youtube</span>
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-heading flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-accent-primary" />
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

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default hover:border-accent-primary rounded-xl text-xs text-text-primary flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <BookOpen size={13} className="text-accent-primary shrink-0" />
                      <span className="font-mono text-xs font-semibold truncate">
                        {originSlug ? `📖 ${originSlug}` : '-- Pilih Artikel Origin --'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shrink-0 group-hover:bg-accent-primary group-hover:text-accent-contrast transition-colors">
                      {originSlug ? 'Ubah Artikel...' : 'Cari Artikel...'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-border-default flex items-center justify-end gap-2.5">
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
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Simpan Track</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ArticleSlugPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        articles={articles}
        currentSlug={originSlug}
        onSelectSlug={(slug) => setOriginSlug(slug)}
      />
    </div>
  );
};
