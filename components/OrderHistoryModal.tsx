
import * as React from 'react';
import { useState, useMemo } from 'react';
import { Order, CartItem } from '../types';
import { X, Search, FileText, Calendar, Clock, Utensils, ShoppingBag, Printer } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import { isToday, isYesterday, isThisWeek, isThisMonth } from '../lib/dateUtils';

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
    onDeleteOrder?: (id: string) => Promise<void>;
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, orders, onDeleteOrder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Memoize filtered orders to avoid recalculation on every render
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = (order.orderNumber?.toString() || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.date.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesTime = true;
            if (timeFilter === 'TODAY') matchesTime = isToday(order.date);
            else if (timeFilter === 'YESTERDAY') matchesTime = isYesterday(order.date);
            else if (timeFilter === 'WEEK') matchesTime = isThisWeek(order.date);
            else if (timeFilter === 'MONTH') matchesTime = isThisMonth(order.date);
            else if (timeFilter === 'ALL') matchesTime = true;

            return matchesSearch && matchesTime;
        });
    }, [orders, searchQuery, timeFilter]);

    // Memoize total revenue calculation
    const totalRevenue = useMemo(() => {
        return filteredOrders.reduce((acc, o) => acc + o.total, 0);
    }, [filteredOrders]);

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatItemString = (item: CartItem) => {
        if (item.weight) {
            // Strip default unit from name if present for cleaner display
            const cleanName = item.name.replace(' (1 Kilo)', '');

            const weightInGrams = item.weight * 1000;
            const weightStr = weightInGrams < 1000
                ? `${Math.round(weightInGrams)}g`
                : `${item.weight.toFixed(2)}kg`;

            return `${item.quantity}x ${cleanName} (${weightStr})`;
        }
        return `${item.quantity}x ${item.name}`;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-stone-900 text-white p-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-stone-800 p-2 rounded-lg">
                            <FileText size={24} className="text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wide">Transaction History</h2>
                            <p className="text-xs text-stone-400">Total Records: {orders.length}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-700 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-white border-b border-stone-200 flex flex-col gap-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'ALL'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setTimeFilter(filter)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${timeFilter === filter
                                    ? 'bg-stone-800 text-white shadow-md'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                    }`}
                            >
                                {filter === 'TODAY' ? 'Today' :
                                    filter === 'YESTERDAY' ? 'Yesterday' :
                                        filter === 'WEEK' ? 'Last 7 Days' :
                                            filter === 'MONTH' ? 'Last 30 Days' : 'All Time'}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search Order # or Date..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500"
                            />
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Revenue</div>
                            <div className="text-2xl font-brand font-black text-green-700">
                                {formatCurrency(totalRevenue)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-stone-50 p-4">
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-stone-100 text-stone-600 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="p-4 border-b border-stone-200">Order ID</th>
                                    <th className="p-4 border-b border-stone-200">Date & Time</th>
                                    <th className="p-4 border-b border-stone-200">Type</th>
                                    <th className="p-4 border-b border-stone-200">Items Summary</th>
                                    <th className="p-4 border-b border-stone-200 text-right">Subtotal</th>
                                    <th className="p-4 border-b border-stone-200 text-right">Discount</th>
                                    <th className="p-4 border-b border-stone-200 text-right">Total</th>
                                    <th className="p-4 border-b border-stone-200 text-center">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-sm">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-stone-400">
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-stone-800">#{order.orderNumber || order.id.substring(0, 8)}</td>
                                            <td className="p-4 text-stone-600">
                                                <div className="flex flex-col">
                                                    <span className="flex items-center gap-1 font-bold text-stone-700">
                                                        <Calendar size={12} /> {new Date(order.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs mt-0.5">
                                                        <Clock size={12} /> {new Date(order.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {order.orderType === 'TAKEOUT' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                                                        <ShoppingBag size={12} /> Takeout
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                                                        <Utensils size={12} /> Dine-in
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-stone-600">
                                                <div className="max-w-[300px] whitespace-normal font-medium">
                                                    {order.items.map(formatItemString).join(', ')}
                                                </div>
                                                <div className="text-xs text-stone-400 mt-1">
                                                    {order.items.length} items total
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-medium text-stone-600">
                                                {formatCurrency(order.subtotal)}
                                            </td>
                                            <td className="p-4 text-right text-red-600">
                                                {order.discount ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold">20% ({order.discount.type})</span>
                                                        <span className="text-[10px]">On {order.discount.numberOfIds}/{order.discount.totalPax} pax</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-300">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-black text-stone-800 text-lg" data-testid={`order-total-${order.id}`}>
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors"
                                                    title="View Receipt"
                                                    data-testid={`view-receipt-${order.id}`}
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                {onDeleteOrder && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteOrder(order.id);
                                                        }}
                                                        className="p-2 ml-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                                                        title="Delete Order"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <ReceiptModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                existingOrder={selectedOrder}
            />
        </div>
    );
};

export default OrderHistoryModal;
