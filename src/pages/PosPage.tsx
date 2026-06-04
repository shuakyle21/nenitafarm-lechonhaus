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
  isOnline: boolean;
}

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

const PosPage: React.FC<PosPageProps> = ({ onSaveOrder, isOnline }) => {
  const { menuItems, addItem, updateItem, deleteItem } = useMenu(true);
  const { orders, setOrders } = useOrders(true);
  const { staffList } = useStaff(true);

  const todayOrderCount = orders.filter((o) => isToday(o.date)).length;

  const handleSaveOrderWrapper = async (order: Order): Promise<Order | null> => {
    try {
      const result = await onSaveOrder(order);

      if (result.success) {
        if (result.mode === 'ONLINE') {
          // Update local state with the returned real data (real id + order_number)
          setOrders((prev) => [result.data, ...prev]);
        } else {
          alert('Offline: Order saved to local backup. Will sync when online.');
        }
        // Return the persisted order so the receipt can show its real number.
        return result.data as Order;
      }
      return null;
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
      return null;
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
      isOnline={isOnline}
    />
  );
};

export default PosPage;
