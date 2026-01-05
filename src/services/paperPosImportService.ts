import { supabase } from '@/lib/supabase';
import { PaperPosRecord, Order, CartItem, OrderType } from '@/types';

export const paperPosImportService = {
  /**
   * Get all paper POS import records
   */
  async getPaperPosRecords(): Promise<PaperPosRecord[]> {
    const { data, error } = await supabase
      .from('paper_pos_imports')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get unsynced paper POS records
   */
  async getUnsyncedRecords(): Promise<PaperPosRecord[]> {
    const { data, error } = await supabase
      .from('paper_pos_imports')
      .select('*')
      .eq('synced', false)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Import a single paper POS record
   */
  async importRecord(record: Omit<PaperPosRecord, 'id' | 'imported_at'>): Promise<PaperPosRecord> {
    const { data, error } = await supabase
      .from('paper_pos_imports')
      .insert([
        {
          date: record.date,
          items: record.items,
          total_amount: record.total_amount,
          payment_method: record.payment_method || 'CASH',
          order_type: record.order_type || 'DINE_IN',
          notes: record.notes,
          imported_by: record.imported_by,
          synced: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Import multiple paper POS records (batch import)
   */
  async importRecords(
    records: Omit<PaperPosRecord, 'id' | 'imported_at'>[]
  ): Promise<PaperPosRecord[]> {
    const recordsToInsert = records.map((record) => ({
      date: record.date,
      items: record.items,
      total_amount: record.total_amount,
      payment_method: record.payment_method || 'CASH',
      order_type: record.order_type || 'DINE_IN',
      notes: record.notes,
      imported_by: record.imported_by,
      synced: false,
    }));

    const { data, error } = await supabase
      .from('paper_pos_imports')
      .insert(recordsToInsert)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Parse items string into CartItem array
   * Expected format: "Item Name x Qty @ Price" or JSON string
   */
  parseItems(itemsString: string): CartItem[] {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(itemsString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, parse as text format
    }

    // Parse text format: "Item Name x Qty @ Price, Item Name x Qty @ Price"
    const items: CartItem[] = [];
    const itemLines = itemsString.split(',').map((s) => s.trim());

    itemLines.forEach((line, index) => {
      // Match patterns like "Lechon Baboy x 2 @ 150" or "Pork BBQ x 1 @ 50"
      const match = line.match(/^(.+?)\s*x\s*(\d+(?:\.\d+)?)\s*@\s*(\d+(?:\.\d+)?)/i);

      if (match) {
        const [, name, qty, price] = match;
        const quantity = parseFloat(qty);
        const unitPrice = parseFloat(price);

        // Generate unique ID with timestamp and random component
        const uniqueId = `paper-import-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`;

        items.push({
          id: uniqueId,
          cartId: `cart-${uniqueId}`,
          name: name.trim(),
          price: unitPrice,
          quantity,
          finalPrice: quantity * unitPrice,
          category: 'Short Orders', // Default category
          image: '',
        });
      }
    });

    return items;
  },

  /**
   * Sync a paper POS record to the orders table
   */
  async syncRecordToOrder(recordId: string): Promise<string> {
    // Get the paper record
    const { data: paperRecord, error: fetchError } = await supabase
      .from('paper_pos_imports')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError) throw fetchError;
    if (!paperRecord) throw new Error('Paper record not found');
    if (paperRecord.synced) {
      throw new Error('Record already synced');
    }

    // Parse items
    const items = this.parseItems(paperRecord.items);

    if (items.length === 0) {
      throw new Error('No valid items found in paper record');
    }

    // Create order in orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          total_amount: paperRecord.total_amount,
          status: 'completed',
          payment_method: paperRecord.payment_method || 'CASH',
          order_type: (paperRecord.order_type as OrderType) || 'DINE_IN',
          created_at: paperRecord.date, // Use the paper record's date
          discount_details: null,
          cash: paperRecord.total_amount,
          change: 0,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderId = orderData.id;

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id.startsWith('paper-import') ? null : item.id, // Use null for paper imports
      quantity: item.quantity,
      price_at_time: item.price,
      weight: item.weight ?? null, // Use null if weight is undefined
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      // Manual rollback: Delete the order if items insert fails
      // Note: This is not atomic. In production, consider using database transactions
      // or stored procedures for better consistency guarantees.
      await supabase.from('orders').delete().eq('id', orderId);
      throw itemsError;
    }

    // Mark paper record as synced
    const { error: updateError } = await supabase
      .from('paper_pos_imports')
      .update({
        synced: true,
        synced_order_id: orderId,
      })
      .eq('id', recordId);

    if (updateError) throw updateError;

    return orderId;
  },

  /**
   * Sync all unsynced paper POS records
   */
  async syncAllRecords(): Promise<{
    success: number;
    failed: number;
    errors: Array<{ recordId: string; error: string }>;
  }> {
    const unsyncedRecords = await this.getUnsyncedRecords();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ recordId: string; error: string }>,
    };

    for (const record of unsyncedRecords) {
      try {
        await this.syncRecordToOrder(record.id!);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          recordId: record.id!,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },

  /**
   * Delete a paper POS record
   */
  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase.from('paper_pos_imports').delete().eq('id', id);
    if (error) throw error;
  },
};
