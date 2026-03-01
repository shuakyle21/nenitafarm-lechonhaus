import * as React from 'react';
import { useState } from 'react';
import MainSidebar from '@/components/MainSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
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
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <MainSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        userRole={userRole}
        onLogout={handleLogout}
        isOnline={isOnline}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Content Area - with bottom padding on mobile for nav */}
      <div 
        className="flex-1 h-full overflow-hidden flex flex-col lg:pb-0"
        style={{ paddingBottom: 'calc(var(--mobile-nav-height, 4rem) + var(--safe-area-bottom, 0px))' }}
      >
        {/* Render modules based on access control */}
        {activeModule === 'POS' && (
          <PosPage onSaveOrder={saveOrderWithOfflineSupport} isOnline={isOnline} />
        )}
        
        {activeModule === 'BOOKING' && (
          <BookingPage />
        )}

        {/* Admin only modules */}
        {userRole === 'ADMIN' && (
          <>
            {activeModule === 'DASHBOARD' && <DashboardPage username={username} />}
            {activeModule === 'STAFF' && <StaffPage />}
            {activeModule === 'FINANCE' && <FinancePage username={username} userId={userId} />}
            {activeModule === 'INVENTORY' && <InventoryPage userId={userId} />}
            {activeModule === 'AUDIT' && <AuditPage />}
          </>
        )}

        {/* Fallback for Cashier attempting to access restricted modules via direct state manipulation */}
        {userRole === 'CASHIER' && !['POS', 'BOOKING'].includes(activeModule) && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50">
            <h3 className="text-xl font-bold text-stone-800 mb-2">Access Restricted</h3>
            <p className="text-stone-500 mb-6">You don't have permission to access this module.</p>
            <button 
              onClick={() => setActiveModule('POS')}
              className="px-6 py-2 bg-red-800 text-white rounded-lg font-bold shadow-md hover:bg-red-700 transition-colors"
            >
              Return to POS
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <MobileBottomNav
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        userRole={userRole}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;
