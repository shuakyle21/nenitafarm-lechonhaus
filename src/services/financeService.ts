import { supabase } from '@/lib/supabase';
import { Expense, SalesAdjustment, CashTransaction } from '@/types';

export const financeService = {
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as Expense[];
  },

  async getSalesAdjustments(): Promise<SalesAdjustment[]> {
    const { data, error } = await supabase
      .from('sales_adjustments')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as SalesAdjustment[];
  },

  async getCashTransactions(): Promise<CashTransaction[]> {
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as CashTransaction[];
  },
};
