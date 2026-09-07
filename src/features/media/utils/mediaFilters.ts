import { MediaAttachment } from '../../../lib/db';
import { MediaCategory, SortOption, LinkedNoteInfo } from '../types';
import { CATEGORIES_CONFIG } from '../constants';

export const computeCategoryCounts = (
  activeMedia: MediaAttachment[],
  trashedMedia: MediaAttachment[],
  notesList: { id: string; name: string; content?: string }[],
  catId: MediaCategory
): number => {
  if (catId === 'trash') return trashedMedia.length;
  if (catId === 'voice_memo') return activeMedia.filter(m => m.type === 'voice_memo').length;
  if (catId === 'audio') return activeMedia.filter(m => m.type === 'audio').length;
  if (catId === 'image') return activeMedia.filter(m => m.type === 'image').length;
  if (catId === 'document') return activeMedia.filter(m => m.type === 'document' || m.type === 'video').length;
  if (catId === 'unused') {
    return activeMedia.filter(m => !notesList.some(n => n.content?.includes(m.url))).length;
  }
  return 0;
};

export const filterAndSortMedia = (
  mediaList: MediaAttachment[],
  selectedCategory: MediaCategory | null,
  searchQuery: string,
  sortBy: SortOption,
  notesList: { id: string; name: string; content?: string }[]
): MediaAttachment[] => {
  let list = [...mediaList];
  if (selectedCategory === null) {
    list = list.filter(item => !item.deletedAt);
  } else if (selectedCategory === 'trash') {
    list = list.filter(item => !!item.deletedAt);
  } else {
    list = list.filter(item => !item.deletedAt);
    list = list.filter(item => {
      if (selectedCategory === 'voice_memo') return item.type === 'voice_memo';
      if (selectedCategory === 'audio') return item.type === 'audio';
      if (selectedCategory === 'image') return item.type === 'image';
      if (selectedCategory === 'document') return item.type === 'document' || item.type === 'video';
      if (selectedCategory === 'unused') return !notesList.some(n => n.content?.includes(item.url));
      return true;
    });
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(item => item.title.toLowerCase().includes(q));
  }

  list.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  return list;
};
