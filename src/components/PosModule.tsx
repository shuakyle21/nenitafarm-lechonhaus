import * as React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import {
  Category,
  MenuItem,
  CartItem,
  DiscountDetails,
  Order,
  Variant,
  Staff,
  OrderType,
  SavedOrder,
} from '../types';
import SidebarCart from './SidebarCart';
import LechonModal from './LechonModal';
import DiscountModal from './DiscountModal';
import SavedOrdersModal from './SavedOrdersModal';
import ReceiptModal from './ReceiptModal';
import MenuManagementModal from './MenuManagementModal';
import { VariantSelector } from './VariantSelector';
import { Search, Settings, ShoppingCart, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OpeningFundModal from './OpeningFundModal';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface PosModuleProps {
  items: MenuItem[];
  orderCount: number;
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onSaveOrder: (order: Order) => Promise<boolean>;
  staffList: Staff[];
  isOnline: boolean;
}

const PosModule: React.FC<PosModuleProps> = ({
  items,
  orderCount,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onSaveOrder,
  staffList,
  isOnline,
}) => {
  const { isMobile, isTablet } = useBreakpoint();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('Lechon & Grills');

  // Persistence: Load initial state from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('pos_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load cart', e);
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [selectedServer, setSelectedServer] = useState<Staff | null>(() => {
    try {
      const stored = localStorage.getItem('pos_selected_server');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      const stored = localStorage.getItem('pos_order_type');
      return stored ? JSON.parse(stored) : 'DINE_IN';
    } catch {
      return 'DINE_IN';
    }
  });

  const [deliveryDetails, setDeliveryDetails] = useState(() => {
    try {
      const stored = localStorage.getItem('pos_delivery_details');
      return stored ? JSON.parse(stored) : { address: '', time: '', contact: '' };
    } catch {
      return { address: '', time: '', contact: '' };
    }
  });

  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('pos_table_number') || '';
  });

  // Modals & Discount State
  const [isLechonModalOpen, setIsLechonModalOpen] = useState(false);
  const [selectedLechonItem, setSelectedLechonItem] = useState<MenuItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountDetails, setDiscountDetails] = useState<DiscountDetails | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);

  // Saved Orders State
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => {
    try {
      const stored = localStorage.getItem('pos_saved_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Revive Date objects
        return parsed.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp),
        }));
      }
      return [];
    } catch (e) {
      console.error('Failed to load saved orders', e);
      return [];
    }
  });
  const [isSavedOrdersModalOpen, setIsSavedOrdersModalOpen] = useState(false);

  // Opening Fund State
  const [isOpeningFundModalOpen, setIsOpeningFundModalOpen] = useState(false);
  const [openingFundLoading, setOpeningFundLoading] = useState(false);
  const [itemAddedFlash, setItemAddedFlash] = useState(false);

  // Helper to trigger a brief visual feedback when item added
  const triggerAddedFlash = useCallback(() => {
    if (!isCartOpen) {
      setItemAddedFlash(true);
      setTimeout(() => setItemAddedFlash(false), 800);
    }
  }, [isCartOpen]);

  // Check Opening Fund Status
  useEffect(() => {
    const checkOpeningFund = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('cash_transactions')
          .select('id')
          .eq('type', 'OPENING_FUND')
          .gte('created_at', today.toISOString())
          .limit(1);

        if (error) {
          console.error('Error checking opening fund:', error);
          return;
        }

        if (!data || data.length === 0) {
          setIsOpeningFundModalOpen(true);
        }
      } catch (err) {
        console.error('Unexpected error checking opening fund:', err);
      }
    };

    checkOpeningFund();
  }, []);

  const handleOpeningFundSubmit = useCallback(async (amount: number, performedBy: string) => {
    setOpeningFundLoading(true);
    try {
      const { error } = await supabase.from('cash_transactions').insert([
        {
          amount,
          type: 'OPENING_FUND',
          description: 'Start of Shift',
          performed_by: performedBy,
        },
      ]);

      if (error) throw error;
      setIsOpeningFundModalOpen(false);
    } catch (err) {
      console.error('Error setting opening fund:', err);
      alert('Failed to set opening fund. Please try again.');
    } finally {
      setOpeningFundLoading(false);
    }
  }, []);

  // Variant State
  const [selectedVariantItem, setSelectedVariantItem] = useState<MenuItem | null>(null);

  // --- Debounced Persistence Effects for Performance ---
  // Debounce localStorage writes to avoid blocking main thread on every state change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [cart]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pos_saved_orders', JSON.stringify(savedOrders));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [savedOrders]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pos_order_type', JSON.stringify(orderType));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [orderType]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pos_table_number', tableNumber);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [tableNumber]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('pos_delivery_details', JSON.stringify(deliveryDetails));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [deliveryDetails]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedServer) {
        localStorage.setItem('pos_selected_server', JSON.stringify(selectedServer));
      } else {
        localStorage.removeItem('pos_selected_server');
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedServer]);

  // --- Cart Logic (Wrapped with useCallback for performance) ---
  const addToCart = useCallback((item: MenuItem) => {
    if (item.isWeighted) {
      setSelectedLechonItem(item);
      setIsLechonModalOpen(true);
      return;
    }

    if (item.variants && item.variants.length > 0) {
      setSelectedVariantItem(item);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && !i.isWeighted && !i.selectedVariant);
      if (existing) {
        return prev.map((i) =>
          i.cartId === existing.cartId
            ? { ...i, quantity: i.quantity + 1, finalPrice: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [
        ...prev,
        {
          ...item,
          cartId: Math.random().toString(36).substr(2, 9),
          quantity: 1,
          finalPrice: item.price,
        },
      ];
    });

    // Visual feedback instead of auto-open
    if (isMobile || isTablet) {
      triggerAddedFlash();
    }
  }, [isMobile, isTablet, triggerAddedFlash]);

  const addVariantItemToCart = useCallback((variant: Variant) => {
    if (!selectedVariantItem) return;

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === selectedVariantItem.id && i.selectedVariant?.name === variant.name
      );

      if (existing) {
        return prev.map((i) =>
          i.cartId === existing.cartId
            ? { ...i, quantity: i.quantity + 1, finalPrice: (i.quantity + 1) * variant.price }
            : i
        );
      }

      return [
        ...prev,
        {
          ...selectedVariantItem,
          cartId: Math.random().toString(36).substr(2, 9),
          quantity: 1,
          finalPrice: variant.price,
          selectedVariant: variant,
          price: variant.price, // Override base price with variant price
        },
      ];
    });
    setSelectedVariantItem(null);
    if (isMobile || isTablet) {
      triggerAddedFlash();
    }
  }, [selectedVariantItem, isMobile, isTablet, triggerAddedFlash]);

  const addWeightedItemToCart = useCallback((weight: number, price: number) => {
    if (!selectedLechonItem) return;

    setCart((prev) => [
      ...prev,
      {
        ...selectedLechonItem,
        cartId: Math.random().toString(36).substr(2, 9),
        quantity: 1,
        weight: weight,
        finalPrice: price,
      },
    ]);
    if (isMobile || isTablet) {
      triggerAddedFlash();
    }
  }, [selectedLechonItem, isMobile, isTablet, triggerAddedFlash]);

  const removeFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          finalPrice: item.isWeighted ? item.finalPrice : newQuantity * item.price,
        };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountDetails(null);
    setDeliveryDetails({ address: '', time: '', contact: '' });
  }, []);

  const handleOrderConfirmed = useCallback(async (order: Order) => {
    // Inject orderType and delivery details into the order object before saving
    const finalOrder = {
      ...order,
      orderType,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryDetails.address : undefined,
      deliveryTime: orderType === 'DELIVERY' ? deliveryDetails.time : undefined,
      contactNumber: orderType === 'DELIVERY' ? deliveryDetails.contact : undefined,
      tableNumber: tableNumber,
      serverName: selectedServer?.name,
    };
    
    const success = await onSaveOrder(finalOrder);
    if (success) {
      clearCart();
      setIsReceiptModalOpen(false);
    }
  }, [orderType, deliveryDetails, tableNumber, onSaveOrder, clearCart]);

  // --- Saved Orders Logic (Wrapped with useCallback for performance) ---
  const handleSaveForLater = useCallback(() => {
    if (cart.length === 0) return;

    const newSavedOrder: SavedOrder = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Order #${orderCount + 1} (Saved)`, // Simple naming convention
      timestamp: new Date(),
      items: [...cart],
      discount: discountDetails,
      orderType: orderType,
      tableNumber: tableNumber,
      serverName: selectedServer?.name,
      server: selectedServer,
      deliveryDetails: orderType === 'DELIVERY' ? { ...deliveryDetails } : undefined,
    };

    setSavedOrders((prev) => [newSavedOrder, ...prev]);
    clearCart();
  }, [cart, orderCount, discountDetails, orderType, tableNumber, selectedServer, deliveryDetails, clearCart]);

  const handleRestoreSavedOrder = useCallback((order: SavedOrder) => {
    // Check if current cart has items
    if (cart.length > 0) {
      if (!window.confirm('Current cart is not empty. Overwrite with saved order?')) {
        return;
      }
    }

    setCart(order.items);
    setDiscountDetails(order.discount);
    setOrderType(order.orderType);
    if (order.tableNumber) {
      setTableNumber(order.tableNumber);
    }
    if (order.server) {
      setSelectedServer(order.server);
    } else if (order.serverName) {
      // Fallback: try to find server by name in staffList if full object is missing
      const found = staffList.find((s) => s.name === order.serverName);
      if (found) setSelectedServer(found);
    }

    if (order.deliveryDetails) {
      setDeliveryDetails(order.deliveryDetails);
    }

    // Remove from saved list after restoring
    setSavedOrders((prev) => prev.filter((o) => o.id !== order.id));
    setIsSavedOrdersModalOpen(false);
  }, [cart, staffList]);

  const handleDeleteSavedOrder = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this saved order?')) {
      setSavedOrders((prev) => prev.filter((o) => o.id !== id));
    }
  }, []);

  // --- Totals Calculation for passing to Receipt ---
  const subtotal = cart.reduce((acc, item) => acc + item.finalPrice, 0);

  // Calculate discount logic same as Sidebar for consistency
  let discountAmount = 0;
  if (discountDetails && discountDetails.totalPax > 0) {
    const costPerPerson = subtotal / discountDetails.totalPax;
    const discountableAmount = costPerPerson * discountDetails.numberOfIds;
    discountAmount = discountableAmount * discountDetails.amount;
  }

  const total = subtotal - discountAmount;

  // --- Filtering (Memoized for performance) ---
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return item.category === activeCategory;
    });
  }, [items, searchQuery, activeCategory]);

  // Auto-switch category on search
  useEffect(() => {
    if (searchQuery && filteredItems.length > 0) {
      const topCategory = filteredItems[0].category;
      if (activeCategory !== topCategory) {
        setActiveCategory(topCategory);
      }
    }
  }, [searchQuery, filteredItems, activeCategory]);

  // Update categories to include new ones if not in constants
  const allCategories: Category[] = [
    'Lechon & Grills',
    'Party Trays',
    'Chicken Dishes',
    'Pork Dishes',
    'Beef Dishes',
    'Seafood',
    'Vegetables',
    'Soup',
    'Short Orders',
    'Desserts',
    'Extras',
    "Today's Menu",
  ];

  // --- Image Helper ---
  const getSafeImage = (url?: string) => {
    if (!url || url.includes('placeholder.com')) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NjY2NiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    }
    return url;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-stone-100 overflow-hidden font-roboto animate-in fade-in duration-300">
      {/* DESKTOP: LEFT PANEL CART (visible only on lg+) */}
      <div className="hidden lg:block w-[35%] h-full shrink-0">
        <SidebarCart
          cart={cart}
          discount={discountDetails}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onClear={() => setCart([])}
          onOpenDiscount={() => setIsDiscountModalOpen(true)}
          onConfirmOrder={() => setIsReceiptModalOpen(true)}
          staffList={staffList}
          selectedServer={selectedServer}
          onSelectServer={setSelectedServer}
          orderType={orderType}
          onSetOrderType={setOrderType}
          orderCount={orderCount}
          deliveryDetails={deliveryDetails}
          onUpdateDeliveryDetails={setDeliveryDetails}
          onSaveForLater={handleSaveForLater}
          savedOrdersCount={savedOrders.length}
          onOpenSavedOrders={() => setIsSavedOrdersModalOpen(true)}
          tableNumber={tableNumber}
          onSetTableNumber={setTableNumber}
        />
        <OpeningFundModal
          isOpen={isOpeningFundModalOpen}
          onSubmit={handleOpeningFundSubmit}
          isLoading={openingFundLoading}
        />
      </div>

      {/* RIGHT PANEL: MENU (full width on mobile, 65% on desktop) */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Header - responsive padding */}
        <header className="bg-white border-b border-stone-200 px-3 py-2 md:px-6 md:py-4 flex justify-between items-center z-20 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Logo - smaller on mobile */}
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white border-2 border-yellow-500 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group p-0.5 md:p-1 shrink-0">
              <img
                src="/assets/logo.png"
                alt="Nenita Farm Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-lg md:text-2xl font-brand font-black text-red-800 tracking-tight leading-tight drop-shadow-sm">
                NENITA FARM Lechon Haus
              </h1>
              <p className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-stone-500 leading-tight">
                & Catering Services
              </p>
              <div className="hidden sm:inline-block text-[10px] md:text-xs font-bold text-yellow-600 tracking-[0.2em] uppercase bg-black/5 px-2 py-0.5 rounded mt-0.5">
                POS Terminal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Search - full bar on sm+, icon button on mobile */}
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={18}
              />
              <input
                id="menu-search"
                name="menu-search"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2.5 md:py-3 bg-stone-100 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500 w-48 md:w-64 transition-all shadow-inner text-sm"
              />
            </div>
            {/* Mobile search icon button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className={`sm:hidden p-2.5 rounded-full transition-colors shadow-sm ${
                mobileSearchOpen ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              title="Search menu"
            >
              <Search size={18} />
            </button>

            {/* Mobile: Dynamic Cart Button (Removed per request, now opens on item selection) */}
        <div className="lg:hidden flex items-center gap-3">
          {isOnline ? (
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          )}
        </div>
            <button
              onClick={() => setIsMenuManagerOpen(true)}
              className="p-2.5 md:p-3 bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors shadow-lg"
              title="Manage Menu"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Mobile expandable search bar */}
        {mobileSearchOpen && (
          <div className="sm:hidden bg-white border-b border-stone-200 px-3 py-2 animate-in slide-in-from-top-1 duration-200">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-9 py-2.5 bg-stone-100 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setMobileSearchOpen(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Navigation - Industrial/Tactile for Mobile, Clean Tabs for Desktop */}
        <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <nav className="px-3 py-3 md:px-6 md:pt-3 md:pb-0 flex gap-2 md:gap-8 overflow-x-auto no-scrollbar shadow-sm snap-x snap-mandatory scroll-pl-3 items-center">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                snap-start shrink-0 select-none
                text-xs md:text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200
                /* MOBILE: Tactile Pill Style - Industrial Utilitarian */
                rounded-full px-4 py-2.5 border shadow-sm
                /* DESKTOP: Clean Tab Style - Returns to Sleek Minimal */
                md:rounded-none md:bg-transparent md:border-0 md:border-b-4 md:shadow-none md:px-1 md:pb-4 md:py-0
                ${
                activeCategory === cat
                  ? 'bg-red-800 text-white border-transparent shadow-md scale-105 md:scale-100 md:bg-transparent md:text-red-800 md:border-red-800 md:shadow-none ring-2 ring-transparent'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200 md:bg-transparent md:text-stone-500 md:border-transparent md:hover:text-stone-800 md:hover:border-stone-200 active:scale-95 md:active:scale-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>
        </div>

        {/* Menu Grid - responsive columns and padding */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8 bg-stone-100">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 lg:gap-8 pb-20">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border border-stone-200 group flex flex-col h-full"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={getSafeImage(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getSafeImage();
                    }}
                  />
                  {item.isWeighted && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-red-900 text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-10">
                      By KG
                    </div>
                  )}
                  {item.variants && item.variants.length > 0 && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm z-10">
                      Multiple Sizes
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 text-red-800 font-bold px-4 py-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      Add to Order
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-stone-800 text-lg leading-tight mb-2 line-clamp-2 flex-1">
                    {item.name}
                  </h3>
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-stone-100">
                    <span className="text-red-700 font-brand font-black text-xl">
                      {item.variants && item.variants.length > 0 ? (
                        <span className="text-sm text-stone-500 font-normal">
                          Starts at{' '}
                          <span className="text-red-700 font-black text-xl">
                            ₱{Math.min(...item.variants.map((v) => v.price)).toLocaleString()}
                          </span>
                        </span>
                      ) : (
                        `₱${item.price.toLocaleString()} `
                      )}
                    </span>
                    {item.isWeighted && (
                      <span className="text-stone-400 text-xs font-medium bg-stone-100 px-2 py-1 rounded">
                        per kg
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-stone-400">
                <p className="font-bold">No items found in this category</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LechonModal
        isOpen={isLechonModalOpen}
        item={selectedLechonItem}
        onClose={() => setIsLechonModalOpen(false)}
        onConfirm={addWeightedItemToCart}
      />

      {selectedVariantItem && (
        <VariantSelector
          item={selectedVariantItem}
          onSelect={addVariantItemToCart}
          onClose={() => setSelectedVariantItem(null)}
        />
      )}

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onApply={setDiscountDetails}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        cart={cart}
        discount={discountDetails}
        total={total}
        orderCount={orderCount}
        onSaveOrder={handleOrderConfirmed}
        tableNumber={tableNumber}
        server={selectedServer}
      />

      <MenuManagementModal
        isOpen={isMenuManagerOpen}
        onClose={() => setIsMenuManagerOpen(false)}
        items={items}
        onAdd={onAddItem}
        onUpdate={onUpdateItem}
        onDelete={onDeleteItem}
      />

      <SavedOrdersModal
        isOpen={isSavedOrdersModalOpen}
        onClose={() => setIsSavedOrdersModalOpen(false)}
        savedOrders={savedOrders}
        onRestore={handleRestoreSavedOrder}
        onDelete={handleDeleteSavedOrder}
      />

      {/* MOBILE: Bottom Drawer Cart Panel */}
      {cart.length > 0 && (
        <>
          {/* Backdrop - only when expanded */}
          {isCartOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-300"
              onClick={() => setIsCartOpen(false)}
            />
          )}
          
          {/* Drawer Panel - persistent at bottom when items exist */}
          <div 
            className={`lg:hidden fixed inset-x-0 z-[70] transition-all duration-500 ease-in-out overflow-hidden flex flex-col
              ${isCartOpen ? 'h-[85vh] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.2)]' : 'h-16 rounded-t-2xl'}
              ${!isCartOpen && itemAddedFlash ? 'bg-red-600 shadow-[0_-4px_20px_rgba(220,38,38,0.4)]' : 'bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.12)]'}`}
            style={{ bottom: 'calc(var(--mobile-nav-height, 4rem) + var(--safe-area-bottom, 0px))' }}
          >
            {/* Handle bar and header - Tapping this toggles the drawer */}
            <div 
              className={`flex-shrink-0 pt-2 pb-3 px-4 border-b border-stone-100 relative cursor-pointer active:opacity-80 transition-colors
                ${!isCartOpen && itemAddedFlash ? 'border-red-500' : 'border-stone-100'}`}
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <div className="flex justify-center mb-2">
                <div className={`w-10 h-1 rounded-full transition-colors ${!isCartOpen && itemAddedFlash ? 'bg-white/60' : 'bg-stone-300'}`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-bold transition-colors ${!isCartOpen && itemAddedFlash ? 'text-white' : 'text-stone-800'}`}>Your Order</h2>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${!isCartOpen && itemAddedFlash ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'}`}>
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {!isCartOpen && (
                    <span className={`font-black text-xl font-brand transition-colors ${itemAddedFlash ? 'text-white underline decoration-wavy decoration-white/30 underline-offset-4' : 'text-stone-900'}`}>
                      ₱{cart.reduce((sum, item) => sum + item.finalPrice, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {isCartOpen ? (
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCartOpen(false);
                        }}
                        className="p-2 -mr-2 text-stone-500 hover:text-stone-800 active:bg-stone-100 rounded-full transition-colors"
                      >
                        <X size={22} />
                      </button>
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center -mr-2">
                      <div className={`transform transition-transform duration-300 ${isCartOpen ? 'rotate-180' : ''}`}>
                         <ShoppingCart size={18} className="text-stone-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Cart content - scrollable area */}
            <div className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-300 pb-20 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <SidebarCart
                cart={cart}
                discount={discountDetails}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onClear={() => setCart([])}
                onOpenDiscount={() => setIsDiscountModalOpen(true)}
                onConfirmOrder={() => {
                  setIsReceiptModalOpen(true);
                  setIsCartOpen(false);
                }}
                staffList={staffList}
                selectedServer={selectedServer}
                onSelectServer={setSelectedServer}
                orderType={orderType}
                onSetOrderType={setOrderType}
                orderCount={orderCount}
                deliveryDetails={deliveryDetails}
                onUpdateDeliveryDetails={setDeliveryDetails}
                onSaveForLater={handleSaveForLater}
                savedOrdersCount={savedOrders.length}
                onOpenSavedOrders={() => setIsSavedOrdersModalOpen(true)}
                tableNumber={tableNumber}
                onSetTableNumber={setTableNumber}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile Opening Fund Modal */}
      <div className="lg:hidden">
        <OpeningFundModal
          isOpen={isOpeningFundModalOpen}
          onSubmit={handleOpeningFundSubmit}
          isLoading={openingFundLoading}
        />
      </div>
    </div>
  );
};

export default PosModule;
