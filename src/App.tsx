import * as React from 'react';
import { useState } from 'react';
import MainSidebar from '@/components/MainSidebar';
import { useOfflineSync } from '@/hooks/useOfflineSync';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import PosPage from '@/pages/PosPage';
import StaffPage from '@/pages/StaffPage';
import FinancePage from '@/pages/FinancePage';
import BookingPage from '@/pages/BookingPage';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CASHIER' | null>('ADMIN');

  const [activeModule, setActiveModule] = useState<
    'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING'
  >('POS');

  // Offline Sync Hook - Kept at App level to persist sync state across page changes
  const { isOnline, saveOrderWithOfflineSupport, pendingOrdersCount } = useOfflineSync();

  const handleLogin = (user: { username: string; role: 'ADMIN' | 'CASHIER' }) => {
    setIsAuthenticated(true);
    setUserRole(user.role);
    // Default to POS for Cashier, Dashboard for Admin
    setActiveModule(user.role === 'CASHIER' ? 'POS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
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
        {activeModule === 'POS' && <PosPage onSaveOrder={saveOrderWithOfflineSupport} />}
        {activeModule === 'DASHBOARD' && userRole === 'ADMIN' && <DashboardPage />}
        {activeModule === 'STAFF' && <StaffPage />}
        {activeModule === 'FINANCE' && userRole === 'ADMIN' && <FinancePage />}
        {activeModule === 'BOOKING' && <BookingPage />}
      </div>
    </div>
  );
};

export default App;
