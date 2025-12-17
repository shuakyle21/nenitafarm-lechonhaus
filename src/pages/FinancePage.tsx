import React from 'react';
import FinancialModule from '@/components/FinancialModule';
import { useFinancials } from '@/hooks/useFinancials';
import { useOrders } from '@/hooks/useOrders';

const FinancePage: React.FC = () => {
  const { expenses, salesAdjustments, refreshFinancials } = useFinancials(true);
  const { orders } = useOrders(true);

  return (
    <FinancialModule
      orders={orders}
      expenses={expenses}
      salesAdjustments={salesAdjustments}
      onRefresh={refreshFinancials}
    />
  );
};

export default FinancePage;
