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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <Package className="text-red-600" />
            Inventory & Stock
          </h1>
          <p className="text-stone-500 text-sm">Manage raw materials and food costing</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'LIST' ? 'bg-red-800 text-white shadow-lg shadow-red-900/20' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            Stock List
          </button>
          <button 
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'TRANSACTIONS' ? 'bg-red-800 text-white shadow-lg shadow-red-900/20' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('RECIPES')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'RECIPES' ? 'bg-red-800 text-white shadow-lg shadow-red-900/20' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            Recipe Costing
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Total Items</p>
            <p className="text-3xl font-black text-stone-900">{items.length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Low Stock</p>
            <p className="text-3xl font-black text-orange-600">{lowStockItems.length}</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Out of Stock</p>
            <p className="text-3xl font-black text-red-600">{items.filter(i => i.current_stock === 0).length}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'LIST' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-4 justify-between bg-stone-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Search ingredients..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-3 py-2">
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
              
              <button className="bg-red-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20">
                <Plus size={18} />
                Add Ingredient
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-stone-500 uppercase font-bold bg-stone-50">
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
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                      No ingredients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
