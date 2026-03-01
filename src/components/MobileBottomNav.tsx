import * as React from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  PieChart,
  Calendar,
  Package,
  ClipboardList,
  LogOut,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT';
  onModuleChange: (module: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT') => void;
  userRole: 'ADMIN' | 'CASHIER' | null;
  onLogout: () => void;
}

interface NavItem {
  id: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT';
  icon: React.ElementType;
  label: string;
  color: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dash', color: 'from-red-600 to-red-700', adminOnly: true },
  { id: 'POS', icon: Store, label: 'POS', color: 'from-yellow-500 to-yellow-600' },
  { id: 'BOOKING', icon: Calendar, label: 'Book', color: 'from-purple-600 to-purple-700' },
  { id: 'STAFF', icon: Users, label: 'Staff', color: 'from-blue-600 to-blue-700', adminOnly: true },
  { id: 'FINANCE', icon: PieChart, label: 'Finance', color: 'from-green-600 to-green-700', adminOnly: true },
  { id: 'INVENTORY', icon: Package, label: 'Stock', color: 'from-indigo-600 to-indigo-700', adminOnly: true },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  onModuleChange,
  userRole,
  onLogout,
}) => {
  const filteredItems = navItems.filter(item => !item.adminOnly || userRole === 'ADMIN');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-stone-950 border-t border-stone-800 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div 
        className="flex items-stretch h-16 overflow-x-auto no-scrollbar"
        style={{ paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`
                relative flex flex-col items-center justify-center min-w-[4.5rem] flex-1 px-1 transition-all duration-200 group
                ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}
              `}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute top-0 inset-x-4 h-0.5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              )}
              
              <div className={`
                flex flex-col items-center gap-1.5 transition-transform duration-200
                ${isActive ? 'scale-105' : 'scale-100 group-active:scale-95'}
              `}>
                <Icon 
                  size={20} 
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-white drop-shadow-md' : 'text-stone-500 group-hover:text-stone-300'
                  }`} 
                  start="true"
                />
                <span className={`text-[9px] font-black uppercase tracking-wider leading-none transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-stone-600 group-hover:text-stone-400'
                }`}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px bg-stone-800 my-3 mx-1" />

        {/* Improved Logout button */}
        <button
          onClick={onLogout}
          className="relative flex flex-col items-center justify-center min-w-[4.5rem] px-1 group active:bg-red-950/20 transition-colors"
        >
          <div className="flex flex-col items-center gap-1.5 transition-transform duration-200 group-active:scale-95">
            <div className="p-1.5 rounded-lg border border-red-900/40 bg-red-950/30 text-red-500 group-hover:text-red-400 group-hover:border-red-800 transition-all">
              <LogOut size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider leading-none text-red-700/70 group-hover:text-red-500 transition-colors">
              OFF
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
