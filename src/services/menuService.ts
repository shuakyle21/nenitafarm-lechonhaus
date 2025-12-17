import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/types';

export const menuService = {
  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase.from('menu_items').select('*').order('name');

    if (error) throw error;
    if (!data) return [];

    return data.map((item) => ({
      ...item,
      isWeighted: item.is_weighted,
    }));
  },

  async addMenuItem(item: MenuItem): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([
        {
          name: item.name,
          price: item.price,
          category: item.category,
          image: item.image,
          is_weighted: item.isWeighted,
          description: item.description,
          available: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { ...item, id: data.id };
  },

  async updateMenuItem(item: MenuItem): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .update({
        name: item.name,
        price: item.price,
        category: item.category,
        image: item.image,
        is_weighted: item.isWeighted,
        description: item.description,
      })
      .eq('id', item.id);

    if (error) throw error;
  },

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  },
};
