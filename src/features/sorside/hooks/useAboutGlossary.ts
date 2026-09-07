import { useState, useEffect, useCallback } from 'react';
import { AboutGlossaryItem } from '../../../types/sorside';
import {
  getAboutGlossaryItems,
  createAboutGlossaryItem,
  updateAboutGlossaryItem,
  deleteAboutGlossaryItem,
  reorderAboutGlossaryItems
} from '../../../lib/sorsideService';

export const useAboutGlossary = () => {
  const [items, setItems] = useState<AboutGlossaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAboutGlossaryItems();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch glossary items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (itemData: Omit<AboutGlossaryItem, 'id' | 'created_at'>) => {
    try {
      const newItem = await createAboutGlossaryItem(itemData);
      if (newItem) {
        setItems(prev => [...prev, newItem].sort((a, b) => a.order_index - b.order_index));
        return newItem;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<AboutGlossaryItem, 'id' | 'created_at'>>) => {
    try {
      const updatedItem = await updateAboutGlossaryItem(id, updates);
      if (updatedItem) {
        setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        return updatedItem;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const success = await deleteAboutGlossaryItem(id);
      if (success) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      throw err;
    }
  };

  const reorderItems = async (reorderedItems: AboutGlossaryItem[]) => {
    // Optimistic UI update
    setItems(reorderedItems);
    
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        order_index: index
      }));
      await reorderAboutGlossaryItems(updates);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder items');
      // Revert on failure
      fetchItems();
      throw err;
    }
  };

  return {
    items,
    isLoading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    reorderItems
  };
};
