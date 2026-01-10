import { supabase } from '@/lib/supabase';
import { InventoryItem, InventoryTransaction, Recipe, Supplier } from '@/types';

export const inventoryService = {
  // Inventory Items
  async getInventoryItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async addInventoryItem(item: Omit<InventoryItem, 'id'>, userId?: string | null): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        ...item,
        updated_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateInventoryStock(itemId: string, newStock: number, userId?: string | null): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .update({ 
        current_stock: newStock,
        updated_by: userId 
      })
      .eq('id', itemId);

    if (error) throw error;
  },

  // Transactions
  async getTransactions(itemId?: string): Promise<InventoryTransaction[]> {
    let query = supabase.from('inventory_transactions').select('*').order('transaction_date', { ascending: false });
    
    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>, userId?: string | null): Promise<void> {
    const { error } = await supabase
      .from('inventory_transactions')
      .insert([{
        ...transaction,
        created_by: userId
      }]);

    if (error) throw error;

    // Update current stock based on transaction
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('current_stock')
      .eq('id', transaction.item_id)
      .single();

    if (itemError) throw itemError;

    let stockChange = transaction.quantity;
    if (transaction.transaction_type === 'USAGE' || transaction.transaction_type === 'SPOILAGE') {
      stockChange = -transaction.quantity;
    }

    await this.updateInventoryStock(transaction.item_id, (item.current_stock || 0) + stockChange, userId);
  },

  // Recipes
  async getRecipes(menuItemId?: string): Promise<Recipe[]> {
    let query = supabase.from('recipes').select('*');
    if (menuItemId) {
      query = query.eq('menu_item_id', menuItemId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async saveRecipe(recipe: Omit<Recipe, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .upsert([recipe], { onConflict: 'menu_item_id,inventory_item_id' });

    if (error) throw error;
  },

  // Deduct stock based on an order
  async deductStockFromOrder(items: { id: string; quantity: number }[], userId?: string | null): Promise<void> {
    try {
      for (const item of items) {
        // 1. Get recipes for this menu item
        const { data: recipes, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('menu_item_id', item.id);

        if (recipeError) throw recipeError;
        if (!recipes || recipes.length === 0) continue;

        // 2. For each ingredient in the recipe, record usage and deduct stock
        for (const recipe of recipes) {
          const totalQuantityToDeduct = recipe.quantity_required * item.quantity;
          
          await this.addTransaction({
            item_id: recipe.inventory_item_id,
            transaction_type: 'USAGE',
            quantity: totalQuantityToDeduct,
            notes: `Auto-deduct from order: ${item.id}`,
            transaction_date: new Date().toISOString()
          }, userId);
        }
      }
    } catch (err) {
      console.error('Failed to deduct stock from order:', err);
      // We don't throw here to avoid failing the entire order sync if inventory deduction fails
      // though in a production system we might want more robust error handling.
    }
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data || [];
  }
};
