import { describe, it, expect } from 'vitest';
import { Staff, Attendance, StaffTransaction } from '../src/types';

// Mock calculation logic inspired by generatePayrollPDF logic
const calculatePayroll = (data: {
  staff: Partial<Staff>;
  attendance: Partial<Attendance>[];
  transactions: StaffTransaction[];
  prevBalance: number;
}) => {
  const { staff, attendance, transactions, prevBalance } = data;
  
  const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
  const grossPay = presentDays * (staff.daily_wage || 0);

  const totalAdvances = transactions.filter(t => t.type === 'ADVANCE').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPayments = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'SALARY_PAYOUT').reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalDebt = totalAdvances - totalPayments + prevBalance;
  const deduction = Math.min(grossPay, totalDebt > 0 ? totalDebt : 0);
  const netPay = grossPay - deduction;
  const remainingDebt = Math.max(0, totalDebt - deduction);

  return { grossPay, deduction, netPay, remainingDebt };
};

describe('Payroll Calculation Logic', () => {
  const mockStaff: Partial<Staff> = {
    daily_wage: 500
  };

  it('calculates gross pay correctly based on attendance', () => {
    const attendance: Partial<Attendance>[] = [
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'ABSENT' }
    ];
    const result = calculatePayroll({ staff: mockStaff, attendance, transactions: [], prevBalance: 0 });
    expect(result.grossPay).toBe(1000);
    expect(result.netPay).toBe(1000);
  });

  it('deducts cash advance correctly', () => {
    const attendance: Partial<Attendance>[] = [{ status: 'PRESENT' }, { status: 'PRESENT' }];
    const transactions: any[] = [
      { type: 'ADVANCE', amount: 300 }
    ];
    const result = calculatePayroll({ staff: mockStaff, attendance, transactions, prevBalance: 0 });
    expect(result.grossPay).toBe(1000);
    expect(result.deduction).toBe(300);
    expect(result.netPay).toBe(700);
    expect(result.remainingDebt).toBe(0);
  });

  it('handles debt exceeding earnings', () => {
    const attendance: Partial<Attendance>[] = [{ status: 'PRESENT' }];
    const transactions: any[] = [
      { type: 'ADVANCE', amount: 1500 }
    ];
    const result = calculatePayroll({ staff: mockStaff, attendance, transactions, prevBalance: 0 });
    expect(result.grossPay).toBe(500);
    expect(result.deduction).toBe(500); // Only deduct what was earned
    expect(result.netPay).toBe(0);
    expect(result.remainingDebt).toBe(1000);
  });

  it('accounts for manual payments', () => {
    const attendance: Partial<Attendance>[] = [{ status: 'PRESENT' }, { status: 'PRESENT' }];
    const transactions: any[] = [
      { type: 'ADVANCE', amount: 1000 },
      { type: 'PAYMENT', amount: 200 }
    ];
    const result = calculatePayroll({ staff: mockStaff, attendance, transactions, prevBalance: 0 });
    expect(result.grossPay).toBe(1000);
    expect(result.deduction).toBe(800); // 1000 - 200 = 800 debt
    expect(result.netPay).toBe(200);
  });
});
