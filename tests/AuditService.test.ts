import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../src/services/auditService';
import { supabase } from '../src/lib/supabase';
import { orderService } from '../src/services/orderService';
import { financeService } from '../src/services/financeService';

// Mock Dependencies
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../src/services/orderService', () => ({
  orderService: {
    getOrders: vi.fn(),
  },
}));

vi.mock('../src/services/financeService', () => ({
  financeService: {
    getExpenses: vi.fn(),
    getCashTransactions: vi.fn(),
  },
}));

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should fetch and map audit logs correctly', async () => {
      const mockData = [
        {
          id: '1',
          table_name: 'orders',
          record_id: 'rec-1',
          action: 'INSERT',
          users: { username: 'admin' },
          changed_at: new Date().toISOString(),
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const logs = await auditService.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].user?.username).toBe('admin');
      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should fetch logs with date range filters', async () => {
      const mockData = [
        {
          id: '1',
          table_name: 'orders',
          record_id: 'rec-1',
          action: 'INSERT',
          users: { username: 'admin' },
          changed_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const startDate = '2026-01-01T00:00:00.000Z';
      const endDate = '2026-01-31T23:59:59.999Z';
      
      const logs = await auditService.getLogs(startDate, endDate);

      expect(logs).toHaveLength(1);
      expect(mockQuery.gte).toHaveBeenCalledWith('changed_at', startDate);
      expect(mockQuery.lte).toHaveBeenCalledWith('changed_at', endDate);
      expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should fetch logs without date filters when not provided', async () => {
      const mockData = [
        {
          id: '1',
          table_name: 'orders',
          record_id: 'rec-1',
          action: 'INSERT',
          users: { username: 'admin' },
          changed_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const logs = await auditService.getLogs();

      expect(logs).toHaveLength(1);
      expect(mockQuery.order).toHaveBeenCalledWith('changed_at', { ascending: false });
    });

    it('should throw error if supabase fetch fails', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      });

      await expect(auditService.getLogs()).rejects.toThrow('DB Error');
    });
  });

  describe('getDailyReconciliation', () => {
    it('should correctly calculate total expected cash for today', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Mock 2 cash orders (total 1500)
      (orderService.getOrders as any).mockResolvedValue([
        { date: today, paymentMethod: 'CASH', total: 1000 },
        { date: today, paymentMethod: 'CASH', total: 500 },
        { date: '2020-01-01', paymentMethod: 'CASH', total: 9999 }, // Should be filtered out
      ]);

      // Mock 1 expense (200)
      (financeService.getExpenses as any).mockResolvedValue([
        { date: today, amount: 200 },
      ]);

      // Mock Cash Transactions (Opening 500, Drop 300)
      (financeService.getCashTransactions as any).mockResolvedValue([
        { created_at: today, type: 'OPENING_FUND', amount: 500 },
        { created_at: today, type: 'CASH_DROP', amount: 300 },
      ]);

      const result = await auditService.getDailyReconciliation();

      // Calculation: 500 (Open) + 1500 (Sales) - 200 (Exp) - 300 (Drop) = 1500
      expect(result.openingFund).toBe(500);
      expect(result.cashSales).toBe(1500);
      expect(result.expenses).toBe(200);
      expect(result.cashDrops).toBe(300);
      expect(result.expectedCash).toBe(1500);
    });

    it('should handle zero transactions correctly', async () => {
      (orderService.getOrders as any).mockResolvedValue([]);
      (financeService.getExpenses as any).mockResolvedValue([]);
      (financeService.getCashTransactions as any).mockResolvedValue([]);

      const result = await auditService.getDailyReconciliation();

      expect(result.expectedCash).toBe(0);
      expect(result.openingFund).toBe(0);
    });
  });
});
