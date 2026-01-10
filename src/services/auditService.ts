import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_by: string;
  changed_at: string;
  user?: {
    username: string;
  };
}

export const auditService = {
  async getLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users:changed_by (username)
      `)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    
    // Map the users response to match the interface
    return (data || []).map((log: any) => ({
      ...log,
      user: log.users
    }));
  }
};
