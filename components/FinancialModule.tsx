import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, Expense, SalesAdjustment } from '../types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, History, PieChart as PieChartIcon, FileText, Download, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import FinancialReportPDF from './FinancialReportPDF';



interface FinancialModuleProps {
    orders: Order[];
    expenses: Expense[];
    salesAdjustments: SalesAdjustment[];
    onRefresh: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FinancialModule: React.FC<FinancialModuleProps> = ({ orders, expenses, salesAdjustments, onRefresh }) => {
    // const [expenses, setExpenses] = useState<Expense[]>([]); // Lifted to App
    // const [salesAdjustments, setSalesAdjustments] = useState<SalesAdjustment[]>([]); // Lifted to App
    const [transactionType, setTransactionType] = useState<'EXPENSE' | 'SALES'>('EXPENSE');

    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [person, setPerson] = useState(''); // requestedBy or addedBy
    const [loading, setLoading] = useState(false);

    // useEffect(() => {
    //     fetchFinancialData();
    // }, []);

    // const fetchFinancialData = async () => { ... } // Lifted to App

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason || !person) return;

        setLoading(true);

        if (transactionType === 'EXPENSE') {
            const { error } = await supabase
                .from('expenses')
                .insert([{
                    amount: parseFloat(amount),
                    reason,
                    requested_by: person
                }]);

            if (error) {
                alert('Error adding expense');
                console.error(error);
            }
        } else {
            const { error } = await supabase
                .from('sales_adjustments')
                .insert([{
                    amount: parseFloat(amount),
                    reason,
                    added_by: person
                }]);

            if (error) {
                alert('Error adding sales adjustment');
                console.error(error);
            }
        }

