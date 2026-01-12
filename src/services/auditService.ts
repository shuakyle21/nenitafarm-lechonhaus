import { supabase } from '@/lib/supabase';
import { createDateMatcher } from '@/utils/dateUtils';
import { orderService } from './orderService';
import { financeService } from './financeService';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_by: string;
  changed_at: string;
  user?: {
    username: string;
  };
}

export const auditService = {
  async getLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users:changed_by (username)
      `)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    
    // Map the users response to match the interface
    return (data || []).map((log: any) => ({
      ...log,
      user: log.users
    }));
  },

  async getDailyReconciliation() {
    const dm = createDateMatcher();
    const [allOrders, allExpenses, allCashTx] = await Promise.all([
      orderService.getOrders(),
      financeService.getExpenses(),
      financeService.getCashTransactions()
    ]);

    const todayOrders = allOrders.filter(o => dm.isToday(o.date));
    const todayExpenses = allExpenses.filter(e => dm.isToday(e.date));
    const todayCashTx = allCashTx.filter(t => dm.isToday(t.created_at));

    const cashSales = todayOrders
      .filter(o => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + o.total, 0);

    const expenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const openingFund = todayCashTx
      .filter(t => t.type === 'OPENING_FUND')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashDrops = todayCashTx
      .filter(t => t.type === 'CASH_DROP')
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedCash = openingFund + cashSales - expenses - cashDrops;

    return {
      openingFund,
      cashSales,
      expenses,
      cashDrops,
      expectedCash
    };
  }
};
