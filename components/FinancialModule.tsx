import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, History, PieChart as PieChartIcon, FileText, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import FinancialReportPDF from './FinancialReportPDF';

interface Expense {
    id: string;
    amount: number;
    reason: string;
    requested_by: string;
    date: string;
}

interface FinancialModuleProps {
    orders: Order[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FinancialModule: React.FC<FinancialModuleProps> = ({ orders }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [requestedBy, setRequestedBy] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching expenses:', error);
        } else {
            setExpenses(data || []);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !reason || !requestedBy) return;

        setLoading(true);
        const { error } = await supabase
            .from('expenses')
            .insert([
                {
                    amount: parseFloat(amount),
                    reason,
                    requested_by: requestedBy
                }
            ]);

        if (error) {
            alert('Error adding expense');
            console.error(error);
        } else {
            setAmount('');
            setReason('');
            setRequestedBy('');
            fetchExpenses();
        }
        setLoading(false);
    };

    // --- Analytics Calculations ---
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

    const totalSales = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
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
            const dayTotal = dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
            return { date: date.toLocaleDateString('en-US', { weekday: 'short' }), sales: dayTotal };
        });
    }, [orders, totalSales]);

    // Category Performance Data
    const categoryData = React.useMemo(() => {
        const categories: Record<string, number> = {};
        todayOrders.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || 'Other';
                categories[cat] = (categories[cat] || 0) + item.finalPrice;
            });
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [todayOrders]);

    // --- Report Generation ---
    const isSunday = () => new Date().getDay() === 0;
    const isLastDayOfMonth = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.getDate() === 1;
    };

    const generateReport = async (type: 'TODAY' | 'WEEK' | 'MONTH') => {
        const today = new Date();
        let title = '';
        let filteredOrders: Order[] = [];
        let filteredExpenses: Expense[] = [];

        // Filter Data
        if (type === 'TODAY') {
            const dateStr = today.toISOString().split('T')[0];
            title = `Daily Financial Report - ${today.toLocaleDateString()}`;
            filteredOrders = orders.filter(o => o.date.startsWith(dateStr));
            filteredExpenses = expenses.filter(e => e.date.startsWith(dateStr));
        } else if (type === 'WEEK') {
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            title = `Weekly Financial Report - ${oneWeekAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`;
            filteredOrders = orders.filter(o => new Date(o.date) >= oneWeekAgo);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
        } else if (type === 'MONTH') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            title = `Monthly Financial Report - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
            filteredOrders = orders.filter(o => new Date(o.date) >= firstDay);
            filteredExpenses = expenses.filter(e => new Date(e.date) >= firstDay);
        }

        const blob = await pdf(
            <FinancialReportPDF
                orders={filteredOrders}
                expenses={filteredExpenses}
                title={title}
            />
        ).toBlob();

        saveAs(blob, `Financial_Report_${type}_${today.toISOString().split('T')[0]}.pdf`);
    };

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
                <div className="flex gap-2">
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

                    {/* Expense Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                        <h3 className="font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
                            <Plus className="text-red-600" size={20} />
                            Record Expense / Withdrawal
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₱</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-stone-800"
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
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                    placeholder="e.g. Supplies, Cash Pull"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Requested By</label>
                                <input
                                    type="text"
                                    value={requestedBy}
                                    onChange={(e) => setRequestedBy(e.target.value)}
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                    placeholder="Name"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Recording...' : 'Record Expense'}
                            </button>
                        </form>
                    </div>

                    {/* Recent Expenses List */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex-1">
                        <h3 className="font-bold text-stone-800 text-lg mb-4 flex items-center gap-2">
                            <History className="text-stone-400" size={20} />
                            Recent Transactions
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {todayExpenses.length === 0 ? (
                                <p className="text-center text-stone-400 text-sm py-4">No expenses recorded today</p>
                            ) : (
                                todayExpenses.map(exp => (
                                    <div key={exp.id} className="flex justify-between items-start p-3 bg-stone-50 rounded-lg border border-stone-100">
                                        <div>
                                            <p className="font-bold text-stone-800 text-sm">{exp.reason}</p>
                                            <p className="text-xs text-stone-500">By: {exp.requested_by} • {new Date(exp.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className="font-bold text-red-600 text-sm">-₱{exp.amount.toLocaleString()}</span>
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
