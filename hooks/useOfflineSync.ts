import { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';
import { batchProcess } from '../lib/performanceUtils';

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
    const isSyncingRef = useRef(false);

    useEffect(() => {
        localStorage.setItem('pending_orders', JSON.stringify(pendingOrders));
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
        if (pendingOrders.length === 0 || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        
        try {
            // Use batch processing for better performance
            const { successful, failed } = await batchProcess(
                pendingOrders,
                async (order) => {
                    const result = await insertOrderToSupabase(order);
                    return { order, result };
                },
                3 // Process 3 orders at a time to avoid overwhelming the database
            );

            // Log failed orders for debugging
            if (failed.length > 0) {
                console.error('Failed to sync some orders:', failed);
            }

            // Remove successfully synced orders from pending list
            const successfulOrderIds = successful.map(s => s.order.id);
            setPendingOrders(prev => prev.filter(o => !successfulOrderIds.includes(o.id)));
        } catch (error) {
            console.error('Error during batch sync:', error);
        } finally {
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
