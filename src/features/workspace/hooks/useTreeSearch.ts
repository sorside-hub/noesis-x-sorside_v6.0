import { useState, useRef, useEffect } from 'react';
import { FileNode } from '../../../types/vault';

interface UseTreeSearchOptions {
  getChildren: (parentId: string | null) => FileNode[];
}

export function useTreeSearch({ getChildren }: UseTreeSearchOptions) {
  const [isTreeSearchOpen, setIsTreeSearchOpen] = useState<boolean>(false);
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>('');
  const [isSearchInputFocused, setIsSearchInputFocused] = useState<boolean>(false);
  const treeSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Focus tree search input when opened
  useEffect(() => {
    if (isTreeSearchOpen) {
      setTimeout(() => {
        treeSearchInputRef.current?.focus();
      }, 50);
    } else {
      setTreeSearchQuery('');
      setIsSearchInputFocused(false);
    }
  }, [isTreeSearchOpen]);

  // Handle outside click to close search bar
  useEffect(() => {
    if (!isTreeSearchOpen) return;

    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        if (!treeSearchQuery.trim()) {
          setIsTreeSearchOpen(false);
          setIsSearchInputFocused(false);
        }
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    };
  }, [isTreeSearchOpen, treeSearchQuery]);

  const matchesSearch = (node: FileNode): boolean => {
    if (!treeSearchQuery.trim()) return true;
    const query = treeSearchQuery.toLowerCase().trim();
    if (node.name.toLowerCase().includes(query)) return true;

    if (node.type === 'folder') {
      const children = getChildren(node.id);
      return children.some((child) => matchesSearch(child));
    }
    return false;
  };

  return {
    isTreeSearchOpen,
    setIsTreeSearchOpen,
    treeSearchQuery,
    setTreeSearchQuery,
    treeSearchInputRef,
    searchContainerRef,
    isSearchInputFocused,
    setIsSearchInputFocused,
    matchesSearch,
  };
}
