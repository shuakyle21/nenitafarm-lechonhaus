import React, { useState, useEffect, useMemo } from 'react';
import { StaffTransaction } from '@/types';
import { staffManagementService } from '@/services/staffManagementService';
import { ArrowUpRight, Calendar, Filter, Download, TrendingUp } from 'lucide-react';

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
    fetchTransactions();
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
