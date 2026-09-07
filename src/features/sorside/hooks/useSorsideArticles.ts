import { useState, useEffect, useCallback, useMemo } from 'react';
import { SorsideArticle, SorsideSide } from '../../../types/sorside';
import {
  fetchSorsideArticles,
  upsertSorsideArticle,
  deleteSorsideArticle,
  togglePublishArticle
} from '../../../lib/sorsideService';

export function useSorsideArticles() {
  const [articles, setArticles] = useState<SorsideArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [selectedSide, setSelectedSide] = useState<'ALL' | SorsideSide>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Drawer States
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<SorsideArticle | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSorsideArticles();
      setArticles(data);
    } catch (err: any) {
      console.error('Failed to load Sorside articles:', err);
      setError(err.message || 'Gagal memuat artikel dari Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleSave = async (
    articleData: Partial<SorsideArticle> & {
      id?: string;
      slug?: string;
      title: string;
      category?: string;
      side?: SorsideSide;
      content?: string;
      full_text?: string;
    }
  ) => {
    try {
      const saved = await upsertSorsideArticle(articleData);
      setArticles((prev) => {
        const idx = prev.findIndex((a) => a.id === saved.id || (saved.slug && a.slug === saved.slug));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setIsEditorOpen(false);
      setEditingArticle(null);
      showNotification(`Artikel "${saved.title}" berhasil disimpan!`);
      return saved;
    } catch (err: any) {
      console.error('Save failed:', err);
      throw err;
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteSorsideArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id && a.slug !== id));
      showNotification(`Artikel "${title}" telah dihapus.`);
    } catch (err: any) {
      console.error('Delete article failed:', err);
      showNotification(`Gagal menghapus artikel: ${err.message || 'Error Supabase'}`);
    }
  };

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    const nextState = !currentPublished;
    try {
      await togglePublishArticle(id, nextState);
      setArticles((prev) =>
        prev.map((a) => (a.id === id || a.slug === id ? { ...a, published: nextState } : a))
      );
      showNotification(
        nextState
          ? 'Artikel sekarang LIVE di website SORSIDE.'
          : 'Artikel diubah menjadi status DRAFT.'
      );
    } catch (err: any) {
      showNotification(`Gagal mengubah status artikel: ${err.message || 'Error Supabase'}`);
    }
  };

  const openNewArticleModal = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  const openEditArticleModal = (article: SorsideArticle) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  // Filtered list
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Category / Side Filter
      const cat = (article.category || article.side || '').toLowerCase();
      if (selectedSide !== 'ALL' && cat !== selectedSide.toLowerCase()) {
        return false;
      }
      // Status Filter
      if (statusFilter === 'PUBLISHED' && !article.published) {
        return false;
      }
      if (statusFilter === 'DRAFT' && article.published) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesSnippet = (article.snippet || '').toLowerCase().includes(query);
        const matchesSlug = (article.slug || article.id || '').toLowerCase().includes(query);
        const matchesContent = (article.content || article.full_text || '').toLowerCase().includes(query);
        return matchesTitle || matchesSnippet || matchesSlug || matchesContent;
      }
      return true;
    });
  }, [articles, selectedSide, statusFilter, searchQuery]);

  return {
    articles: filteredArticles,
    allArticlesCount: articles.length,
    isLoading,
    error,
    selectedSide,
    setSelectedSide,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isEditorOpen,
    setIsEditorOpen,
    editingArticle,
    openNewArticleModal,
    openEditArticleModal,
    isImportOpen,
    setIsImportOpen,
    actionSuccessMessage,
    refresh: loadArticles,
    handleSave,
    handleDelete,
    handleTogglePublish
  };
}
