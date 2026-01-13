import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order, Expense, SalesAdjustment, CashTransaction, PaperPosRecord } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  History,
  PieChart as PieChartIcon,
  FileText,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Calendar as CalendarIcon,
  CreditCard,
  Banknote,
  Upload,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import FinancialReportPDF from './FinancialReportPDF';
import SalesAdjustmentModal from './SalesAdjustmentModal';
import ExpenseModal from './ExpenseModal';
import CashDropModal from './CashDropModal';
import PaperPosImportModal from './PaperPosImportModal';
import PaperPosRecordsList from './PaperPosRecordsList';
import { checkDateMatch, getLocalDateString, createDateMatcher } from '../utils/dateUtils';
import { exportToCSV } from '../utils/exportUtils';

interface FinancialModuleProps {
  orders: Order[];
  expenses: Expense[];
  salesAdjustments: SalesAdjustment[];
  onRefresh: () => void;
  username?: string;
  paperPosImport?: {
    records: PaperPosRecord[];
    unsyncedRecords: PaperPosRecord[];
    loading: boolean;
    syncing: boolean;
    importRecord: (record: Omit<PaperPosRecord, 'id' | 'imported_at'>) => Promise<PaperPosRecord>;
    importRecords: (
      records: Omit<PaperPosRecord, 'id' | 'imported_at'>[]
    ) => Promise<PaperPosRecord[]>;
    syncRecord: (recordId: string) => Promise<void>;
    syncAllRecords: () => Promise<any>;
    deleteRecord: (id: string) => Promise<void>;
    refreshRecords: () => Promise<void>;
  };
  userId: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FinancialModule: React.FC<FinancialModuleProps> = ({
  orders,
  expenses,
  salesAdjustments,
  onRefresh,
  paperPosImport,
  username = 'Unknown',
  userId = null,
}) => {
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'SALES'>('EXPENSE');

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [person, setPerson] = useState(''); // requestedBy or addedBy
  const [loading, setLoading] = useState(false);

  // Internal State for Cash Transactions (Drops, Opening Fund)
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
  const [isPaperPosImportModalOpen, setIsPaperPosImportModalOpen] = useState(false);
  const [showPaperPosRecords, setShowPaperPosRecords] = useState(false);

  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Cash Transactions (Internal)
  useEffect(() => {
    const fetchCashTransactions = async () => {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setCashTransactions(data);
      if (error) console.error('Error fetching cash transactions:', error);
    };
    fetchCashTransactions();
  }, [onRefresh]); // Refetch when parent refreshes

  const handleTransaction = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason || !person) return;

    setLoading(true);

    if (transactionType === 'EXPENSE') {
      const { error } = await supabase.from('expenses').insert([
        {
          amount: parseFloat(amount),
          reason,
          requested_by: person,
        },
      ]);

      if (error) {
        alert('Error adding expense');
        console.error(error);
      } else {
        setIsExpenseModalOpen(false);
      }
    } else {
      const { error } = await supabase.from('sales_adjustments').insert([
        {
          amount: parseFloat(amount),
          reason,
          added_by: person,
        },
      ]);

      if (error) {
        alert('Error adding sales adjustment');
        console.error(error);
      } else {
        setIsAdjustmentModalOpen(false);
      }
    }

