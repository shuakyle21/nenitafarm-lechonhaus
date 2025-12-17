import * as React from 'react';
import { useState } from 'react';
import MainSidebar from '@/components/MainSidebar';
import PosModule from '@/components/PosModule';
import DashboardModule from '@/components/DashboardModule';
import { Order } from '@/types';
import StaffModule from '@/components/StaffModule';
import FinancialModule from '@/components/FinancialModule';
import BookingModule from '@/components/BookingModule';
import LoginModule from '@/components/LoginModule';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useMenu } from '@/hooks/useMenu';
import { useOrders } from '@/hooks/useOrders';
import { useStaff } from '@/hooks/useStaff';
import { useFinancials } from '@/hooks/useFinancials';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CASHIER' | null>('ADMIN');

  const [activeModule, setActiveModule] = useState<
    'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING'
  >('POS');

  // Hooks
  const {
    menuItems,
    loading: menuLoading,
    addItem,
    updateItem,
    deleteItem,
  } = useMenu(isAuthenticated);
  const { orders, setOrders, deleteOrder } = useOrders(isAuthenticated);
  const { staffList } = useStaff(isAuthenticated);
  const { expenses, salesAdjustments, refreshFinancials } = useFinancials(isAuthenticated);

  // Offline Sync Hook
  const { isOnline, saveOrderWithOfflineSupport, pendingOrdersCount } = useOfflineSync();

  // Helper for daily count
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todayOrderCount = orders.filter((o) => isToday(o.date)).length;

  // Order Handler
  const handleSaveOrder = async (order: Order) => {
    try {
      const result = await saveOrderWithOfflineSupport(order);

      if (result.success) {
        if (result.mode === 'ONLINE') {
          // Update local state with the returned real data
          setOrders((prev) => [result.data, ...prev]);
          alert('Order saved successfully!');
        } else {
          alert('Offline: Order saved to local backup. Will sync when online.');
        }
      }
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
    // Hooks will naturally reset/refetch when isAuthenticated becomes true again
  };

  if (!isAuthenticated) {
    return <LoginModule onLogin={handleLogin} />;
  }

  if (menuLoading && isAuthenticated) {
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
        isOnline={isOnline}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {activeModule === 'POS' && (
          <PosModule
            items={menuItems}
            orderCount={todayOrderCount}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
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
            onDeleteOrder={async (id) => {
              if (!window.confirm('Are you sure you want to delete this order permanently?'))
                return;
              try {
                await deleteOrder(id);
                alert('Order deleted successfully');
              } catch (err) {
                console.error('Error deleting order:', err);
                alert('Failed to delete order');
              }
            }}
          />
        )}
        {activeModule === 'STAFF' && <StaffModule />}
        {activeModule === 'FINANCE' && userRole === 'ADMIN' && (
          <FinancialModule
            orders={orders}
            expenses={expenses}
            salesAdjustments={salesAdjustments}
            onRefresh={refreshFinancials}
          />
        )}
        {activeModule === 'BOOKING' && <BookingModule items={menuItems} />}
      </div>
    </div>
  );
};

export default App;
