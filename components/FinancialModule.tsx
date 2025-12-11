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

import { checkDateMatch, getLocalDateString } from '../lib/dateUtils';
import { exportToCSV } from '../lib/exportUtils';


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
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // --- Report Generation ---
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
        } else if (type === 'CUSTOM') {
           if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the entire end day

                title = `Financial Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
                
                filteredOrders = orders.filter(o => {
                    const d = new Date(o.date);
                    return d >= start && d <= end;
                });
                filteredExpenses = expenses.filter(e => {
                    const d = new Date(e.date);
                    return d >= start && d <= end;
                });
                filteredAdjustments = salesAdjustments.filter(s => {
                    const d = new Date(s.date);
                    return d >= start && d <= end;
                });
            } else if (selectedDate) {
                 // Fallback to single date if only selectedDate is used (legacy support or single day pick)
                const dateObj = new Date(selectedDate);
                title = `Financial Report - ${dateObj.toLocaleDateString()}`;
                filteredOrders = orders.filter(o => checkDateMatch(o.date, selectedDate));
                filteredExpenses = expenses.filter(e => checkDateMatch(e.date, selectedDate));
                filteredAdjustments = salesAdjustments.filter(s => checkDateMatch(s.date, selectedDate));
            }
        }
        
        return { filteredOrders, filteredExpenses, filteredAdjustments, title };
    };

    const generateReport = async (type: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
        const { filteredOrders, filteredExpenses, filteredAdjustments, title } = getFilteredData(type);
        
        if (type === 'CUSTOM' && !startDate && !endDate && !selectedDate) {
             alert("Please select a date or date range.");
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
             filenameDate = startDate && endDate ? `${startDate}_to_${endDate}` : selectedDate;
        }

        saveAs(blob, `Financial_Report_${type}_${filenameDate}.pdf`);
    };

    const handleExport = (type: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM') => {
         const { filteredOrders, filteredExpenses, filteredAdjustments } = getFilteredData(type);

          if (type === 'CUSTOM' && !startDate && !endDate && !selectedDate) {
             alert("Please select a date or date range.");
             return;
        }

         // Export Orders
         if (filteredOrders.length > 0) {
             const ordersData = filteredOrders.map(o => ({
                 Date: new Date(o.date).toLocaleDateString(),
                 OrderId: o.id || 'N/A',
                 Total: o.total,
                 Items: o.items.map(i => `${i.name} (x${i.quantity})`).join('; ')
             }));
             exportToCSV(ordersData, `Orders_${type}_${new Date().toISOString().split('T')[0]}.csv`);
         }

          // Export Expenses
         if (filteredExpenses.length > 0) {
             const expensesData = filteredExpenses.map(e => ({
                 Date: new Date(e.date).toLocaleDateString(),
                 Category: 'Expense',
                 Reason: e.reason,
                 Amount: e.amount,
                 RequestedBy: e.requested_by
             }));
             exportToCSV(expensesData, `Expenses_${type}_${new Date().toISOString().split('T')[0]}.csv`);
         }
         
         // Export Adjustments
         if (filteredAdjustments.length > 0) {
             const adjData = filteredAdjustments.map(a => ({
                 Date: new Date(a.date).toLocaleDateString(),
                 Category: 'Adjustment',
                 Reason: a.reason,
                 Amount: a.amount,
                 AddedBy: a.added_by
             }));
             exportToCSV(adjData, `Adjustments_${type}_${new Date().toISOString().split('T')[0]}.csv`);
         }

         if (filteredOrders.length === 0 && filteredExpenses.length === 0 && filteredAdjustments.length === 0) {
             alert('No data to export for this period.');
         }
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
            <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                        <Wallet size={24} />
                    </div>
                    <div className="font-roboto animate-in fade-in duration-300">
                        <h1 className="text-3xl font-brand font-black text-stone-800 tracking-tight">Financial Analysis</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">Total Gross Sales</p>
                        <h3 className="text-3xl font-brand font-black text-stone-800 tracking-tight">₱{totalSales.toLocaleString()}</h3>
                        {adjustmentsTotal > 0 && (
                            <p className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                +₱{adjustmentsTotal.toLocaleString()} adjustments
                            </p>
                        )}
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between hover:shadow-md transition-all">
                    <div>
                        <p className="text-stone-500 font-bold text-xs uppercase tracking-wider mb-1">Total Expenses</p>
                        <h3 className="text-3xl font-brand font-black text-red-600 tracking-tight">₱{totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <TrendingDown size={24} />
                    </div>
                </div>

                <div className="bg-stone-800 p-6 rounded-2xl shadow-lg flex items-center justify-between text-white hover:shadow-xl transition-all border border-stone-700">
                    <div>
                        <p className="text-stone-400 font-bold text-xs uppercase tracking-wider mb-1">Net Cash on Hand</p>
                        <h3 className="text-3xl font-brand font-black tracking-tight">₱{netCash.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-stone-700/50 rounded-xl text-yellow-400 border border-stone-600">
                        <DollarSign size={24} />
                    </div>
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
                            <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-md">Last 7 Days</span>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} tickFormatter={(value) => `₱${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Sales']}
                                        labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                                    />
                                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
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
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="right"
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-bold text-stone-600 ml-1">{value}</span>}
                                    />
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
                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 flex-1 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                                <History className="text-stone-400" size={20} />
                                Recent Transactions
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {recentTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-stone-400">
                                    <p className="font-medium">No transactions found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {recentTransactions.map((trans, idx) => (
                                        <div key={trans.id || idx} className="flex justify-between items-center p-4 hover:bg-stone-50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    trans.type === 'EXPENSE' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                                                }`}>
                                                    {trans.type === 'EXPENSE' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-stone-800 text-sm mb-0.5">{trans.reason}</p>
                                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                                        <span className="font-medium">{trans.type === 'EXPENSE' ? 'By: ' : 'Added by: '}{trans.person}</span>
                                                        <span>•</span>
                                                        <span>{new Date(trans.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-black text-sm ${trans.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {trans.type === 'EXPENSE' ? '-' : '+'}₱{trans.amount.toLocaleString()}
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
        </div>
    );
};

export default FinancialModule;
