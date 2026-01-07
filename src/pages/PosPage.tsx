import React from 'react';
import PosModule from '@/components/PosModule';
import { useMenu } from '@/hooks/useMenu';
import { useOrders } from '@/hooks/useOrders';
import { useStaff } from '@/hooks/useStaff';
import { Order } from '@/types';

interface PosPageProps {
  onSaveOrder: (
    order: Order
  ) => Promise<{ success: boolean; mode: 'ONLINE' | 'OFFLINE'; data?: any }>;
}

const PosPage: React.FC<PosPageProps> = ({ onSaveOrder }) => {
  const { menuItems, addItem, updateItem, deleteItem } = useMenu(true);
  const { orders, setOrders } = useOrders(true);
  const { staffList } = useStaff(true);

  // Helper for daily count
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todayOrderCount = orders.filter((o) => isToday(o.date)).length;

  const handleSaveOrderWrapper = async (order: Order) => {
    try {
      const result = await onSaveOrder(order);

      if (result.success) {
        if (result.mode === 'ONLINE') {
          // Update local state with the returned real data
          setOrders((prev) => [result.data, ...prev]);
          alert('Order saved successfully!');
        } else {
          alert('Offline: Order saved to local backup. Will sync when online.');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
      return false;
    }
  };

  return (
    <PosModule
      items={menuItems}
      orderCount={todayOrderCount}
      onAddItem={addItem}
      onUpdateItem={updateItem}
      onDeleteItem={deleteItem}
      onSaveOrder={handleSaveOrderWrapper}
      staffList={staffList}
    />
  );
};

export default PosPage;
