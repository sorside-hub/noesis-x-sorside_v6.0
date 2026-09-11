import React, { useState, useEffect } from 'react';
import { SorsideArticle, SorsideSide, SORSIDE_SIDE_CONFIG } from '../../../types/sorside';
import {
  generateSlug,
  formatSorsideDate,
  calculateReadTime
} from '../../../lib/sorsideService';
import { X, Save, Eye, Edit2, Sparkles, Tag, HelpCircle, Loader2 } from 'lucide-react';

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: SorsideArticle | null;
  onSave: (
    articleData: Partial<SorsideArticle> & {
      id: string;
      title: string;
      side: SorsideSide;
      full_text: string;
    }
  ) => Promise<any>;
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  article,
  onSave
}) => {
  const isEditing = Boolean(article);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [side, setSide] = useState<SorsideSide>('INNER');
  const [date, setDate] = useState('');
  const [readTime, setReadTime] = useState('2 MIN BACA');
  const [snippet, setSnippet] = useState('');
  const [fullText, setFullText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [cover, setCover] = useState('');
  const [published, setPublished] = useState(true);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form state when article changes or opens
  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSlug(article.id || '');
      setSide(article.side || 'INNER');
      setDate(article.date || formatSorsideDate());
      setReadTime(article.read_time || '2 MIN BACA');
      setSnippet(article.snippet || '');
      setFullText(article.full_text || '');
      setTagsInput(article.tags ? article.tags.join(', ') : '');
      setCover(article.cover || '');
      setPublished(article.published !== undefined ? article.published : true);
    } else {
      setTitle('');
      setSlug('');
      setSide('INNER');
      setDate(formatSorsideDate());
      setReadTime('2 MIN BACA');
      setSnippet('');
      setFullText('');
      setTagsInput('');
      setCover('');
      setPublished(true);
    }
    setError(null);
    setActiveTab('editor');
  }, [article, isOpen]);

  // Auto-generate slug when creating a new article and title changes
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(generateSlug(val));
    }
  };

  // Recalculate read time when fullText changes
  const handleFullTextChange = (val: string) => {
    setFullText(val);
    setReadTime(calculateReadTime(val));
    if (!snippet && val) {
      setSnippet(val.slice(0, 160).replace(/\n+/g, ' ').trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul artikel wajib diisi.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug / ID artikel wajib diisi.');
      return;
    }
    if (!fullText.trim()) {
      setError('Konten teks artikel (full_text) wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);

    try {
      await onSave({
        id: generateSlug(slug),
        title: title.trim(),
        side,
        date: date.trim() || formatSorsideDate(),
        read_time: readTime.trim() || calculateReadTime(fullText),
        snippet: snippet.trim() || fullText.slice(0, 160).replace(/\n+/g, ' ').trim(),
        full_text: fullText,
        tags: parsedTags,
        cover: cover.trim() || null,
        published
      });
      onClose();
    } catch (err: any) {
      console.error('Error in article submit:', err);
      setError(err.message || 'Gagal menyimpan artikel ke Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-surface/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-heading flex items-center gap-2">
              <span>{isEditing ? 'Edit Artikel Website' : 'Tulis Artikel SORSIDE Baru'}</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Konten ini akan langsung disinkronkan ke tabel <code className="text-accent-primary font-mono text-[11px]">public.articles</code> di Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch: Editor vs Preview */}
            <div className="flex bg-bg-primary p-0.5 rounded-lg border border-border-default text-xs mr-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-accent-primary text-accent-contrast font-medium shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Edit2 size={13} />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-accent-primary text-accent-contrast font-medium shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Eye size={13} />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-2.5 bg-status-error-bg text-status-error text-xs font-medium border-b border-status-error/30 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {activeTab === 'editor' ? (
            <>
              {/* Row 1: Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading">
                    Judul Artikel <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MALAM DAN PERTANYAAN YANG BELUM TERJAWAB"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-sm text-text-primary outline-none transition-colors"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading">
                    Slug URL (ID) <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="malam-dan-pertanyaan"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Side Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-heading">
                  Pilar SORSIDE ("The Side") <span className="text-status-error">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(SORSIDE_SIDE_CONFIG) as SorsideSide[]).map((key) => {
                    const cfg = SORSIDE_SIDE_CONFIG[key];
                    const isSelected = side === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSide(key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-accent-primary/10 border-accent-primary ring-1 ring-accent-primary text-text-primary shadow-xs'
                            : 'bg-bg-primary border-border-default hover:border-border-hover text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-mono text-[11px] font-bold text-accent-primary">
                            {cfg.side_number}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {cfg.side}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-text-heading">
                          {cfg.side_name}
                        </div>
                        <div className="text-[10px] text-text-muted line-clamp-2 mt-1">
                          {cfg.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Date, Read Time, Cover */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading">
                    Tanggal Rilis
                  </label>
                  <input
                    type="text"
                    placeholder="20 JULI 2026"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading">
                    Estimasi Waktu Baca
                  </label>
                  <input
                    type="text"
                    placeholder="2 MIN BACA"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading">
                    Cover URL / Cloudinary ID
                  </label>
                  <input
                    type="text"
                    placeholder="Opsional (URL atau Cloudinary)"
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Snippet & Tags */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading">
                    Snippet / Cuplikan Ringkas
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat yang tampil pada kartu artikel di website..."
                    value={snippet}
                    onChange={(e) => setSnippet(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-xs font-semibold text-text-heading flex items-center gap-1">
                    <Tag size={12} className="opacity-70" />
                    <span>Tags (Pisahkan koma)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="pikiran, malam, resah"
                    value={tagsInput}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) => setTagsInput(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none"
                  />
                  <p className="text-[10px] text-text-muted">Contoh: refleksi, analog, kopi</p>
                </div>
              </div>

              {/* Row 5: Full Text Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-text-heading">
                    Isi Lengkap Artikel (full_text) <span className="text-status-error">*</span>
                  </label>
                  <span className="text-[11px] text-text-muted font-mono">
                    {fullText.split(/\s+/).filter(Boolean).length} kata • {fullText.length} karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={12}
                  placeholder="Tuliskan isi artikel atau jurnal di sini... Pisahkan paragraf dengan baris baru."
                  value={fullText}
                  onChange={(e) => handleFullTextChange(e.target.value)}
                  className="w-full p-4 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-sm text-text-primary outline-none font-sans leading-relaxed resize-y font-normal"
                />
              </div>

              {/* Row 6: Published Status Switch */}
              <div className="flex items-center justify-between p-3.5 bg-bg-primary border border-border-default rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-text-heading">Status Publikasi</div>
                  <div className="text-[11px] text-text-muted">
                    {published
                      ? 'Artikel langsung dapat diakses dan dibaca oleh pengunjung website SORSIDE.'
                      : 'Artikel disimpan sebagai DRAFT (hanya dapat dilihat di Noesis ini).'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-default peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-6 max-w-2xl mx-auto py-4">
              <div className="border-b border-border-default pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[11px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full border ${
                      SORSIDE_SIDE_CONFIG[side].badgeClass
                    }`}
                  >
                    {SORSIDE_SIDE_CONFIG[side].side_number} {SORSIDE_SIDE_CONFIG[side].side_name}
                  </span>
                  <span className="text-xs text-text-muted">•</span>
                  <span className="text-xs text-text-muted">{date || formatSorsideDate()}</span>
                  <span className="text-xs text-text-muted">•</span>
                  <span className="text-xs text-text-muted">{readTime}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-text-heading leading-tight mb-3">
                  {title || 'Judul Artikel Kosong'}
                </h1>

                {snippet && (
                  <p className="text-sm text-text-secondary italic border-l-2 border-accent-primary pl-3 py-1">
                    "{snippet}"
                  </p>
                )}
              </div>

              {/* Full Text Display */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary leading-relaxed space-y-4 whitespace-pre-wrap">
                {fullText || (
                  <span className="text-text-muted italic">Belum ada teks artikel.</span>
                )}
              </div>

              {tagsInput && (
                <div className="pt-6 border-t border-border-default flex flex-wrap gap-1.5">
                  {tagsInput
                    .split(',')
                    .map((t) => t.trim().replace(/^#/, ''))
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-bg-primary border border-border-subtle px-2.5 py-1 rounded-md text-text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border-default flex items-center justify-end gap-3">
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
                  <span>{isEditing ? 'Perbarui di Website' : 'Publikasikan ke SORSIDE'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
