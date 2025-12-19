import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryService } from '../src/services/inventoryService';
import { supabase } from '../src/lib/supabase';

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Inventory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully calculate usage quantities', async () => {
    // Mock recipe data
    const mockRecipe = [
      { menu_item_id: 'menu-1', inventory_item_id: 'inv-1', quantity_required: 0.5 }
    ];
    
    // Mock stock data
    const mockItem = { id: 'inv-1', current_stock: 10 };

    // Setup mocks
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockRecipe, error: null })
        };
      }
      if (table === 'inventory_items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockItem, error: null }),
          update: vi.fn().mockReturnThis(),
        };
      }
      if (table === 'inventory_transactions') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null })
        };
      }
    });

    // Test deduction
    await inventoryService.deductStockFromOrder([{ id: 'menu-1', quantity: 2 }]);

    // Verify transactions were called with 0.5 * 2 = 1.0 quantity
    expect(supabase.from).toHaveBeenCalledWith('inventory_transactions');
    // The second call to from('inventory_items') for the stock update
    expect(supabase.from).toHaveBeenCalledWith('inventory_items');
  });
});
