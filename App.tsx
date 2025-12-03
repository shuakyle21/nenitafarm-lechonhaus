import * as React from 'react';
import { useState, useEffect } from 'react';
import MainSidebar from './components/MainSidebar';
import PosModule from './components/PosModule';
import DashboardModule from './components/DashboardModule';
// import { MENU_ITEMS } from './constants'; // No longer needed as initial state
import { MenuItem, Order, Staff, OrderType, Expense, SalesAdjustment } from './types';
import { supabase } from './lib/supabase';
import StaffModule from './components/StaffModule';
import FinancialModule from './components/FinancialModule';
import BookingModule from './components/BookingModule';
import LoginModule from './components/LoginModule';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CASHIER' | null>('ADMIN');

  const [activeModule, setActiveModule] = useState<'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING'>('POS');

  // Lifted Menu State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Order History State
  const [orders, setOrders] = useState<Order[]>([]);

  // Staff State
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Financial State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesAdjustments, setSalesAdjustments] = useState<SalesAdjustment[]>([]);

  // Helper for daily count
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const todayOrderCount = orders.filter(o => isToday(o.date)).length;

  // Fetch Menu Items on Mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMenuItems();
      fetchOrders();
      fetchStaff();
      fetchFinancialData();
    }
  }, [isAuthenticated]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        // Map DB fields to MenuItem type if necessary (e.g. snake_case to camelCase)
        // Assuming DB columns match MenuItem interface for simplicity, 
        // or we map them here.
        // DB: is_weighted -> Type: isWeighted
        const mappedItems: MenuItem[] = data.map(item => ({
          ...item,
          isWeighted: item.is_weighted, // Map snake_case from DB to camelCase in App
        }));
        setMenuItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (
              name,
              category,
              image
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedOrders: Order[] = data.map(order => ({
          id: order.id,
          date: order.created_at,
          items: order.order_items.map((item: any) => ({
            id: item.menu_item_id,
            name: item.menu_items?.name || 'Unknown Item',
            price: item.price_at_time,
            quantity: item.quantity,
            finalPrice: item.weight ? (item.price_at_time * item.weight) : (item.price_at_time * item.quantity),
            category: item.menu_items?.category || 'Short Orders',
            image: item.menu_items?.image || '',
            cartId: item.id, // Use order_item id as cartId for display purposes
            weight: item.weight
          })),
          subtotal: order.total_amount, // Simplified
          discount: order.discount_details,
          total: order.total_amount,
          cash: order.cash,
          change: order.change,
          orderType: order.order_type as OrderType, // Map from DB column to TS property
          orderNumber: order.order_number
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      if (error) throw error;
      if (data) setStaffList(data as Staff[]);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchFinancialData = async () => {
    try {
      const expensesPromise = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      const salesPromise = supabase
        .from('sales_adjustments')
        .select('*')
        .order('date', { ascending: false });

      const [expensesRes, salesRes] = await Promise.all([expensesPromise, salesPromise]);

      if (expensesRes.error) console.error('Error fetching expenses:', expensesRes.error);
      else setExpenses(expensesRes.data || []);

      if (salesRes.error) console.error('Error fetching sales adjustments:', salesRes.error);
      else setSalesAdjustments(salesRes.data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  // Menu Management Handlers
  const handleAddItem = async (item: MenuItem) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: item.name,
          price: item.price,
          category: item.category,
          image: item.image,
          is_weighted: item.isWeighted,
          description: item.description,
          available: true
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMenuItems(prev => [...prev, { ...item, id: data.id }]);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleUpdateItem = async (updatedItem: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: updatedItem.name,
          price: updatedItem.price,
          category: updatedItem.category,
          image: updatedItem.image,
          is_weighted: updatedItem.isWeighted,
          description: updatedItem.description
        })
        .eq('id', updatedItem.id);

      if (error) throw error;

      setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  // Order Handler
  const handleSaveOrder = async (order: Order) => {
    try {
      // 1. Insert into orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          total_amount: order.total,
          status: 'completed',
          payment_method: 'cash', // Defaulting to cash for now
          discount_details: order.discount,
          cash: order.cash,
          change: order.change,
          order_type: order.orderType || 'DINE_IN',
          delivery_address: order.deliveryAddress,
          delivery_time: order.deliveryTime,
          contact_number: order.contactNumber
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      // 2. Insert into order_items table
      const orderItems = order.items.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price, // or finalPrice / quantity
        weight: item.weight
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Prepend new order to history (with the generated ID)
      setOrders(prev => [{ ...order, id: orderId, orderNumber: orderData.order_number }, ...prev]);
      alert('Order saved successfully!');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
    }
  };

  const handleLogin = (user: { username: string; role: 'ADMIN' | 'CASHIER' }) => {
    setIsAuthenticated(true);
    setUserRole(user.role);
    // Default to POS for Cashier, Dashboard for Admin
    setActiveModule(user.role === 'CASHIER' ? 'POS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setOrders([]);
    setMenuItems([]);
    setStaffList([]);
  };

  if (!isAuthenticated) {
    return <LoginModule onLogin={handleLogin} />;
  }

  if (loading && isAuthenticated) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-full w-full bg-stone-100 overflow-hidden font-roboto">
      {/* System Sidebar */}
      <MainSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        userRole={userRole}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {activeModule === 'POS' && (
          <PosModule
            items={menuItems}
            orderCount={todayOrderCount}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onSaveOrder={handleSaveOrder}
            staffList={staffList}
          />
        )}
        {activeModule === 'DASHBOARD' && userRole === 'ADMIN' && (
          <DashboardModule
            items={menuItems}
            orders={orders}
            salesAdjustments={salesAdjustments}
            expenses={expenses}
          />
        )}
        {activeModule === 'STAFF' && (
          <StaffModule />
        )}
        {activeModule === 'FINANCE' && userRole === 'ADMIN' && (
          <FinancialModule
            orders={orders}
            expenses={expenses}
            salesAdjustments={salesAdjustments}
            onRefresh={fetchFinancialData}
          />
        )}
        {activeModule === 'BOOKING' && <BookingModule items={menuItems} />}
      </div>
    </div>
  );
};



export default App;