    setAmount('');
    setReason('');
    setPerson('');
    onRefresh();
    setLoading(false);
  }, [amount, reason, person, transactionType, onRefresh]);

  const handleDeleteTransaction = useCallback(
    async (id: string, type: 'EXPENSE' | 'SALES' | 'CASH_DROP') => {
      if (
        !confirm(
          'Are you sure you want to delete this transaction? This action cannot be undone.'
        )
      )
        return;

      let table: string;
      if (type === 'EXPENSE') {
        table = 'expenses';
      } else if (type === 'SALES') {
        table = 'sales_adjustments';
      } else {
        // CASH_DROP
        table = 'cash_transactions';
      }

      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      } else {
        onRefresh();
      }
    },
    [onRefresh]
  );

  const handleAddCashDrop = useCallback(
    async (amount: number, reason: string, performedBy: string) => {
      setLoading(true);
      try {
        const { error } = await supabase.from('cash_transactions').insert([
          {
            amount,
            type: 'CASH_DROP',
            description: reason,
            performed_by: performedBy,
          },
        ]);

        if (error) throw error;
        onRefresh();
        setIsCashDropModalOpen(false);
      } catch (err) {
        console.error('Error adding cash drop:', err);
        alert('Failed to add cash drop');
      } finally {
        setLoading(false);
      }
    },
    [onRefresh]
  );

  // --- Analytics Calculations with Memoization ---
  // Create date matcher once
  const dateMatcher = useMemo(() => createDateMatcher(), []);

  // Combine all today filters into one memoized object
  const todayData = useMemo(() => {
    const todayOrders = orders.filter((o) => dateMatcher.isToday(o.date));
    const todayExpenses = expenses.filter((e) => dateMatcher.isToday(e.date));
    const todaySalesAdjustments = salesAdjustments.filter((s) =>
      dateMatcher.isToday(s.date)
    );
    const todayCashTransactions = cashTransactions.filter((ct) =>
      dateMatcher.isToday(ct.created_at)
    );

    return {
      orders: todayOrders,
      expenses: todayExpenses,
      salesAdjustments: todaySalesAdjustments,
      cashTransactions: todayCashTransactions,
    };
  }, [orders, expenses, salesAdjustments, cashTransactions, dateMatcher]);

  // Format Currency
  const formatCurrency = useCallback((value: number) => {
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  // Sales and financial calculations - Memoized
  const financialMetrics = useMemo(() => {
    // Single-pass calculation for sales breakdown
    const salesBreakdown = todayData.orders.reduce(
      (acc, order) => {
        if (!order.paymentMethod || order.paymentMethod === 'CASH') {
          acc.cash += order.total;
        } else {
          acc.digital += order.total;
        }
        return acc;
      },
      { cash: 0, digital: 0 }
    );

    // Adjustments & Expenses
    const adjustmentsTotal = todayData.salesAdjustments.reduce(
      (sum, adj) => sum + adj.amount,
      0
    );
    const expensesTotal = todayData.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Cash Flow - Single pass for transactions
    const cashFlow = todayData.cashTransactions.reduce(
      (acc, t) => {
        if (t.type === 'OPENING_FUND') {
          acc.opening += t.amount;
        } else if (t.type === 'CASH_DROP') {
          acc.drops += t.amount;
        }
        return acc;
      },
      { opening: 0, drops: 0 }
    );

    const totalSales = salesBreakdown.cash + salesBreakdown.digital;
    const totalRevenue = totalSales + adjustmentsTotal;
    const netCash =
      cashFlow.opening +
      salesBreakdown.cash +
      adjustmentsTotal -
      expensesTotal -
      cashFlow.drops;

    return {
      cashSales: salesBreakdown.cash,
      digitalSales: salesBreakdown.digital,
      totalSales,
      adjustmentsTotal,
      expensesTotal,
      openingFund: cashFlow.opening,
      cashDrops: cashFlow.drops,
      totalRevenue,
      netCash,
    };
  }, [todayData]);

  // Sales Trend Data (Last 7 Days) - Optimized
  const salesTrendData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateTime = d.getTime();
      const dateStr = d.toLocaleDateString();

      const dailySales = orders
        .filter((o) => {
          const orderDate = new Date(o.date);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === dateTime;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      data.push({ date: dateStr, sales: dailySales });
    }
    return data;
  }, [orders]);

  // Category Data - Memoized
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    todayData.orders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.category || 'Others';
        categoryMap[cat] = (categoryMap[cat] || 0) + item.finalPrice;
      });
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [todayData.orders]);

  // Report Logic
  const isSunday = () => new Date().getDay() === 0;
  const isLastDayOfMonth = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.getDate() === 1;
  };

  const getFilteredData = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
    const today = new Date();
    let filteredOrders: Order[] = [];
    let filteredExpenses: Expense[] = [];
    let filteredAdjustments: SalesAdjustment[] = [];
    let title = '';

    if (type === 'TODAY') {
      const todayStr = getLocalDateString(today);
      title = `Daily Financial Report - ${today.toLocaleDateString()}`;
      filteredOrders = orders.filter((o) => checkDateMatch(o.date, todayStr));
      filteredExpenses = expenses.filter((e) => checkDateMatch(e.date, todayStr));
      filteredAdjustments = salesAdjustments.filter((s) => checkDateMatch(s.date, todayStr));
    } else if (type === 'WEEK') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      title = `Weekly Financial Report - ${oneWeekAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`;
      filteredOrders = orders.filter((o) => new Date(o.date) >= oneWeekAgo);
      filteredExpenses = expenses.filter((e) => new Date(e.date) >= oneWeekAgo);
      filteredAdjustments = salesAdjustments.filter((s) => new Date(s.date) >= oneWeekAgo);
    } else if (type === 'MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      title = `Monthly Financial Report - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
      filteredOrders = orders.filter((o) => new Date(o.date) >= firstDay);
      filteredExpenses = expenses.filter((e) => new Date(e.date) >= firstDay);
      filteredAdjustments = salesAdjustments.filter((s) => new Date(s.date) >= firstDay);
    } else if (type === 'CUSTOM') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        title = `Financial Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;

        filteredOrders = orders.filter((o) => {
          const d = new Date(o.date);
          return d >= start && d <= end;
        });
        filteredExpenses = expenses.filter((e) => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        });
        filteredAdjustments = salesAdjustments.filter((s) => {
          const d = new Date(s.date);
          return d >= start && d <= end;
        });
      }
    }

    return { filteredOrders, filteredExpenses, filteredAdjustments, title };
  };

  const generateReport = async (type: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
    const { filteredOrders, filteredExpenses, filteredAdjustments, title } =
      getFilteredData(type);

    if (type === 'CUSTOM' && !startDate && !endDate) {
      alert('Please select a date range.');
      return;
    }

    const blob = await pdf(
      <FinancialReportPDF
        orders={filteredOrders}
        expenses={filteredExpenses}
        salesAdjustments={filteredAdjustments}
        title={title}
      />
    ).toBlob();

    let filenameDate = new Date().toISOString().split('T')[0];
    if (type === 'CUSTOM') {
      filenameDate = startDate && endDate ? `${startDate}_to_${endDate}` : 'custom';
    }

    saveAs(blob, `Financial_Report_${type}_${filenameDate}.pdf`);
  };

  const handleExport = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
    const { filteredOrders, filteredExpenses, filteredAdjustments } = getFilteredData(type);

    if (type === 'CUSTOM' && !startDate && !endDate) {
      alert('Please select a date range.');
      return;
    }

    if (filteredOrders.length > 0) {
      const ordersData = filteredOrders.map((o) => ({
        Date: new Date(o.date).toLocaleDateString(),
        OrderId: o.id || 'N/A',
        Total: o.total,
        Items: o.items.map((i) => `${i.name} (x${i.quantity})`).join('; '),
      }));
      exportToCSV(ordersData, `Orders_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (filteredExpenses.length > 0) {
      const expensesData = filteredExpenses.map((e) => ({
        Date: new Date(e.date).toLocaleDateString(),
        Category: 'Expense',
        Reason: e.reason,
        Amount: e.amount,
        RequestedBy: e.requested_by,
      }));
      exportToCSV(expensesData, `Expenses_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (filteredAdjustments.length > 0) {
      const adjData = filteredAdjustments.map((a) => ({
        Date: new Date(a.date).toLocaleDateString(),
        Category: 'Adjustment',
        Reason: a.reason,
        Amount: a.amount,
        AddedBy: a.added_by,
      }));
      exportToCSV(adjData, `Adjustments_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    }

    if (
      filteredOrders.length === 0 &&
      filteredExpenses.length === 0 &&
      filteredAdjustments.length === 0
    ) {
      alert('No data to export for this period.');
    }
  };

  // Recent Transactions List (Combined)
  const recentTransactions = React.useMemo(() => {
    const combined = [
      ...todayData.expenses.map((e) => ({
        ...e,
        type: 'EXPENSE' as const,
        person: e.requested_by,
      })),
      ...todayData.salesAdjustments.map((s) => ({
        ...s,
        type: 'SALES' as const,
        person: s.added_by,
      })),
      ...todayData.cashTransactions
        .filter((t) => t.type === 'CASH_DROP')
        .map((t) => ({
          id: t.id,
          date: t.created_at,
          amount: t.amount,
          reason: t.description || 'Cash Drop',
          type: 'CASH_DROP' as const,
          person: t.performed_by,
        })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [todayData]);

  return (
    <div className="h-full w-full bg-stone-100 overflow-y-auto p-6 font-roboto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
            <Wallet size={24} />
          </div>
          <div className="font-roboto animate-in fade-in duration-300">
            <h1 className="text-3xl font-brand font-black text-stone-800 tracking-tight">
              Financial Analysis
            </h1>
            <p className="text-stone-500 font-medium">Cash Management & Sales Analytics</p>
          </div>
        </div>

        {/* Report Generation Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-stone-700 focus:outline-none w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-stone-700 focus:outline-none w-auto"
              />
            </div>

            <div className="flex items-center gap-1 border-l border-stone-200 pl-2 ml-2">
              <button
                onClick={() => generateReport('CUSTOM')}
                disabled={!startDate || !endDate}
                className="p-1.5 hover:bg-stone-100 rounded-md text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Generate PDF Report"
              >
                <FileText size={18} />
              </button>
              <button
                onClick={() => handleExport('CUSTOM')}
                disabled={!startDate || !endDate}
                className="p-1.5 hover:bg-stone-100 rounded-md text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export CSV Data"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Period Buttons */}
            <div className="flex bg-white rounded-lg shadow-sm border border-stone-200 p-1">
              {/* Today */}
              <div className="flex items-center">
                <button
                  onClick={() => generateReport('TODAY')}
                  className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-l-md transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => handleExport('TODAY')}
                  className="px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-r-md transition-colors border-l border-stone-100"
                  title="Export Today"
                >
                  <Download size={14} />
                </button>
              </div>

              {/* Week */}
              <div className="flex items-center border-l border-stone-200 pl-1 ml-1">
                <button
                  onClick={() => generateReport('WEEK')}
                  disabled={!isSunday()}
                  className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-l-md transition-colors disabled:opacity-40"
                >
                  Week
                </button>
                <button
                  onClick={() => handleExport('WEEK')}
                  disabled={!isSunday()}
                  className="px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-r-md transition-colors border-l border-stone-100 disabled:opacity-40"
                  title="Export Week"
                >
                  <Download size={14} />
                </button>
              </div>

              {/* Month */}
              <div className="flex items-center border-l border-stone-200 pl-1 ml-1">
                <button
                  onClick={() => generateReport('MONTH')}
                  disabled={!isLastDayOfMonth()}
                  className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-l-md transition-colors disabled:opacity-40"
                >
                  Month
                </button>
                <button
                  onClick={() => handleExport('MONTH')}
                  disabled={!isLastDayOfMonth()}
                  className="px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-r-md transition-colors border-l border-stone-100 disabled:opacity-40"
                  title="Export Month"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Net Cash Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Wallet className="text-green-600" size={24} />
            </div>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${financialMetrics.netCash >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              Actual Cash
            </span>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">
            Net Cash on Hand
          </p>
          <h3 className="text-2xl font-black text-stone-900 mt-1">
            {formatCurrency(financialMetrics.netCash)}
          </h3>
          {/* Breakdown */}
          <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 space-y-1">
            <div className="flex justify-between">
              <span>Opening:</span>
              <span>{formatCurrency(financialMetrics.openingFund)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash Sales:</span>
              <span>{formatCurrency(financialMetrics.cashSales)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Drops/Exp:</span>
              <span>
                -{formatCurrency(financialMetrics.cashDrops + financialMetrics.expensesTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <CreditCard className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">
            Total Revenue
          </p>
          <h3 className="text-2xl font-black text-stone-900 mt-1">
            {formatCurrency(financialMetrics.totalRevenue)}
          </h3>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 space-y-1">
            <div className="flex justify-between">
              <span>Digital:</span>
              <span>{formatCurrency(financialMetrics.digitalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash:</span>
              <span>{formatCurrency(financialMetrics.cashSales)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-50 p-3 rounded-xl">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">
            Total Expenses
          </p>
          <h3 className="text-2xl font-black text-red-600 mt-1">
            {formatCurrency(financialMetrics.expensesTotal)}
          </h3>
        </div>

        {/* Adjustments Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-yellow-50 p-3 rounded-xl">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">
            Total Adjustments
          </p>
          <h3 className="text-2xl font-black text-stone-800 mt-1">
            {formatCurrency(financialMetrics.adjustmentsTotal)}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Trend Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                <h3 className="font-bold text-stone-800 text-lg">Sales Trend</h3>
              </div>
              <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
                Last 7 Days
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => `₱${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Sales']}
                    labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="text-purple-600" size={20} />
              <h3 className="font-bold text-stone-800 text-lg">Sales by Category</h3>
            </div>
            <div className="h-64 w-full flex">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₱${value.toLocaleString()}`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs font-bold text-stone-600 ml-1">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Cash Management (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h3 className="font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
              <Plus className="text-stone-600" size={20} />
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  setTransactionType('EXPENSE');
                  setAmount('');
                  setReason('');
                  setPerson('');
                  setIsExpenseModalOpen(true);
                }}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
              >
                <ArrowDownCircle size={24} />
                <span className="text-xs font-bold uppercase">Expense</span>
              </button>

              <button
                onClick={() => {
                  setTransactionType('SALES');
                  setAmount('');
                  setReason('');
                  setPerson('');
                  setIsAdjustmentModalOpen(true);
                }}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors"
              >
                <ArrowUpCircle size={24} />
                <span className="text-xs font-bold uppercase">Adjustment</span>
              </button>

              <button
                onClick={() => setIsCashDropModalOpen(true)}
                className="col-span-2 flex items-center justify-center gap-2 p-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
              >
                <Banknote size={24} />
                <span className="text-sm font-bold uppercase">Record Cash Drop</span>
              </button>

              {paperPosImport && (
                <button
                  onClick={() => setIsPaperPosImportModalOpen(true)}
                  className="col-span-2 flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                >
                  <Upload size={24} />
                  <span className="text-sm font-bold uppercase">Import Paper POS</span>
                </button>
              )}

              {paperPosImport && paperPosImport.records.length > 0 && (
                <button
                  onClick={() => setShowPaperPosRecords(!showPaperPosRecords)}
                  className="col-span-2 flex items-center justify-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition-colors"
                >
                  <FileText size={24} />
                  <span className="text-sm font-bold uppercase">
                    {showPaperPosRecords ? 'Hide' : 'View'} Paper Records (
                    {paperPosImport.records.length})
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 flex-1 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                <History className="text-stone-400" size={20} />
                Recent Activity
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-stone-400">
                  <p className="font-medium">No activity today</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {recentTransactions.map((trans, idx) => (
                    <div
                      key={trans.id || idx}
                      className="flex justify-between items-center p-4 hover:bg-stone-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            trans.type === 'EXPENSE' || trans.type === 'CASH_DROP'
                              ? 'bg-red-50 text-red-500'
                              : 'bg-green-50 text-green-500'
                          }`}
                        >
                          {trans.type === 'EXPENSE' ? (
                            <ArrowDownCircle size={18} />
                          ) : trans.type === 'CASH_DROP' ? (
                            <Wallet size={18} />
                          ) : (
                            <ArrowUpCircle size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-stone-800 text-sm mb-0.5">
                            {trans.reason}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="font-medium">{trans.person}</span>
                            <span>•</span>
                            {trans.type === 'CASH_DROP' && (
                              <span className="bg-stone-200 px-1 rounded text-[10px] font-bold text-stone-600">
                                DROP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-black text-sm ${trans.type === 'EXPENSE' || trans.type === 'CASH_DROP' ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {trans.type === 'EXPENSE' || trans.type === 'CASH_DROP' ? '-' : '+'}
                          {formatCurrency(trans.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(trans.id, trans.type)}
                          className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleTransaction}
        isLoading={loading}
        amount={amount}
        setAmount={setAmount}
        reason={reason}
        setReason={setReason}
        person={person}
        setPerson={setPerson}
      />

      <SalesAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSubmit={handleTransaction}
        isLoading={loading}
        amount={amount}
        setAmount={setAmount}
        reason={reason}
        setReason={setReason}
        person={person}
        setPerson={setPerson}
      />

      <CashDropModal
        isOpen={isCashDropModalOpen}
        onClose={() => setIsCashDropModalOpen(false)}
        onSubmit={handleAddCashDrop}
        isLoading={loading}
      />

      {paperPosImport && (
        <>
          <PaperPosImportModal
            isOpen={isPaperPosImportModalOpen}
            onClose={() => setIsPaperPosImportModalOpen(false)}
            onImport={async (records) => {
              await paperPosImport.importRecords(records);
              setIsPaperPosImportModalOpen(false);
              onRefresh();
            }}
            importedBy={username}
          />

          {showPaperPosRecords && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-stone-200">
                  <h2 className="text-2xl font-bold text-stone-800">Paper POS Records</h2>
                  <button
                    onClick={() => setShowPaperPosRecords(false)}
                    className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <FileText className="w-6 h-6 text-stone-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <PaperPosRecordsList
                    records={paperPosImport.records}
                    unsyncedCount={paperPosImport.unsyncedRecords.length}
                    syncing={paperPosImport.syncing}
                    onSyncRecord={async (recordId) => {
                      await paperPosImport.syncRecord(recordId);
                      onRefresh();
                    }}
                    onSyncAll={async () => {
                      const results = await paperPosImport.syncAllRecords();
                      onRefresh();
                      alert(
                        `Sync complete!\nSuccess: ${results.success}\nFailed: ${results.failed}`
                      );
                    }}
                    onDeleteRecord={paperPosImport.deleteRecord}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(FinancialModule);
