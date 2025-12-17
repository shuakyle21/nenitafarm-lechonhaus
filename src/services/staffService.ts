import { supabase } from '@/lib/supabase';
import { Staff } from '@/types';

export const staffService = {
  async getStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name');
    if (error) throw error;
    return (data || []) as Staff[];
  },
};
