import React, { useState, useEffect, useMemo } from 'react';
import { Staff } from '@/types';
import { staffManagementService } from '@/services/staffManagementService';
import { Calendar, Download, FileText, Check, CheckSquare, Square } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PayrollData {
  staff: Staff;
  daysWorked: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  selected: boolean;
}

const BulkPayrollGeneration: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All Departments');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await staffManagementService.getStaff();
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const generatePayroll = async () => {
    setLoading(true);
    try {
      const results = await staffManagementService.generateBulkPayroll(
        staffList.map(s => s.id),
        dateRange.start,
        dateRange.end
      );
      
      setPayrollData(results.map(r => ({
        ...r,
        selected: true,
      })));
    } catch (error) {
      console.error('Error generating payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayroll = useMemo(() => {
    if (roleFilter === 'All Departments') return payrollData;
    return payrollData.filter(p => p.staff.role === roleFilter);
  }, [payrollData, roleFilter]);

  const toggleSelect = (staffId: string) => {
    setPayrollData(prev => prev.map(p => 
      p.staff.id === staffId ? { ...p, selected: !p.selected } : p
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = filteredPayroll.every(p => p.selected);
    setPayrollData(prev => prev.map(p => ({
      ...p,
      selected: !allSelected,
    })));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const selected = payrollData.filter(p => p.selected);

    doc.setFontSize(18);
    doc.text('NENITA FARM LECHON HAUS', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Bulk Payroll Report', 105, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 105, 28, { align: 'center' });

    autoTable(doc, {
      head: [['Staff Name', 'Role', 'Days Worked', 'Gross Pay', 'Deductions', 'Net Pay']],
      body: selected.map(p => [
        p.staff.name,
        p.staff.role,
        `${p.daysWorked} Days`,
        `P ${p.grossPay.toFixed(2)}`,
        `P ${p.deductions.toFixed(2)}`,
        `P ${p.netPay.toFixed(2)}`,
      ]),
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [34, 34, 34] },
    });

    doc.save(`payroll_${dateRange.start}_${dateRange.end}.pdf`);
  };

  const exportExcel = () => {
    const selected = payrollData.filter(p => p.selected);
    const headers = ['Staff Name', 'Role', 'Days Worked', 'Gross Pay', 'Deductions', 'Net Pay'];
    const rows = selected.map(p => [
      p.staff.name,
      p.staff.role,
      p.daysWorked,
      p.grossPay,
      p.deductions,
      p.netPay,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
  };

  return (
    <div className="flex-1">
      {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Date Range Picker</label>
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
              <Calendar size={16} className="text-stone-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="text-sm bg-transparent border-0 focus:outline-none"
              />
              <span className="text-stone-300">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="text-sm bg-transparent border-0 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Department</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm"
            >
              <option>All Departments</option>
              <option>Server</option>
              <option>Cashier</option>
              <option>Kitchen</option>
              <option>Manager</option>
            </select>
          </div>

          <button
            onClick={generatePayroll}
            disabled={loading}
            className="mt-5 px-4 py-2 bg-stone-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
          >
            <FileText size={16} />
            {loading ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>

        {/* Payroll Table */}
        {payrollData.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={exportPDF}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-50"
              >
                <Download size={16} />
                Export as PDF
              </button>
              <button
                onClick={exportExcel}
                className="px-4 py-2 border border-emerald-200 text-emerald-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-50"
              >
                <Download size={16} />
                Export as Excel
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="text-left px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-stone-400 hover:text-stone-600">
                      {filteredPayroll.every(p => p.selected) ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Staff Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Total Days Worked</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Gross Pay</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Deductions (CA)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPayroll.map(p => (
                  <tr key={p.staff.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(p.staff.id)} className="text-emerald-600">
                        {p.selected ? <CheckSquare size={18} /> : <Square size={18} className="text-stone-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-stone-800">{p.staff.name}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{p.staff.role}</td>
                    <td className="px-4 py-3 text-sm text-stone-600">{p.daysWorked} Days</td>
                    <td className="px-4 py-3 text-sm text-stone-800 text-right">
                      P {p.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 text-right">
                      P {p.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700 text-right">
                      P {p.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
};

export default BulkPayrollGeneration;
