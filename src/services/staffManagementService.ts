import { supabase } from '@/lib/supabase';
import { Staff, StaffTransaction, Attendance, StaffTransactionType, StaffTransactionStatus } from '@/types';

export const staffManagementService = {
  // ============ STAFF CRUD ============
  async getStaff(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getStaffById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createStaff(staff: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .insert([staff])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteStaff(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ============ TRANSACTIONS ============
  async getTransactions(filters?: {
    staffId?: string;
    type?: StaffTransactionType;
    status?: StaffTransactionStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<StaffTransaction[]> {
    let query = supabase
      .from('staff_transactions')
      .select(`*, staff:staff_id(id, name, role)`)
      .order('date', { ascending: false });

    if (filters?.staffId) {
      query = query.eq('staff_id', filters.staffId);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: {
    staff_id: string;
    amount: number;
    type: StaffTransactionType;
    description?: string;
    date?: string;
    notes?: string;
    status?: StaffTransactionStatus;
    pay_period_start?: string;
    pay_period_end?: string;
    created_by?: string;
  }): Promise<StaffTransaction> {
    const { data, error } = await supabase
      .from('staff_transactions')
      .insert([{
        ...transaction,
        date: transaction.date || new Date().toISOString().split('T')[0],
        status: transaction.status || 'PENDING',
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTransactionStatus(id: string, status: StaffTransactionStatus): Promise<void> {
    const { error } = await supabase
      .from('staff_transactions')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  // ============ ATTENDANCE ============
  async getAttendance(date?: string): Promise<Attendance[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', targetDate);
    if (error) throw error;
    return data || [];
  },

  async getAttendanceRange(staffId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async clockIn(staffId: string): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        staff_id: staffId,
        clock_in: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async clockOut(attendanceId: string): Promise<void> {
    const { error } = await supabase
      .from('attendance')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', attendanceId);
    if (error) throw error;
  },

  async markAbsent(staffId: string, reason: string): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        staff_id: staffId,
        clock_in: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        status: 'ABSENT',
        notes: reason,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ============ PAYROLL CALCULATIONS ============
  async calculatePayroll(staffId: string, startDate: string, endDate: string): Promise<{
    daysWorked: number;
    grossPay: number;
    totalAdvances: number;
    totalDeductions: number;
    netPay: number;
    attendance: Attendance[];
    transactions: StaffTransaction[];
  }> {
    // Get staff details
    const staff = await this.getStaffById(staffId);
    if (!staff) throw new Error('Staff not found');

    // Get attendance for the period
    const attendance = await this.getAttendanceRange(staffId, startDate, endDate);
    const daysWorked = attendance.filter(a => a.status === 'PRESENT').length;

    // Calculate gross pay
    const dailyWage = staff.daily_wage || 0;
    const grossPay = daysWorked * dailyWage;

    // Get transactions (advances, deductions)
    const transactions = await this.getTransactions({
      staffId,
      startDate,
      endDate,
    });

    const totalAdvances = transactions
      .filter(t => t.type === 'ADVANCE' && t.status !== 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDeductions = transactions
      .filter(t => t.type === 'DEDUCTION')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netPay = grossPay - totalAdvances - totalDeductions + (staff.bonuses || 0);

    return {
      daysWorked,
      grossPay,
      totalAdvances,
      totalDeductions,
      netPay,
      attendance,
      transactions,
    };
  },

  // ============ FINANCIAL LEDGER ============
  async getFinancialLedgerSummary(): Promise<{
    totalPayrollPaid: number;
    totalActiveCashAdvances: number;
    totalDeductionsApplied: number;
    netFinancialOutflow: number;
  }> {
    const transactions = await this.getTransactions();

    const totalPayrollPaid = transactions
      .filter(t => t.type === 'SALARY_PAYOUT' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalActiveCashAdvances = transactions
      .filter(t => t.type === 'ADVANCE' && t.status === 'ACTIVE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDeductionsApplied = transactions
      .filter(t => t.type === 'DEDUCTION' && t.status === 'APPLIED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netFinancialOutflow = totalPayrollPaid + totalActiveCashAdvances - totalDeductionsApplied;

    return {
      totalPayrollPaid,
      totalActiveCashAdvances,
      totalDeductionsApplied,
      netFinancialOutflow,
    };
  },

  // ============ BULK PAYROLL ============
  async generateBulkPayroll(
    staffIds: string[],
    startDate: string,
    endDate: string
  ): Promise<Array<{
    staff: Staff;
    daysWorked: number;
    grossPay: number;
    deductions: number;
    netPay: number;
  }>> {
    const results = [];

    for (const staffId of staffIds) {
      const staff = await this.getStaffById(staffId);
      if (!staff) continue;

      const payrollData = await this.calculatePayroll(staffId, startDate, endDate);

      results.push({
        staff,
        daysWorked: payrollData.daysWorked,
        grossPay: payrollData.grossPay,
        deductions: payrollData.totalAdvances + payrollData.totalDeductions,
        netPay: payrollData.netPay,
      });
    }

    return results;
  },
};
