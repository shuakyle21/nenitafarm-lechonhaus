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
import InventoryPage from '@/pages/InventoryPage';
import AuditPage from '@/pages/AuditPage';

const App: React.FC = () => {
  // Auth State - Default to false for security (requires login)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'CASHIER' | null>(null);
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  const [activeModule, setActiveModule] = useState<
    'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT'
  >('POS');

  // Offline Sync Hook - Kept at App level to persist sync state across page changes
  const { isOnline, saveOrderWithOfflineSupport, pendingOrdersCount } = useOfflineSync(userId);

  const handleLogin = (user: { id: string; username: string; role: 'ADMIN' | 'CASHIER' }) => {
    setIsAuthenticated(true);
    setUserRole(user.role);
    setUsername(user.username);
    setUserId(user.id);
    // Default to POS for Cashier, Dashboard for Admin
    setActiveModule(user.role === 'CASHIER' ? 'POS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername('');
    setUserId(null);
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
        {activeModule === 'DASHBOARD' && userRole === 'ADMIN' && <DashboardPage username={username} />}
        {activeModule === 'STAFF' && <StaffPage />}
        {activeModule === 'FINANCE' && userRole === 'ADMIN' && <FinancePage username={username} userId={userId} />}
        {activeModule === 'BOOKING' && <BookingPage />}
        {activeModule === 'INVENTORY' && userRole === 'ADMIN' && <InventoryPage userId={userId} />}
        {activeModule === 'AUDIT' && userRole === 'ADMIN' && <AuditPage />}
      </div>
    </div>
  );
};

export default App;
