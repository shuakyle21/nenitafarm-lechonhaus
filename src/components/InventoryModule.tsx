import * as React from 'react';
import { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useMenu } from '@/hooks/useMenu';
import { 
  Package, 
  Plus, 
  History, 
  Settings, 
  AlertTriangle, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Filter
} from 'lucide-react';
import { InventoryItem, InventoryTransactionType } from '@/types';

interface InventoryModuleProps {
  userId: string | null;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ userId }) => {
  const { items, loading, error, lowStockItems, addTransaction, addItem } = useInventory(userId);
  const { menuItems } = useMenu(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'TRANSACTIONS' | 'RECIPES'>('LIST');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...new Set(items.map(i => i.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-stone-500 font-medium">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-stone-100 z-10 py-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <Package className="text-red-600" />
            Inventory & Stock
          </h1>
          <p className="text-stone-500 text-xs md:text-sm">Manage raw materials and food costing</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 snap-x">
          <button 
            onClick={() => setActiveTab('LIST')}
            className={`
              whitespace-nowrap snap-start px-4 py-2 rounded-full text-sm font-bold transition-all border
              ${activeTab === 'LIST' 
                ? 'bg-red-800 text-white border-transparent shadow-md' 
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}
            `}
          >
            Stock List
          </button>
          <button 
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`
              whitespace-nowrap snap-start px-4 py-2 rounded-full text-sm font-bold transition-all border
              ${activeTab === 'TRANSACTIONS' 
                ? 'bg-red-800 text-white border-transparent shadow-md' 
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}
            `}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('RECIPES')}
            className={`
              whitespace-nowrap snap-start px-4 py-2 rounded-full text-sm font-bold transition-all border
              ${activeTab === 'RECIPES' 
                ? 'bg-red-800 text-white border-transparent shadow-md' 
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}
            `}
          >
            Recipe Costing
          </button>
        </div>
      </div>

      {/* Quick Stats - Scrollable on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 overflow-x-auto snap-x">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between snap-center min-w-[200px]">
          <div>
            <p className="text-stone-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total Items</p>
            <p className="text-2xl md:text-3xl font-black text-stone-900">{items.length}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package size={20} className="md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between snap-center min-w-[200px]">
          <div>
            <p className="text-stone-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Low Stock</p>
            <p className="text-2xl md:text-3xl font-black text-orange-600">{lowStockItems.length}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between snap-center min-w-[200px]">
          <div>
            <p className="text-stone-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Out of Stock</p>
            <p className="text-2xl md:text-3xl font-black text-red-600">{items.filter(i => i.current_stock === 0).length}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'LIST' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-[calc(100vh-280px)] md:h-auto">
          {/* Controls */}
          <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-3 justify-between bg-stone-50/50 sticky top-0 z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder="Search ingredients..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-3 py-2 shrink-0">
                <Filter size={14} className="text-stone-400" />
                <select 
                  className="text-sm font-bold text-stone-600 focus:outline-none bg-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <button className="bg-red-800 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-md shrink-0 whitespace-nowrap">
                <Plus size={16} />
                <span className="hidden sm:inline">Add Ingredient</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Responsive List View */}
          <div className="flex-1 overflow-y-auto">
            {/* Desktop Table View (Hidden on Mobile) */}
            <table className="w-full text-sm text-left hidden md:table">
              <thead className="text-xs text-stone-500 uppercase font-bold bg-stone-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Reorder Level</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-500 font-medium">
                      {item.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span className={item.current_stock <= item.reorder_level ? 'text-orange-600' : 'text-stone-900'}>
                          {item.current_stock}
                        </span>
                        <span className="text-stone-400 text-[10px] uppercase">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-stone-500">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all" title="Add Stock">
                          <Plus size={16} />
                        </button>
                        <button className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all" title="View History">
                          <History size={16} />
                        </button>
                        <button className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all" title="Settings">
                          <Settings size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden divide-y divide-stone-100">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 bg-white active:bg-stone-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-stone-900 text-base">{item.name}</div>
                      <div className="text-xs text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        {item.category || 'Uncategorized'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-xl font-bold ${item.current_stock <= item.reorder_level ? 'text-orange-600' : 'text-stone-900'}`}>
                        {item.current_stock} <span className="text-xs text-stone-400 font-sans uppercase">{item.unit}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase font-bold mt-0.5">
                        Min: {item.reorder_level}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 pt-2 mt-2 border-t border-stone-50">
                    <button className="flex-1 py-2 px-3 bg-stone-50 text-stone-600 rounded-lg text-xs font-bold border border-stone-200 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <History size={14} />
                      History
                    </button>
                    <button className="flex-1 py-2 px-3 bg-stone-900 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Plus size={14} />
                      Add Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-stone-500">
                <p>No ingredients found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'RECIPES' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight size={32} />
          </div>
          <h2 className="text-xl font-black text-stone-900 uppercase">Recipe Costing Module</h2>
          <p className="text-stone-500 max-w-md mx-auto">
            Connect your menu items to ingredients to automatically track costs and inventory levels with every sale.
          </p>
          <button className="bg-red-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all">
            Start Building Recipes
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
