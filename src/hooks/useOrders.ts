import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types';
import { orderService } from '@/services/orderService';

export function useOrders(isAuthenticated: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  const deleteOrder = async (id: string) => {
    try {
      await orderService.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Error deleting order:', err);
      throw err;
    }
  };

  return { orders, setOrders, loading, deleteOrder, refreshOrders: fetchOrders };
}
