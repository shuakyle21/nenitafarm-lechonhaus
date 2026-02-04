import * as React from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  Settings,
  LogOut,
  Users,
  PieChart,
  Calendar,
  Wifi,
  WifiOff,
  ClipboardList
} from 'lucide-react';

interface MainSidebarProps {
  activeModule: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT';
  onModuleChange: (module: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT') => void;
  userRole: 'ADMIN' | 'CASHIER' | null;
  onLogout: () => void;
  isOnline?: boolean;
  pendingOrdersCount?: number;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  activeModule,
  onModuleChange,
  userRole,
  onLogout,
  isOnline = true,
  pendingOrdersCount = 0,
}) => {
  return (
    <div className="hidden lg:flex w-24 bg-stone-950 flex-col items-center py-6 text-stone-500 shadow-2xl z-50 border-r border-stone-900">
      {/* Brand Icon */}
      <div className="mb-8 w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-600 to-red-800 p-0.5 shadow-lg shadow-red-900/20 ring-4 ring-stone-900">
        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-1">
          <img
            src="/assets/logo.png"
            alt="Nenita Farm Lechon Haus"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 w-full space-y-3 px-3">
        {userRole === 'ADMIN' && (
          <button
            onClick={() => onModuleChange('DASHBOARD')}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
              activeModule === 'DASHBOARD'
                ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/40 scale-105 ring-2 ring-red-500/50'
                : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard
              size={22}
              className={`transition-transform duration-300 ${activeModule === 'DASHBOARD' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="text-[10px] font-bold tracking-wide">Dash</span>
            {activeModule === 'DASHBOARD' && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </button>
        )}

        <button
          onClick={() => onModuleChange('POS')}
          className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
            activeModule === 'POS'
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-stone-950 shadow-lg shadow-yellow-900/40 scale-105 ring-2 ring-yellow-500/50'
              : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
          }`}
          title="Point of Sale"
        >
          <Store
            size={22}
            className={`transition-transform duration-300 ${activeModule === 'POS' ? 'scale-110' : 'group-hover:scale-110'}`}
          />
          <span className="text-[10px] font-bold tracking-wide">POS</span>
          {activeModule === 'POS' && (
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          )}
        </button>

        <button
          onClick={() => onModuleChange('BOOKING')}
          className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
            activeModule === 'BOOKING'
              ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-900/40 scale-105 ring-2 ring-purple-500/50'
              : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
          }`}
          title="Bookings & Reservations"
        >
          <Calendar
            size={22}
            className={`transition-transform duration-300 ${activeModule === 'BOOKING' ? 'scale-110' : 'group-hover:scale-110'}`}
          />
          <span className="text-[10px] font-bold tracking-wide">Book</span>
          {activeModule === 'BOOKING' && (
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          )}
        </button>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => onModuleChange('STAFF')}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
              activeModule === 'STAFF'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 scale-105 ring-2 ring-blue-500/50'
                : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
            }`}
            title="Staff Management"
          >
            <Users
              size={22}
              className={`transition-transform duration-300 ${activeModule === 'STAFF' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="text-[10px] font-bold tracking-wide">Staff</span>
            {activeModule === 'STAFF' && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </button>
        )}

        {userRole === 'ADMIN' && (
          <button
            onClick={() => onModuleChange('FINANCE')}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
              activeModule === 'FINANCE'
                ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg shadow-green-900/40 scale-105 ring-2 ring-green-500/50'
                : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
            }`}
            title="Financial Analysis"
          >
            <PieChart
              size={22}
              className={`transition-transform duration-300 ${activeModule === 'FINANCE' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="text-[10px] font-bold tracking-wide">Finance</span>
            {activeModule === 'FINANCE' && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </button>
        )}

        {userRole === 'ADMIN' && (
          <button
            onClick={() => onModuleChange('AUDIT')}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
              activeModule === 'AUDIT'
                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-900/40 scale-105 ring-2 ring-amber-500/50'
                : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
            }`}
            title="System Audit"
          >
            <ClipboardList
              size={22}
              className={`transition-transform duration-300 ${activeModule === 'AUDIT' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="text-[10px] font-bold tracking-wide">Audit</span>
            {activeModule === 'AUDIT' && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </button>
        )}

        {userRole === 'ADMIN' && (
          <button
            onClick={() => onModuleChange('INVENTORY')}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group relative overflow-hidden ${
              activeModule === 'INVENTORY'
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/40 scale-105 ring-2 ring-indigo-500/50'
                : 'hover:bg-stone-900 hover:text-stone-200 hover:scale-105'
            }`}
            title="Inventory Management"
          >
            <Package
              size={22}
              className={`transition-transform duration-300 ${activeModule === 'INVENTORY' ? 'scale-110' : 'group-hover:scale-110'}`}
            />
            <span className="text-[10px] font-bold tracking-wide">Stock</span>
            {activeModule === 'INVENTORY' && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="w-full px-3 space-y-3">
        {/* Connection Status */}
        <div
          className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border ${isOnline ? 'bg-stone-900/50 border-stone-800 text-green-500' : 'bg-red-950/20 border-red-900/50 text-red-500 animate-pulse'}`}
          title={isOnline ? 'System Online' : 'System Offline (Backup Active)'}
        >
          {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          <span className="text-[9px] font-bold tracking-wide">
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          {pendingOrdersCount > 0 && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {pendingOrdersCount}
            </div>
          )}
        </div>

        <button
          className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-stone-900 hover:text-stone-200 group"
          title="Settings"
        >
          <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
        <button
          onClick={onLogout}
          className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-red-500/70 hover:text-red-500 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 group"
          title="Logout"
        >
          <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default MainSidebar;
