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
    const mappedOrders: Order[] = data.map((order: any) => ({
      id: order.id,
      date: order.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      items: order.order_items.map((item: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: item.menu_item_id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        name: item.menu_items?.name || 'Unknown Item',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        price: item.price_at_time,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        quantity: item.quantity,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        finalPrice: item.weight
          ? item.price_at_time * item.weight
          : item.price_at_time * item.quantity,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        category: item.menu_items?.category || 'Short Orders',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        image: item.menu_items?.image || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        cartId: item.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        weight: item.weight,
      })),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      subtotal: order.total_amount,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      discount: order.discount_details,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      total: order.total_amount,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      cash: order.cash,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      change: order.change,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      orderType: order.order_type as OrderType,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      orderNumber: order.order_number,
    }));
    return mappedOrders;
  },

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  },
};