        setAmount('');
        setReason('');
        setPerson('');
        setPerson('');
        onRefresh();
        setLoading(false);
    };

    const handleDeleteTransaction = async (id: string, type: 'EXPENSE' | 'SALES') => {
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;

        const table = type === 'EXPENSE' ? 'expenses' : 'sales_adjustments';
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction');
        } else {
            onRefresh();
        }
    };

    // --- Analytics Calculations ---
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const todayOrders = React.useMemo(() => orders.filter(o => isToday(o.date)), [orders]);
    const todayExpenses = React.useMemo(() => expenses.filter(e => isToday(e.date)), [expenses]);
    const todaySalesAdjustments = React.useMemo(() => salesAdjustments.filter(s => isToday(s.date)), [salesAdjustments]);

    const ordersTotal = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const adjustmentsTotal = todaySalesAdjustments.reduce((acc, s) => acc + s.amount, 0);

    const totalSales = ordersTotal + adjustmentsTotal;
    const totalExpenses = todayExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netCash = totalSales - totalExpenses;

    // Sales Trend Data (Last 7 Days)
    const salesTrendData = React.useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        return last7Days.map(date => {
            const isDateToday = date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();

            if (isDateToday) {
                return { date: date.toLocaleDateString('en-US', { weekday: 'short' }), sales: totalSales };
            }

            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.date);
                return orderDate.getDate() === date.getDate() &&
                    orderDate.getMonth() === date.getMonth() &&
                    orderDate.getFullYear() === date.getFullYear();
            });

            const dayAdjustments = salesAdjustments.filter(s => {
                const adjDate = new Date(s.date);
                return adjDate.getDate() === date.getDate() &&
                    adjDate.getMonth() === date.getMonth() &&
                    adjDate.getFullYear() === date.getFullYear();
            });

            const dayOrdersTotal = dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
            const dayAdjustmentsTotal = dayAdjustments.reduce((acc, s) => acc + s.amount, 0);

            return { date: date.toLocaleDateString('en-US', { weekday: 'short' }), sales: dayOrdersTotal + dayAdjustmentsTotal };
        });
    }, [orders, salesAdjustments, totalSales]);

    // Category Performance Data
    const categoryData = React.useMemo(() => {
        const categories: Record<string, number> = {};
        todayOrders.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || 'Other';
                categories[cat] = (categories[cat] || 0) + item.finalPrice;
            });
        });

        // Add adjustments as a separate category if needed, or just ignore for category breakdown
        // For now, we'll keep category breakdown strictly for menu items as "Manual Adjustment" isn't a menu category

        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [todayOrders]);

    const [selectedDate, setSelectedDate] = useState<string>('');

    // --- Report Generation ---
    const isSunday = () => new Date().getDay() === 0;
    const isLastDayOfMonth = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.getDate() === 1;
    };

    const generateReport = async (type: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
        const today = new Date();
        let title = '';
        let filteredOrders: Order[] = [];
        let filteredExpenses: Expense[] = [];
        let filteredAdjustments: SalesAdjustment[] = [];

        // Filter Data
        const checkDateMatch = (dateStr: string, targetDateStr: string) => {
            const d = new Date(dateStr);
            const localDate = d.getFullYear() + '-' +
                String(d.getMonth() + 1).padStart(2, '0') + '-' +
                String(d.getDate()).padStart(2, '0');
            return localDate === targetDateStr;
        };

        if (type === 'TODAY') {
            const todayStr = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');
            title = `Daily Financial Report - ${today.toLocaleDateString()}`;
            filteredOrders = orders.filter(o => checkDateMatch(o.date, todayStr));
            filteredExpenses = expenses.filter(e => checkDateMatch(e.date, todayStr));
            filteredAdjustments = salesAdjustments.filter(s => checkDateMatch(s.date, todayStr));
        } else if (type === 'WEEK') {
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            title = `Weekly Financial Report - ${oneWeekAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`;
            filteredOrders = orders.filter(o => new Date(o.date) >= oneWeekAgo);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
            filteredAdjustments = salesAdjustments.filter(s => new Date(s.date) >= oneWeekAgo);
        } else if (type === 'MONTH') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            title = `Monthly Financial Report - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
            filteredOrders = orders.filter(o => new Date(o.date) >= firstDay);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= firstDay);
            filteredAdjustments = salesAdjustments.filter(s => new Date(s.date) >= firstDay);
        } else if (type === 'CUSTOM' && selectedDate) {
            const dateObj = new Date(selectedDate);
            title = `Financial Report - ${dateObj.toLocaleDateString()}`;
            filteredOrders = orders.filter(o => checkDateMatch(o.date, selectedDate));
            filteredExpenses = expenses.filter(e => checkDateMatch(e.date, selectedDate));
            filteredAdjustments = salesAdjustments.filter(s => checkDateMatch(s.date, selectedDate));
        }

        const blob = await pdf(
            <FinancialReportPDF
                orders={filteredOrders}
                expenses={filteredExpenses}
                salesAdjustments={filteredAdjustments}
                title={title}
            />
        ).toBlob();

        const filenameDate = type === 'CUSTOM' ? selectedDate : today.toISOString().split('T')[0];
        saveAs(blob, `Financial_Report_${type}_${filenameDate}.pdf`);
    };

    // Combine transactions for the list
    const recentTransactions = React.useMemo(() => {
        const combined = [
            ...todayExpenses.map(e => ({ ...e, type: 'EXPENSE' as const, person: e.requested_by })),
            ...todaySalesAdjustments.map(s => ({ ...s, type: 'SALES' as const, person: s.added_by }))
        ];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [todayExpenses, todaySalesAdjustments]);

    return (
        <div className="h-full w-full bg-stone-100 overflow-y-auto p-6 font-roboto animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-stone-800 tracking-tight">Financial Analysis</h1>
                        <p className="text-stone-500 font-medium">Cash Management & Sales Analytics</p>
                    </div>
                </div>

                {/* Report Generation Buttons */}
                <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-sm mr-2">
                        <span className="text-xs font-bold text-stone-500 uppercase">Date:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-bold text-stone-700 focus:outline-none"
                        />
                        <button
                            onClick={() => generateReport('CUSTOM')}
                            disabled={!selectedDate}
                            className="p-1 hover:bg-stone-100 rounded-md text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate Report for Selected Date"
                        >
                            <Download size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => generateReport('TODAY')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-50 transition-colors shadow-sm"
                    >
                        <FileText size={16} />
                        Today
                    </button>
                    <button
                        onClick={() => generateReport('WEEK')}
                        disabled={!isSunday()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isSunday() ? "Available only on Sundays" : "Generate Weekly Report"}
                    >
                        <FileText size={16} />
                        This Week
                    </button>
                    <button
                        onClick={() => generateReport('MONTH')}
                        disabled={!isLastDayOfMonth()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isLastDayOfMonth() ? "Available only on last day of month" : "Generate Monthly Report"}
                    >
                        <FileText size={16} />
                        This Month
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">Total Gross Sales</p>
                        <h3 className="text-3xl font-black text-stone-800">₱{totalSales.toLocaleString()}</h3>
                        {adjustmentsTotal > 0 && (
                            <p className="text-xs text-green-600 font-bold mt-1">
                                +₱{adjustmentsTotal.toLocaleString()} from adjustments
                            </p>
                        )}
                    </div>
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
                    <div>
                        <p className="text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">Total Expenses</p>
                        <h3 className="text-3xl font-black text-red-600">₱{totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-red-100 text-red-600 rounded-full">
                        <TrendingDown size={24} />
                    </div>
                </div>

                <div className="bg-stone-800 p-6 rounded-2xl shadow-lg flex items-center justify-between text-white">
                    <div>
                        <p className="text-stone-400 font-bold text-xs uppercase tracking-wider mb-1">Net Cash on Hand</p>
                        <h3 className="text-3xl font-black">₱{netCash.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-stone-700 rounded-full text-yellow-400">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Charts (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Sales Trend Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="text-blue-600" size={20} />
                            <h3 className="font-bold text-stone-800 text-lg">Sales Trend (Last 7 Days)</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₱${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Sales']}
                                    />
                                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
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
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `₱${value.toLocaleString()}`} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Right Column: Cash Management (1/3 width) */}
                <div className="space-y-6">

                    {/* Transaction Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                        <h3 className="font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
                            <Plus className={transactionType === 'EXPENSE' ? "text-red-600" : "text-green-600"} size={20} />
                            Record Transaction
                        </h3>

                        {/* Type Toggle */}
                        <div className="flex p-1 bg-stone-100 rounded-xl mb-4">
                            <button
                                onClick={() => setTransactionType('EXPENSE')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${transactionType === 'EXPENSE'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                Expense
                            </button>
                            <button
                                onClick={() => setTransactionType('SALES')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${transactionType === 'SALES'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                Add to Sales
                            </button>
                        </div>

                        <form onSubmit={handleTransaction} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₱</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={`w-full pl-8 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 font-bold text-stone-800 ${transactionType === 'EXPENSE' ? 'focus:ring-red-500' : 'focus:ring-green-500'
                                            }`}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 text-sm ${transactionType === 'EXPENSE' ? 'focus:ring-red-500' : 'focus:ring-green-500'
                                        }`}
                                    placeholder={transactionType === 'EXPENSE' ? "e.g. Supplies, Cash Pull" : "e.g. Cash Adjustment, Late Entry"}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                                    {transactionType === 'EXPENSE' ? 'Requested By' : 'Added By'}
                                </label>
                                <input
                                    type="text"
                                    value={person}
                                    onChange={(e) => setPerson(e.target.value)}
                                    className={`w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 text-sm ${transactionType === 'EXPENSE' ? 'focus:ring-red-500' : 'focus:ring-green-500'
                                        }`}
                                    placeholder="Name"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full text-white py-3 rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50 ${transactionType === 'EXPENSE'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {loading ? 'Recording...' : (transactionType === 'EXPENSE' ? 'Record Expense' : 'Add to Sales')}
                            </button>
                        </form>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex-1">
                        <h3 className="font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
                            <History className="text-stone-400" size={20} />
                            Recent Transactions
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {recentTransactions.length === 0 ? (
                                <p className="text-center text-stone-400 text-sm py-4">No transactions today</p>
                            ) : (
                                recentTransactions.map((trans, idx) => (
                                    <div key={trans.id || idx} className="flex justify-between items-start p-3 bg-stone-50 rounded-lg border border-stone-100 group">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 ${trans.type === 'EXPENSE' ? 'text-red-500' : 'text-green-500'}`}>
                                                {trans.type === 'EXPENSE' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-stone-800 text-sm">{trans.reason}</p>
                                                <p className="text-xs text-stone-500">
                                                    {trans.type === 'EXPENSE' ? 'By: ' : 'Added by: '}{trans.person} • {new Date(trans.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-sm ${trans.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                                                {trans.type === 'EXPENSE' ? '-' : '+'}₱{trans.amount.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteTransaction(trans.id, trans.type)}
                                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Transaction"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FinancialModule;
