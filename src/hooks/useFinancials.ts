import { useState, useEffect, useCallback } from 'react';
import { Expense, SalesAdjustment } from '@/types';
import { financeService } from '@/services/financeService';

export function useFinancials(isAuthenticated: boolean) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesAdjustments, setSalesAdjustments] = useState<SalesAdjustment[]>([]);

  const fetchFinancialData = useCallback(async () => {
    try {
      const [expensesData, adjustmentsData] = await Promise.all([
        financeService.getExpenses(),
        financeService.getSalesAdjustments(),
      ]);
      setExpenses(expensesData);
      setSalesAdjustments(adjustmentsData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchFinancialData();
    }
  }, [isAuthenticated, fetchFinancialData]);

  return { expenses, salesAdjustments, refreshFinancials: fetchFinancialData };
}
