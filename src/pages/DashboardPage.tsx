import React from 'react';
import DashboardModule from '@/components/DashboardModule';
import { useMenu } from '@/hooks/useMenu';
import { useOrders } from '@/hooks/useOrders';
import { useFinancials } from '@/hooks/useFinancials';

const DashboardPage: React.FC = () => {
  // Pass isAuthenticated=true because we only render this if authenticated
  const { menuItems } = useMenu(true);
  const { orders, deleteOrder } = useOrders(true);
  const { expenses, salesAdjustments } = useFinancials(true);

  // Simplified handler for now, can be expanded
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order permanently?')) return;
    try {
      await deleteOrder(id);
      alert('Order deleted successfully');
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    }
  };

  return (
    <DashboardModule
      items={menuItems}
      orders={orders}
      expenses={expenses}
      salesAdjustments={salesAdjustments}
      onDeleteOrder={handleDeleteOrder}
    />
  );
};

export default DashboardPage;
