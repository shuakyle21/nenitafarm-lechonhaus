import { supabase } from '@/lib/supabase';
import { Order, OrderType } from '@/types';

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
          *,
          order_items (
            *,
            menu_items (
              name,
              category,
              image
            )
          )
        `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedOrders: Order[] = data.map((order: any) => {
      // Ensure order_items is an array to prevent crashes
      const items = Array.isArray(order.order_items) ? order.order_items : [];
      const totalAmount = parseFloat(order.total_amount || 0);

      return {
        id: order.id,
        date: order.created_at,
        items: items.map((item: any) => {
          const priceAtTime = parseFloat(item.price_at_time || 0);
          const weight = item.weight ? parseFloat(item.weight) : null;
          const quantity = parseFloat(item.quantity || 0);

          return {
            id: item.menu_item_id,
            name: item.menu_items?.name || 'Unknown Item',
            price: priceAtTime,
            quantity: quantity,
            finalPrice: weight 
              ? priceAtTime * weight 
              : priceAtTime * quantity,
            category: item.menu_items?.category || 'Short Orders',
            image: item.menu_items?.image || '',
            cartId: item.id,
            weight: weight || undefined,
          };
        }),
        subtotal: totalAmount,
        discount: order.discount_details,
        total: totalAmount,
        cash: parseFloat(order.cash || 0),
        change: parseFloat(order.change || 0),
        orderType: order.order_type as OrderType,
        orderNumber: order.order_number,
        paymentMethod: order.payment_method,
      };
    });
    return mappedOrders;
  },

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
