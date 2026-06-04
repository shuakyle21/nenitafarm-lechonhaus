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

type Auth = { isAuthenticated: boolean; userRole: 'ADMIN' | 'CASHIER' | null; username: string; userId: string | null };
const AUTH_INITIAL: Auth = { isAuthenticated: false, userRole: null, username: '', userId: null };

const App: React.FC = () => {
  const [auth, setAuth] = useState<Auth>(AUTH_INITIAL);

  const [activeModule, setActiveModule] = useState<
    'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING'
  >('POS');

  // Offline Sync Hook - Kept at App level to persist sync state across page changes
  const { isOnline, saveOrderWithOfflineSupport, pendingOrdersCount } = useOfflineSync(auth.userId);

  const handleLogin = (user: { id: string; username: string; role: 'ADMIN' | 'CASHIER' }) => {
    setAuth({ isAuthenticated: true, userRole: user.role, username: user.username, userId: user.id });
    // Default to POS for Cashier, Dashboard for Admin
    setActiveModule(user.role === 'CASHIER' ? 'POS' : 'DASHBOARD');
  };

  const handleLogout = () => {
    setAuth(AUTH_INITIAL);
  };

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-full w-full bg-stone-100 overflow-hidden font-roboto">
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <MainSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        userRole={auth.userRole}
        onLogout={handleLogout}
        isOnline={isOnline}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Content Area - with bottom padding on mobile for nav, top safe area for notch */}
      <div
        className="flex-1 h-full overflow-hidden flex flex-col lg:pb-0"
        style={{
          paddingBottom: 'calc(var(--mobile-nav-height, 4rem) + var(--safe-area-bottom, 0px))',
          paddingTop: 'var(--safe-area-top, 0px)',
        }}
      >
        {/* Render modules based on access control */}
        {activeModule === 'POS' && (
          <PosPage onSaveOrder={saveOrderWithOfflineSupport} isOnline={isOnline} />
        )}

        {activeModule === 'BOOKING' && (
          <BookingPage />
        )}

        {/* Admin only modules */}
        {auth.userRole === 'ADMIN' && (
          <>
            {activeModule === 'DASHBOARD' && <DashboardPage username={auth.username} />}
            {activeModule === 'STAFF' && <StaffPage />}
            {activeModule === 'FINANCE' && <FinancePage username={auth.username} userId={auth.userId} />}
          </>
        )}

        {/* Fallback for Cashier attempting to access restricted modules via direct state manipulation */}
        {auth.userRole === 'CASHIER' && !['POS', 'BOOKING'].includes(activeModule) && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50">
            <h3 className="text-xl font-bold text-stone-800 mb-2">Access Restricted</h3>
            <p className="text-stone-500 mb-6">You don't have permission to access this module.</p>
            <button type="button"
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
        userRole={auth.userRole}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;
