import { useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';

export const useOfflineSync = () => {
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

    useEffect(() => {
        localStorage.setItem('pending_orders', JSON.stringify(pendingOrders));
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
    }, [pendingOrders]);

    // Function to actually insert the order into Supabase
    const insertOrderToSupabase = async (order: Order) => {
        // 1. Insert into orders table
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
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
                created_at: order.date // Preserve the original creation date
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        const orderId = orderData.id;

        // 2. Insert into order_items table
        const orderItems = order.items.map(item => ({
            order_id: orderId,
            menu_item_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price,
            weight: item.weight
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return orderData;
    };

    const syncOfflineOrders = useCallback(async () => {
        if (pendingOrders.length === 0 || isSyncing) return;

        setIsSyncing(true);
        const remainingOrders = [...pendingOrders];
        const syncedOrders: Order[] = [];

        try {
            // Process sequentially to avoid overwhelming execution
            for (const order of pendingOrders) {
                try {
                    await insertOrderToSupabase(order);
                    syncedOrders.push(order);
                    // Remove from local list as we go (or in bulk later)
                } catch (error) {
                    console.error("Failed to sync order:", order.id, error);
                    // If specific error, maybe keep it. For now, we try all.
                }
            }
        } finally {
            // Update pending orders - remove the ones that were synced
            setPendingOrders(prev => prev.filter(o => !syncedOrders.find(so => so.id === o.id)));
            setIsSyncing(false);
        }
    }, [pendingOrders, isSyncing]);


    const saveOrderWithOfflineSupport = async (order: Order): Promise<{ success: boolean; mode: 'ONLINE' | 'OFFLINE'; data?: any }> => {
        if (isOnline) {
            try {
                const data = await insertOrderToSupabase(order);
                return { success: true, mode: 'ONLINE', data: { ...order, id: data.id, orderNumber: data.order_number } };
            } catch (error) {
                console.error("Online save failed, switching to offline backup:", error);
                // Fallthrough to offline backup
            }
        }

        // Save locally
        const offlineOrder = { ...order, id: `OFFLINE-${Date.now()}` }; // Temp ID
        setPendingOrders(prev => [...prev, offlineOrder]);
        return { success: true, mode: 'OFFLINE', data: offlineOrder };
    };

    return {
        isOnline,
        isSyncing,
        pendingOrdersCount: pendingOrders.length,
        saveOrderWithOfflineSupport,
        syncOfflineOrders
    };
};
