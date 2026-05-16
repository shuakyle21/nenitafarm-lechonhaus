import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Staff, Attendance, StaffTransaction } from '../types';

interface PayrollData {
  staff: Staff;
  startDate: string;
  endDate: string;
  attendance: Attendance[];
  transactions: StaffTransaction[];
  prevBalance: number;
}

export const generatePayrollPDF = (data: PayrollData) => {
  const { staff, startDate, endDate, attendance, transactions, prevBalance } = data;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(220, 38, 38); // Match brand red
  doc.text('NENITA FARM LECHON HAUS', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Individual Salary Report', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`${startDate} to ${endDate}`, 105, 38, { align: 'center' });

  // Staff Info
  doc.setFontSize(12);
  doc.text(`Staff Name: ${staff.name}`, 20, 50);
  doc.text(`Role: ${staff.role}`, 20, 57);
  doc.text(`Daily Rate: P ${staff.daily_wage?.toFixed(2)}`, 20, 64);

  // Attendance Summary
  const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
  const grossPay = presentDays * (staff.daily_wage || 0);

  doc.setFontSize(14);
  doc.text('1. Attendance Summary', 20, 80);
  autoTable(doc, {
    startY: 85,
    head: [['Date', 'Status', 'Rate', 'Total']],
    body: attendance.map(a => [
      a.date,
      a.status || 'PRESENT',
      `P ${staff.daily_wage?.toFixed(2)}`,
      a.status === 'PRESENT' ? `P ${staff.daily_wage?.toFixed(2)}` : 'P 0.00'
    ]),
    foot: [['TOTAL DAYS', `${presentDays} Days`, 'GROSS PAY', `P ${grossPay.toFixed(2)}`]],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220, 38, 38] },
    footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  // Transactions Ledger
  doc.setFontSize(14);
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('2. Transaction Ledger (Deductions/Payments)', 20, currentY);
  
  const relevantTx = transactions.filter(t => t.type !== 'SALARY_PAYOUT');
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [['Date', 'Type', 'Notes', 'Amount']],
    body: relevantTx.map(t => [
      t.date,
      t.type,
      t.notes || '-',
      `P ${Number(t.amount).toFixed(2)}`
    ]),
    theme: 'striped',
    styles: { fontSize: 9 }
  });

  // Final Computation
  const lastY = (doc as any).lastAutoTable.finalY + 15;
  const totalAdvances = transactions.filter(t => t.type === 'ADVANCE').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPayments = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'SALARY_PAYOUT').reduce((sum, t) => sum + Number(t.amount), 0);
  const outstandingAtStart = prevBalance;
  
  // Logical breakdown
  const totalDebt = totalAdvances - totalPayments;
  const deduction = Math.min(grossPay, totalDebt > 0 ? totalDebt : 0);
  const netPay = grossPay - deduction;

  doc.setFontSize(14);
  doc.text('3. Final Computation', 20, lastY);
  
  doc.setFontSize(11);
  doc.text(`Total Gross Earnings:`, 20, lastY + 10);
  doc.text(`P ${grossPay.toFixed(2)}`, 150, lastY + 10, { align: 'right' });
  
  doc.text(`Less: Cash Advance Deductions:`, 20, lastY + 18);
  doc.text(`- P ${deduction.toFixed(2)}`, 150, lastY + 18, { align: 'right' });
  
  doc.setLineWidth(0.5);
  doc.line(20, lastY + 22, 160, lastY + 22);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`NET TAKE HOME PAY:`, 20, lastY + 32);
  doc.text(`P ${netPay.toFixed(2)}`, 150, lastY + 32, { align: 'right' });

  if (totalDebt > deduction) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(220, 38, 38);
    doc.text(`* Remaining Debt: P ${(totalDebt - deduction).toFixed(2)}`, 20, lastY + 40);
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Confidential Payroll Document', 105, 280, { align: 'center' });

  // Download
  doc.save(`Salary_Report_${staff.name}_${endDate}.pdf`);
  
  return { grossPay, deduction, netPay };
};
