import { useState, useEffect, useCallback, useRef } from 'react';
import { MenuItem, Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { inventoryService } from '@/services/inventoryService';

export const useOfflineSync = (userId: string | null) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOrders, setPendingOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem('pending_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('pending_orders', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  // Function to actually insert the order into Supabase
  const insertOrderToSupabase = async (order: Order) => {
    // 1. Insert into orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          total_amount: order.total,
          status: 'completed',
          payment_method: order.paymentMethod || 'CASH',
          payment_reference: order.paymentReference,
          discount_details: order.discount,
          cash: order.cash,
          change: order.change,
          order_type: order.orderType || 'DINE_IN',
          delivery_address: order.deliveryAddress,
          delivery_time: order.deliveryTime,
          contact_number: order.contactNumber,
          created_at: order.date, // Preserve the original creation date
          created_by: userId,
          updated_by: userId,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderId = orderData.id;

    // 2. Insert into order_items table
    const orderItems = order.items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_time: item.price,
      weight: item.weight,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    
    if (itemsError) {
      // Rollback: Delete the header if items fail to insert
      await supabase.from('orders').delete().eq('id', orderId);
      throw itemsError;
    }

    // 3. Deduct stock from inventory
    await inventoryService.deductStockFromOrder(
      order.items.map((item) => ({ id: item.id, quantity: item.quantity })),
      userId
    );

    return orderData;
  };

  const syncOfflineOrders = useCallback(async () => {
    if (pendingOrders.length === 0 || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    const syncedOrders: Order[] = [];

    try {
      // Process in batches to avoid overwhelming the server
      const BATCH_SIZE = 5;

      for (let i = 0; i < pendingOrders.length; i += BATCH_SIZE) {
        const batch = pendingOrders.slice(i, i + BATCH_SIZE);

        // Process batch concurrently for better performance
        const results = await Promise.allSettled(
          batch.map((order) => insertOrderToSupabase(order))
        );

        // Collect successfully synced orders
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            syncedOrders.push(batch[index]);
          } else {
            console.error('Failed to sync order:', batch[index].id, result.reason);
          }
        });
      }
    } finally {
      // Update pending orders - remove the ones that were synced
      setPendingOrders((prev) =>
        prev.filter((o) => !syncedOrders.find((so) => so.id === o.id))
      );
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [pendingOrders]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineOrders();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineOrders]); // correct dependency: syncOfflineOrders (which depends on pendingOrders)

  const saveOrderWithOfflineSupport = async (
    order: Order
  ): Promise<{ success: boolean; mode: 'ONLINE' | 'OFFLINE'; data?: any }> => {
    if (isOnline) {
      try {
        const data = await insertOrderToSupabase(order);
        return {
          success: true,
          mode: 'ONLINE',
          data: { ...order, id: data.id, orderNumber: data.order_number },
        };
      } catch (error: any) {
        console.error('Online save failed, checking error type:', error);

        // Only fall back to offline if it's a network error
        const isNetworkError =
          !navigator.onLine ||
          (error instanceof TypeError && error.message === 'Failed to fetch') ||
          error?.message?.includes('Network request failed');

        if (!isNetworkError) {
          // It's a real error (e.g. RLS policy violation, invalid data), so THROW it.
          // Doing this prevents "False Offline Mode" where a bug is masked as an offline save.
          throw error;
        }

        console.log('Network error detected, falling back to offline backup...');
      }
    }

    // Save locally
    const offlineOrder = { ...order, id: `OFFLINE-${Date.now()}` }; // Temp ID
    setPendingOrders((prev) => [...prev, offlineOrder]);
    return { success: true, mode: 'OFFLINE', data: offlineOrder };
  };

  return {
    isOnline,
    isSyncing,
    pendingOrdersCount: pendingOrders.length,
    saveOrderWithOfflineSupport,
    syncOfflineOrders,
  };
};
