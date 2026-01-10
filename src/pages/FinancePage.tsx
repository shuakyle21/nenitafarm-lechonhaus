import React from 'react';
import FinancialModule from '@/components/FinancialModule';
import { useFinancials } from '@/hooks/useFinancials';
import { useOrders } from '@/hooks/useOrders';
import { usePaperPosImport } from '@/hooks/usePaperPosImport';

interface FinancePageProps {
  username?: string;
  userId: string | null;
}

const FinancePage: React.FC<FinancePageProps> = ({ username = 'Unknown', userId }) => {
  const { expenses, salesAdjustments, refreshFinancials } = useFinancials(true);
  const { orders, refreshOrders } = useOrders(true);
  const paperPosImport = usePaperPosImport(true);

  const handleRefresh = () => {
    refreshFinancials();
    refreshOrders();
  };

  return (
    <FinancialModule
      orders={orders}
      expenses={expenses}
      salesAdjustments={salesAdjustments}
      onRefresh={handleRefresh}
      paperPosImport={paperPosImport}
      username={username}
      userId={userId}
    />
  );
};

export default FinancePage;
