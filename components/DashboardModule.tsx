
import * as React from 'react';
import { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Calendar, Clock, ArrowUpRight, List } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MenuItem, Order } from '../types';
import OrderHistoryModal from './OrderHistoryModal';

interface DashboardModuleProps {
  items: MenuItem[];
  orders?: Order[];
}

const DashboardModule: React.FC<DashboardModuleProps> = ({ items, orders = [] }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  // --- Date Helpers ---
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const isThisMonth = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // --- Top Items Algorithm ---
  const getTopItems = () => {
    // 1. Filter orders based on time
    const filteredOrders = orders.filter(order => {
      if (timeFilter === 'TODAY') return isToday(order.date);
      if (timeFilter === 'WEEK') return isThisWeek(order.date);
      if (timeFilter === 'MONTH') return isThisMonth(order.date);
      return true;
    });

    // 2. Aggregate items
    const itemMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      image: string;
      count: number;
      totalSales: number
    }>();

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        // Use item name as key to group variants together, or ID if strict
        // Using ID for now to be precise
        const key = item.id;

        const existing = itemMap.get(key);
        if (existing) {
          existing.count += item.quantity;
          existing.totalSales += item.finalPrice;
        } else {
          itemMap.set(key, {
            id: item.id,
            name: item.name,
            category: item.category,
            image: item.image,
            count: item.quantity,
            totalSales: item.finalPrice
          });
        }
      });
    });

    // 3. Convert to array and sort
    return Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topItems = getTopItems();

  // Calculate stats from real orders (Today Only)
  const todayOrders = orders.filter(order => isToday(order.date));

  const totalSales = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = todayOrders.length;
  const customers = todayOrders.reduce((acc, order) => acc + (order.discount ? order.discount.totalPax : 1), 0);
  const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  const stats = [
    { title: 'Total Sales', value: `₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', change: 'Current Session' },
    { title: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', change: 'Current Session' },
    { title: 'Customers Served', value: customers.toString(), icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-50', change: 'Current Session' },
    { title: 'Avg Order Value', value: `₱${avgOrder.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', change: 'Current Session' },
  ];

  // --- Image Helper ---
  const getSafeImage = (url?: string) => {
    if (!url || url.includes('placeholder.com')) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NjY2NiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    }
    return url;
  };

  React.useEffect(() => {
    console.log('DashboardModule mounted');
  }, []);

  return (
    <div className="flex-1 bg-stone-100 overflow-y-auto p-8 font-roboto animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-brand font-black text-stone-800">Dashboard</h1>
          <p className="text-stone-500 mt-1">Welcome back, Manager Nenita</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-stone-200 text-stone-600 text-sm font-medium">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} />
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-brand font-bold text-stone-800 mb-1">{stat.value}</div>
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart (New) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-blue-600" size={20} />
          <h3 className="font-bold text-stone-800 text-lg">Sales Overview</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(() => {
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
                return { date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), sales: dayTotal };
              });
            })()}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Popular Items */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-stone-800">Top Menu Items</h3>
            <div className="flex bg-stone-100 p-1 rounded-lg">
              {(['TODAY', 'WEEK', 'MONTH'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeFilter === filter
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                    }`}
                >
                  {filter === 'TODAY' ? 'Today' : filter === 'WEEK' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {topItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-stone-400">
                <p>No sales data for this period.</p>
              </div>
            ) : (
              topItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-stone-200 text-stone-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-transparent text-stone-400'
                    }`}>
                    {index + 1}
                  </div>
                  <img
                    src={getSafeImage(item.image)}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-stone-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getSafeImage();
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-stone-800">{item.name}</h4>
                    <p className="text-xs text-stone-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-800">{item.count} sold</div>
                    <div className="text-xs text-green-600 font-medium">₱{item.totalSales.toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-stone-800">Recent Transactions</h3>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <List size={12} /> View All
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {todayOrders.length === 0 ? (
              <div className="text-center text-stone-400 mt-10">
                <p>No transactions yet today.</p>
              </div>
            ) : (
              todayOrders.slice(0, 10).map((order, i) => (
                <div key={order.id} className="flex gap-4 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mb-1"></div>
                    <div className="w-0.5 h-full bg-stone-100"></div>
                  </div>
                  <div className="pb-2 flex-1">
                    <p className="text-sm font-bold text-stone-800">Order #{order.id}</p>
                    <p className="text-xs text-stone-500 mb-1">
                      {order.items.length} items • {order.discount ? `Discounted (${order.discount.type})` : 'Regular'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Clock size={10} />
                        <span>{order.date.split(',')[1]}</span>
                      </div>
                      <span className="font-black text-xl text-red-600">₱{(order.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={orders}
      />
    </div>
  );
};

export default DashboardModule;
