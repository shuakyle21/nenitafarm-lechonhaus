import * as React from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  PieChart,
  Calendar,
  Package,
  ClipboardList,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT';
  onModuleChange: (module: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT') => void;
  userRole: 'ADMIN' | 'CASHIER' | null;
}

interface NavItem {
  id: 'DASHBOARD' | 'POS' | 'STAFF' | 'FINANCE' | 'BOOKING' | 'INVENTORY' | 'AUDIT';
  icon: React.ElementType;
  label: string;
  color: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'POS', icon: Store, label: 'POS', color: 'from-yellow-500 to-yellow-600' },
  { id: 'BOOKING', icon: Calendar, label: 'Book', color: 'from-purple-600 to-purple-700' },
  { id: 'STAFF', icon: Users, label: 'Staff', color: 'from-blue-600 to-blue-700' },
  { id: 'FINANCE', icon: PieChart, label: 'Finance', color: 'from-green-600 to-green-700', adminOnly: true },
  { id: 'INVENTORY', icon: Package, label: 'Stock', color: 'from-indigo-600 to-indigo-700' },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  onModuleChange,
  userRole,
}) => {
  const filteredItems = navItems.filter(item => !item.adminOnly || userRole === 'ADMIN');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950 border-t border-stone-800 lg:hidden">
      <div 
        className="flex justify-around items-center h-16"
        style={{ paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all ${
                isActive 
                  ? 'text-white' 
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <div className={`relative p-2 rounded-xl transition-all ${
                isActive 
                  ? `bg-gradient-to-br ${item.color} shadow-lg` 
                  : ''
              }`}>
                <Icon size={20} />
                {isActive && (
                  <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 ${
                isActive ? 'text-white' : 'text-stone-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
