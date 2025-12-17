import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '@/types';
import { menuService } from '@/services/menuService';

export function useMenu(isAuthenticated: boolean) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await menuService.getMenuItems();
      setMenuItems(items);
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
