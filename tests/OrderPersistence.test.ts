import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOfflineSync } from '../src/hooks/useOfflineSync';
import { supabase } from '../src/lib/supabase';

// Mock Supabase
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock inventoryService
vi.mock('../src/services/inventoryService', () => ({
  inventoryService: {
    deductStockFromOrder: vi.fn().mockResolvedValue(true),
  },
}));

describe('Order Persistence (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('should include table_number and server_name in the supabase insert payload', async () => {
    // 1. Setup mock query chain
    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: { id: 'new-id', order_number: 123 }, 
      error: null 
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    // 2. Prepare order with tableNumber and serverName
    // We cast to any because the type doesn't have serverName yet
    const order: any = {
      id: 'temp-id',
      date: new Date().toISOString(),
      items: [],
      total: 1000,
      cash: 1000,
      change: 0,
      paymentMethod: 'CASH',
      tableNumber: '12',
      serverName: 'John Doe',
    };

    // 3. Render hook and call save
    const { result } = renderHook(() => useOfflineSync('user-1'));
    
    await result.current.saveOrderWithOfflineSupport(order);

    // 4. Verify the insert call
    // Currently, this should FAIL because useOfflineSync doesn't map these fields
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          table_number: '12',
          server_name: 'John Doe',
        }),
      ])
    );
  });
});
