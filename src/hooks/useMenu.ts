import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/types';
import { menuService } from '@/services/menuService';
import { MENU_ITEMS } from '@/constants';

export function useMenu(isAuthenticated: boolean) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const remoteItems = await menuService.getMenuItems();
      
      // Merge local constants with remote items (avoid duplicates)
      const mergedMap = new Map<string, MenuItem>();
      
      // 1. Add local items first
      MENU_ITEMS.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
      
      // 2. Overwrite/add with remote items (database is source of truth)
      remoteItems.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
      
      const allItems = Array.from(mergedMap.values());
      setMenuItems(allItems);
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchMenuItems();
    }
  }, [isAuthenticated, fetchMenuItems]);

  const addItem = async (item: MenuItem) => {
    try {
      const newItem = await menuService.addMenuItem(item);
      setMenuItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error(err);
      alert('Failed to add item');
      throw err;
    }
  };

  const updateItem = async (item: MenuItem) => {
    try {
      await menuService.updateMenuItem(item);
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } catch (err) {
      console.error(err);
      alert('Failed to update item');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await menuService.deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
      throw err;
    }
  };

  return {
    menuItems,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refreshMenu: fetchMenuItems,
  };
}
