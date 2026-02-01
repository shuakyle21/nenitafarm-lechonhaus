import React, { useState, useEffect, useMemo } from 'react';
import { StaffTransaction } from '@/types';
import { staffManagementService } from '@/services/staffManagementService';
import { ArrowUpRight, Calendar, Filter, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface FinancialLedgerProps {
  onBack?: () => void;
}

const FinancialLedger: React.FC<FinancialLedgerProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<StaffTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await staffManagementService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary
  const summary = useMemo(() => {
    const totalPayroll = transactions
      .filter(t => t.type === 'SALARY_PAYOUT' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCA = transactions
      .filter(t => t.type === 'ADVANCE' && t.status === 'ACTIVE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDeductions = transactions
      .filter(t => t.type === 'DEDUCTION' && t.status === 'APPLIED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalPayroll,
      totalCA,
      totalDeductions,
      netOutflow: totalPayroll + totalCA - totalDeductions,
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      // Date filtering could be added here
      return true;
    });
  }, [transactions, typeFilter, dateRange]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALARY_PAYOUT: 'Salary',
      ADVANCE: 'CA',
      DEDUCTION: 'Deduction',
      PAYMENT: 'Payment',
      BONUS: 'Bonus',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-emerald-100 text-emerald-700',
      ACTIVE: 'bg-amber-100 text-amber-700',
      APPLIED: 'bg-blue-100 text-blue-700',
      PENDING: 'bg-stone-100 text-stone-600',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return styles[status || 'PENDING'] || 'bg-stone-100 text-stone-600';
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(34, 34, 34); // Stone-900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NENITA FARM LECHON HAUS', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Staff Financial Ledger Report', pageWidth / 2, 28, { align: 'center' });

    // Report Info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentTime.toLocaleString()}`, 14, 50);
    doc.text(`Period: ${dateRange === 'all' ? 'All Time' : dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, 14, 55);

    // Summary Cards (Styled)
    const cardWidth = (pageWidth - 40) / 2;
    const drawCard = (x: number, y: number, title: string, value: string, color: [number, number, number]) => {
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardWidth, 25, 3, 3, 'FD');
      
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(title.toUpperCase(), x + 5, y + 8);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(value, x + 5, y + 18);
    };

    drawCard(14, 65, 'Total Payroll Paid', `P ${summary.totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, [30, 30, 30]);
    drawCard(pageWidth / 2 + 6, 65, 'Total Active CA', `P ${summary.totalCA.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, [30, 30, 30]);
    drawCard(14, 95, 'Total Deductions', `P ${summary.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, [34, 197, 94]);
    drawCard(pageWidth / 2 + 6, 95, 'Net Financial Outflow', `P ${summary.netOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, [220, 38, 38]);

    // Transaction Table
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Details', 14, 135);

    autoTable(doc, {
      head: [['Date', 'Employee', 'Type', 'Description', 'Amount', 'Status']],
      body: filteredTransactions.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.staff?.name || 'Unknown',
        getTypeLabel(tx.type),
        tx.description || tx.notes || '-',
        `P ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        tx.status || 'Pending'
      ]),
      startY: 140,
      theme: 'striped',
      headStyles: { fillColor: [34, 34, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'center' }
      }
    });

    doc.save(`financial_ledger_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Staff Ledger');

    // Title
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'NENITA FARM LECHON HAUS - Staff Financial Ledger';
    titleCell.font = { size: 16, bold: true };
    sheet.mergeCells('A1:F1');

    sheet.getCell('A2').value = `Generated on: ${currentTime.toLocaleString()}`;
    sheet.getCell('A3').value = `Period: ${dateRange === 'all' ? 'All Time' : dateRange}`;

    // Summary Section (Calculations - BLACK text as per skill)
    sheet.getCell('A5').value = 'FINANCIAL SUMMARY';
    sheet.getCell('A5').font = { bold: true };

    const summaryData = [
      ['Total Payroll Paid', 'SALARY_PAYOUT', 'PAID'],
      ['Total Active Cash Advances', 'ADVANCE', 'ACTIVE'],
      ['Total Deductions Applied', 'DEDUCTION', 'APPLIED'],
    ];

    summaryData.forEach((item, index) => {
      const row = 6 + index;
      sheet.getCell(`A${row}`).value = item[0];
      sheet.getCell(`A${row}`).font = { bold: true };
      
      // Use SUMIF formula to calculate totals from the data below
      // Formula: SUMIFS(E14:E500, C14:C500, "Type", F14:F500, "Status")
      sheet.getCell(`B${row}`).value = {
        formula: `SUMIFS(E14:E500, C14:C500, "${item[1]}", F14:F500, "${item[2]}")`,
      };
      sheet.getCell(`B${row}`).numFmt = '"P"#,##0.00;[Red]("-P"#,##0.00);"-"';
      sheet.getCell(`B${row}`).font = { color: { argb: '00000000' } }; // Black for formulas
    });

    // Net Outflow Calculation
    sheet.getCell('A9').value = 'Net Financial Outflow';
    sheet.getCell('A9').font = { bold: true };
    sheet.getCell('B9').value = { formula: 'B6 + B7 - B8' };
    sheet.getCell('B9').numFmt = '"P"#,##0.00;[Red]("-P"#,##0.00);"-"';
    sheet.getCell('B9').font = { bold: true, color: { argb: 'FFFF0000' } }; // Red for outflow

    // Transactions Table Header
    const headerRow = sheet.getRow(13);
    headerRow.values = ['Date', 'Employee', 'Type', 'Description', 'Amount', 'Status'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF222222' } };
    });

    // Data (Inputs - BLUE text as per skill)
    filteredTransactions.forEach((tx, index) => {
      const rowIndex = 14 + index;
      const row = sheet.getRow(rowIndex);
      row.values = [
        new Date(tx.date).toLocaleDateString(),
        tx.staff?.name || 'Unknown',
        tx.type,
        tx.description || tx.notes || '-',
        Number(tx.amount),
        tx.status || 'Pending'
      ];
      row.font = { color: { argb: 'FF0000FF' } }; // Blue for inputs
      sheet.getCell(`E${rowIndex}`).numFmt = '#,##0.00';
    });

    // Column widths
    sheet.columns = [
      { width: 15 }, { width: 25 }, { width: 15 }, { width: 35 }, { width: 15 }, { width: 15 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `financial_ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm text-stone-500 mb-1">Total Payroll Paid</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-stone-800">
                ₱ {summary.totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <ArrowUpRight size={18} className="text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm text-stone-500 mb-1">Total Active Cash Advances</p>
            <span className="text-2xl font-bold text-stone-800">
              ₱ {summary.totalCA.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm text-stone-500 mb-1">Total Deductions Applied</p>
            <span className="text-2xl font-bold text-stone-800">
              ₱ {summary.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-sm text-stone-500 mb-1">Net Financial Outflow</p>
            <span className="text-2xl font-bold text-stone-800">
              ₱ {summary.netOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-800">Restaurant Financial Transactions</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-stone-400" />
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="text-sm bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-stone-400" />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="text-sm bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5"
                >
                  <option value="all">All Types</option>
                  <option value="SALARY_PAYOUT">Salary</option>
                  <option value="ADVANCE">Cash Advance</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
              </div>
              <div className="flex items-center gap-2 border-l border-stone-200 pl-3 ml-2">
                <button
                  onClick={exportPDF}
                  className="p-2 hover:bg-stone-50 rounded-lg text-red-600 transition-colors"
                  title="Export as PDF"
                >
                  <FileText size={18} />
                </button>
                <button
                  onClick={() => { void exportExcel(); }}
                  className="p-2 hover:bg-stone-50 rounded-lg text-emerald-600 transition-colors"
                  title="Export as Excel"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Employee Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-stone-600">
                        {new Date(tx.date).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-stone-800">
                        {tx.staff?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">
                        {getTypeLabel(tx.type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {tx.description || tx.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-stone-800 text-right">
                        ₱ {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(tx.status)}`}>
                          {tx.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};

export default FinancialLedger;
