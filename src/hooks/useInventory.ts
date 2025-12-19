import { useState, useEffect, useCallback } from 'react';
import { InventoryItem, InventoryTransaction, Recipe, Supplier } from '@/types';
import { inventoryService } from '@/services/inventoryService';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventoryData, suppliersData] = await Promise.all([
        inventoryService.getInventoryItems(),
        inventoryService.getSuppliers()
      ]);
      setItems(inventoryData);
      setSuppliers(suppliersData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  }, [fetchData]);

  const addTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'created_at'>) => {
    try {
      await inventoryService.addTransaction(transaction);
      await fetchData(); // Refresh data to get updated stock levels
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  };

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const newItem = await inventoryService.addInventoryItem(item);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err: any) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  };

  const getRecipes = async (menuItemId: string) => {
    try {
      return await inventoryService.getRecipes(menuItemId);
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      throw err;
    }
  };

  const saveRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    try {
      await inventoryService.saveRecipe(recipe);
    } catch (err: any) {
      console.error('Error saving recipe:', err);
      throw err;
    }
  };

  const lowStockItems = items.filter(item => item.current_stock <= item.reorder_level);

  return {
    items,
    suppliers,
    loading,
    error,
    lowStockItems,
    refreshInventory: fetchData,
    addTransaction,
    addItem,
    getRecipes,
    saveRecipe
  };
}
