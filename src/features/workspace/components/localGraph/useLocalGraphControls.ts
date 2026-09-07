import { useState, useCallback } from 'react';
import { LocalGraphDepth, LocalGraphFilterOptions } from './types';

export function useLocalGraphControls() {
  const [filters, setFilters] = useState<LocalGraphFilterOptions>({
    depth: 1,
    showOutgoing: true,
    showBacklinks: true,
    showTags: true,
    showSemantic: false,
  });

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const setDepth = useCallback((depth: LocalGraphDepth) => {
    setFilters((prev) => ({ ...prev, depth }));
  }, []);

  const toggleOutgoing = useCallback(() => {
    setFilters((prev) => ({ ...prev, showOutgoing: !prev.showOutgoing }));
  }, []);

  const toggleBacklinks = useCallback(() => {
    setFilters((prev) => ({ ...prev, showBacklinks: !prev.showBacklinks }));
  }, []);

  const toggleTags = useCallback(() => {
    setFilters((prev) => ({ ...prev, showTags: !prev.showTags }));
  }, []);

  const toggleSemantic = useCallback(() => {
    setFilters((prev) => ({ ...prev, showSemantic: !prev.showSemantic }));
  }, []);

  return {
    filters,
    setDepth,
    toggleOutgoing,
    toggleBacklinks,
    toggleTags,
    toggleSemantic,
    isFilterMenuOpen,
    setIsFilterMenuOpen,
  };
}
