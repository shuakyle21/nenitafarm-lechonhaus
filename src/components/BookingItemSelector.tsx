import * as React from 'react';
import { useState, useMemo } from 'react';
import { MenuItem, Category, CartItem, Variant } from '../types';
import { Search, X, Plus, Minus, ShoppingBag } from 'lucide-react';

interface BookingItemSelectorProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  onAddSelectedItems: (selectedItems: CartItem[]) => void;
}

const BookingItemSelector: React.FC<BookingItemSelectorProps> = ({
  items,
  isOpen,
  onClose,
  onAddSelectedItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Mains' | 'Drinks' | 'Sides' | 'Desserts'>('All');
  
  // Local state for quantities and variant selection
  // Key is itemId-variantName (if any)
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const tabs: ('All' | 'Mains' | 'Drinks' | 'Sides' | 'Desserts')[] = [
    'All',
    'Mains',
    'Drinks',
    'Sides',
    'Desserts',
  ];

  const categoryMapping: Record<Category, 'Mains' | 'Drinks' | 'Sides' | 'Desserts' | 'Other'> = {
    'Lechon & Grills': 'Mains',
    'Pork Dishes': 'Mains',
    'Beef Dishes': 'Mains',
    'Chicken Dishes': 'Mains',
    'Seafood': 'Mains',
    "Today's Menu": 'Mains',
    'Short Orders': 'Sides',
    'Vegetables': 'Sides',
    'Soup': 'Sides',
    'Desserts': 'Desserts',
    'Extras': 'Drinks',
    'Party Trays': 'Mains',
  };

  // Flatten items that have variants for the grid, as seen in the user's reference image
  // (e.g. Bulalo Family, Bulalo Medium shown as separate cards)
  const flattenedItems = useMemo(() => {
    const list: (MenuItem & { variant?: Variant })[] = [];
    items.forEach(item => {
      if (item.variants && item.variants.length > 0) {
        item.variants.forEach(variant => {
          list.push({
            ...item,
            name: `${item.name} (${variant.name})`,
            price: variant.price,
            variant: variant,
            id: `${item.id}-${variant.name}` // Unique ID for selection tracking
          });
        });
      } else {
        list.push(item);
      }
    });
    return list;
  }, [items]);

  const filteredItems = useMemo(() => {
    return flattenedItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const mappedCat = categoryMapping[item.category] || 'Other';
      const matchesTab = activeTab === 'All' || mappedCat === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [flattenedItems, searchQuery, activeTab]);

  const handleUpdateQty = (itemId: string, delta: number) => {
    setSelection((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const selectedCount = Object.values(selection).reduce((acc, qty) => acc + qty, 0);
  const totalPrice = Object.entries(selection).reduce((acc, [id, qty]) => {
    const item = flattenedItems.find(i => i.id === id);
    return acc + (item ? item.price * qty : 0);
  }, 0);

  const handleConfirm = () => {
    const selectedCartItems: CartItem[] = [];
    Object.entries(selection).forEach(([id, qty]) => {
      if (qty > 0) {
        const item = flattenedItems.find(i => i.id === id);
        if (item) {
          // If it was a flattened variant, reconstructed it as a CartItem
          const originalItem = items.find(orig => orig.id === (item.id.includes('-') ? item.id.split('-')[0] : item.id));
          if (originalItem) {
             selectedCartItems.push({
              ...originalItem,
              name: item.name,
              price: item.price,
              cartId: Math.random().toString(36).substr(2, 9),
              quantity: qty,
              finalPrice: item.price * qty,
              selectedVariant: item.variant // Keep reference to variant
            });
          }
        }
      }
    });
    onAddSelectedItems(selectedCartItems);
    setSelection({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-stone-800 tracking-tight">Select Menu Items</h2>
            <p className="text-stone-400 text-sm mt-1">Search and add items to your pre-order</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={24} className="text-stone-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 flex flex-col md:flex-row gap-4 bg-stone-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="item-search-input"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none transition-all text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2 p-1 bg-stone-200/50 rounded-xl">
             {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col hover:border-red-200 hover:shadow-lg transition-all group lg:aspect-[4/5]"
              >
                <div className="h-32 bg-stone-100 relative overflow-hidden">
                  <img 
                    src={item.image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {selection[item.id] > 0 && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      {selection[item.id]}
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-800 line-clamp-2 leading-tight mb-1">{item.name}</h3>
                    <p className="text-red-700 font-black text-sm">₱{item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center bg-stone-100 rounded-lg p-1 flex-1">
                      <button 
                        type="button"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Minus size={12} className="text-stone-500" />
                      </button>
                      <input 
                        type="number"
                        min="0"
                        value={selection[item.id] || 0}
                        onChange={(e) => setSelection(prev => ({ ...prev, [item.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-transparent text-center text-xs font-bold focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Plus size={12} className="text-stone-500" />
                      </button>
                    </div>
                    <button
                      type="button"
                      data-testid={`add-item-${item.id}`}
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
               <ShoppingBag size={48} className="mb-4 opacity-20" />
               <p className="font-bold">No items match your criteria</p>
               <button 
                onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
                className="text-red-600 text-sm font-bold mt-2 hover:underline"
               >
                 Clear all filters
               </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-between items-center shrink-0">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Total Selection</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-800">₱{totalPrice.toLocaleString()}</span>
              <span className="text-sm text-stone-400 font-medium">{selectedCount} items</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-stone-500 font-black uppercase text-xs tracking-widest hover:bg-stone-200/50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              data-testid="confirm-add-items"
              className="px-8 py-3 bg-stone-800 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              Add to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingItemSelector;
