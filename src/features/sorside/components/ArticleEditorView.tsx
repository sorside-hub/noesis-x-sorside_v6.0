import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { SorsideArticle, SorsideSide, SORSIDE_CATEGORIES, SORSIDE_SIDE_CONFIG } from '../../../types/sorside';
import {
  generateSlug,
  formatReleaseDate,
  calculateReadTime
} from '../../../lib/sorsideService';
import { EditorCore, EditorCoreRef } from '../../editor/components/EditorCore';
import { Toolbar } from '../../editor/components/Toolbar';
import {
  Save,
  Edit3,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  History
} from 'lucide-react';

interface ArticleEditorViewProps {
  article: SorsideArticle | null;
  onBack: () => void;
  onSave: (
    articleData: Partial<SorsideArticle> & {
      id: string;
      title: string;
      side: SorsideSide;
      full_text: string;
    }
  ) => Promise<any>;
}

export const ArticleEditorView: React.FC<ArticleEditorViewProps> = ({
  article,
  onBack,
  onSave
}) => {
  const isEditing = Boolean(article);
  const editorRef = useRef<EditorCoreRef>(null);

  const [title, setTitle] = useState(() => article?.title || '');
  const [slug, setSlug] = useState(() => article?.slug || article?.id || '');
  const [side, setSide] = useState<SorsideSide>(() => (article?.category as SorsideSide) || article?.side || 'stories');
  const [date, setDate] = useState(() => article?.date || article?.release_date || formatReleaseDate(new Date()));
  const [snippet, setSnippet] = useState(() => article?.snippet || '');
  const [fullText, setFullText] = useState(() => article?.content || article?.full_text || '');
  const [published, setPublished] = useState(() => article?.published !== undefined ? article.published : false);

  // Draft storage key for local autosave
  const draftKey = `sorside_article_draft_${article?.id || 'new'}`;

  // Initial values reference to compute isDirty
  const initialValuesRef = useRef({
    title: article?.title || '',
    slug: article?.slug || article?.id || '',
    side: (article?.category as SorsideSide) || article?.side || 'stories',
    date: article?.date || article?.release_date || formatReleaseDate(new Date()),
    snippet: article?.snippet || '',
    fullText: article?.content || article?.full_text || '',
    published: article?.published !== undefined ? article.published : false,
  });

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<any | null>(null);

  // Determine if there are unsaved changes
  const isDirty =
    title !== initialValuesRef.current.title ||
    fullText !== initialValuesRef.current.fullText ||
    side !== initialValuesRef.current.side ||
    date !== initialValuesRef.current.date ||
    snippet !== initialValuesRef.current.snippet ||
    published !== initialValuesRef.current.published;

  // 2 Distinct Tabs: 'write' (Tulis) | 'metadata' (Metadata)
  const [activeTab, setActiveTab] = useState<'write' | 'metadata'>('write');

  // TipTap editor instance from EditorCore for the standard Toolbar
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Local Autosave Effect
  useEffect(() => {
    if (isDirty && (title.trim() || fullText.trim())) {
      const draftData = {
        title,
        slug,
        side,
        date,
        snippet,
        fullText,
        published,
        timestamp: Date.now()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [title, slug, side, date, snippet, fullText, published, isDirty, draftKey]);

  // Check for existing local draft recovery on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          (parsed.fullText !== initialValuesRef.current.fullText ||
            parsed.title !== initialValuesRef.current.title) &&
          (parsed.fullText?.trim() || parsed.title?.trim())
        ) {
          setRecoveredDraft(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved draft:', err);
    }
  }, [draftKey]);

  // Browser / Phone Back navigation integration & unsaved prompt
  useEffect(() => {
    window.history.pushState({ sorsideEditor: true }, '');
    const handlePopState = () => {
      if (isDirty) {
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
  }, [onBack, isDirty, draftKey]);

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

  // Initialize form when article prop changes
  useEffect(() => {
    if (article) {
      const initVals = {
        title: article.title || '',
        slug: article.slug || article.id || '',
        side: (article.category as SorsideSide) || article.side || 'stories',
        date: article.date || article.release_date || formatReleaseDate(new Date()),
        snippet: article.snippet || '',
        fullText: article.content || article.full_text || '',
        published: article.published !== undefined ? article.published : false,
      };
      initialValuesRef.current = initVals;

      setTitle(initVals.title);
      setSlug(initVals.slug);
      setSide(initVals.side);
      setDate(initVals.date);
      setSnippet(initVals.snippet);
      setFullText(initVals.fullText);
      setPublished(initVals.published);
    } else {
      const initVals = {
        title: '',
        slug: '',
        side: 'stories' as SorsideSide,
        date: formatReleaseDate(new Date()),
        snippet: '',
        fullText: '',
        published: false,
      };
      initialValuesRef.current = initVals;

      setTitle('');
      setSlug('');
      setSide('stories');
      setDate(formatReleaseDate(new Date()));
      setSnippet('');
      setFullText('');
      setPublished(false);
    }
    setError(null);
  }, [article]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft) return;
    if (recoveredDraft.title !== undefined) setTitle(recoveredDraft.title);
    if (recoveredDraft.fullText !== undefined) setFullText(recoveredDraft.fullText);
    if (recoveredDraft.side !== undefined) setSide(recoveredDraft.side);
    if (recoveredDraft.date !== undefined) setDate(recoveredDraft.date);
    if (recoveredDraft.snippet !== undefined) setSnippet(recoveredDraft.snippet);
    if (recoveredDraft.published !== undefined) setPublished(recoveredDraft.published);

    setSaveSuccessNotice('Draf lokal berhasil dipulihkan!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
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
      setSlug(generateSlug(val));
    }
  };

  const handleFullTextChange = (val: string) => {
    setFullText(val);
    if (!snippet && val) {
      setSnippet(val.slice(0, 160).replace(/\n+/g, ' ').trim());
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Judul artikel wajib diisi.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug ID wajib diisi.');
      return;
    }
    if (!fullText.trim()) {
      setError('Konten teks artikel wajib diisi.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const cleanSlug = generateSlug(slug || title);
      await onSave({
        id: article?.id,
        slug: cleanSlug,
        title: title.trim(),
        side,
        category: side,
        date: date.trim() || formatReleaseDate(new Date()),
        release_date: date.trim() || formatReleaseDate(new Date()),
        snippet: snippet.trim() || fullText.slice(0, 160).replace(/\n+/g, ' ').trim(),
        content: fullText,
        full_text: fullText,
        published
      });
      // Clear autosaved draft on successful save
      localStorage.removeItem(draftKey);
      initialValuesRef.current = {
        title: title.trim(),
        slug: cleanSlug,
        side,
        date: date.trim() || formatReleaseDate(new Date()),
        snippet: snippet.trim() || fullText.slice(0, 160).replace(/\n+/g, ' ').trim(),
        fullText,
        published
      };
      setSaveSuccessNotice('Artikel berhasil disimpan!');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    } catch (err: any) {
      console.error('Error saving article:', err);
      setError(err.message || 'Gagal menyimpan artikel.');
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  const characterCount = fullText.length;
  const paragraphsCount = fullText.trim() ? fullText.trim().split(/\n+/).length : 0;

  return (
    <div className="h-full w-full flex flex-col bg-bg-primary select-none overflow-hidden animate-in fade-in duration-200 relative">
      {/* Top Header */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-bg-surface border-b border-border-default shrink-0 z-20 space-y-2 sm:space-y-0">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Category Indicator & Title */}
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-mono text-accent-primary font-bold shrink-0 lowercase">
              {side}
            </span>
            <span className="text-xs text-text-muted hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-text-heading truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]">
              {title || 'Artikel Baru'}
            </span>
          </div>

          {/* Center: 2 Tab Navigation (Tulis & Metadata) */}
          <div className="flex items-center bg-bg-primary p-1 rounded-xl border border-border-default shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'write'
                  ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Edit3 size={13} />
              <span>Tulis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'metadata'
                  ? 'bg-bg-surface text-accent-primary font-bold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Metadata</span>
            </button>
          </div>

          {/* Right: Read-only Status Indicator + Save Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Pure Read-only Status Dot */}
            <span
              title={published ? 'Status: Published (Ubah di tab Metadata)' : 'Status: Draft (Ubah di tab Metadata)'}
              className={`w-2.5 h-2.5 rounded-full shrink-0 select-none ${
                published ? 'bg-emerald-400 animate-pulse' : 'bg-text-muted/60'
              }`}
            />

            {/* Save Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
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
      </header>

      {/* Notifications */}
      {recoveredDraft && (
        <div className="px-4 sm:px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between gap-3 shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <History size={16} className="text-amber-400 shrink-0" />
            <span className="truncate">
              Ditemukan draf lokal tersimpan dari sesi sebelumnya ({recoveredDraft.timestamp ? new Date(recoveredDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'sebelumnya'}).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer shadow-xs"
            >
              Pulihkan Draf
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2 py-1 rounded-lg hover:bg-amber-500/20 text-amber-300 text-[11px] transition-colors cursor-pointer"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

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

      {saveSuccessNotice && (
        <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 shrink-0 animate-in fade-in">
          <CheckCircle2 size={15} />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* MAIN BODY: 2 TABS */}
      <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
        {activeTab === 'write' ? (
          /* TAB 1: TULIS - Menggunakan Engine Editor Note Standar Noesis (Toolbar + TipTap EditorCore) */
          <main className="flex-1 overflow-hidden relative flex flex-col">
            {/* Standard Toolbar */}
            <div className="flex-none border-b border-border-default/60">
              <Toolbar editor={tiptapEditor} />
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0">
                <EditorCore
                  key={article?.id || 'new-article-editor'}
                  noteId={article?.id || 'new-article'}
                  ref={editorRef}
                  title={title}
                  onTitleChange={handleTitleChange}
                  initialContent={fullText}
                  onChange={handleFullTextChange}
                  onEditorReady={setTiptapEditor}
                  isReadOnly={false}
                />
              </div>
            </div>
          </main>
        ) : (
          /* TAB 2: METADATA - Category, Slug ID, Snippet, Release Date */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-3xl w-full mx-auto space-y-6 pb-16">
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

              {/* 1. Category Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-text-heading uppercase tracking-wider">
                  1. Category <span className="text-status-error">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {SORSIDE_CATEGORIES.map((cat) => {
                    const isSelected = side === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSide(cat.id)}
                        className={`px-3 py-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-accent-primary/10 border-accent-primary ring-2 ring-accent-primary/40 shadow-xs font-bold text-accent-primary'
                            : 'bg-bg-surface border-border-default hover:border-border-hover text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono lowercase">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Slug ID */}
              <div className="space-y-2 bg-bg-surface border border-border-default p-4 rounded-2xl">
                <label className="block text-xs font-bold text-text-heading flex items-center justify-between">
                  <span>2. Slug ID <span className="text-status-error">*</span></span>
                  <span className="text-[10px] font-mono text-text-muted">Primary Key</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="judul-artikel"
                  className="w-full px-3.5 py-2.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs font-mono text-text-primary outline-none"
                />
              </div>

              {/* 3. Snippet */}
              <div className="space-y-2 bg-bg-surface border border-border-default p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-text-heading">
                    3. Snippet
                  </label>
                  <span className="text-[10px] font-mono text-text-muted">{snippet.length}/160 karakter</span>
                </div>
                <textarea
                  rows={3}
                  value={snippet}
                  onChange={(e) => setSnippet(e.target.value)}
                  placeholder="Snippet artikel..."
                  className="w-full p-3 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none resize-none leading-relaxed"
                />
              </div>

              {/* 4. Release Date */}
              <div className="space-y-2 bg-bg-surface border border-border-default p-4 rounded-2xl">
                <label className="block text-xs font-bold text-text-heading">4. Release Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="25-07-2026"
                  className="w-full px-3.5 py-2.5 bg-bg-primary border border-border-default focus:border-accent-primary rounded-xl text-xs text-text-primary outline-none font-mono"
                />
              </div>

              {/* Stats summary */}
              <div className="p-4 bg-bg-surface rounded-2xl border border-border-default space-y-2 text-xs text-text-muted">
                <div className="font-bold text-text-heading text-xs uppercase tracking-wider">Statistik Teks Artikel</div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-bg-primary p-2.5 rounded-xl border border-border-default">
                    <div className="font-mono text-base font-bold text-text-primary">{wordCount}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Kata</div>
                  </div>
                  <div className="bg-bg-primary p-2.5 rounded-xl border border-border-default">
                    <div className="font-mono text-base font-bold text-text-primary">{characterCount}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Karakter</div>
                  </div>
                  <div className="bg-bg-primary p-2.5 rounded-xl border border-border-default">
                    <div className="font-mono text-base font-bold text-text-primary">{paragraphsCount}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Paragraf</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-bg-surface border border-border-default rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-text-heading">Simpan Perubahan Artikel?</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Anda memiliki perubahan pada artikel ini yang belum disimpan. Draf Anda telah tersimpan sementara secara lokal di browser.
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
                  await handleSubmit();
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
    </div>
  );
};
