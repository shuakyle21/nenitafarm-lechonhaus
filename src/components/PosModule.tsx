import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Search, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OpeningFundModal from './OpeningFundModal';
import { debouncedSetItem, getItem, removeItem } from '../utils/storageUtils';

interface PosModuleProps {
  items: MenuItem[];
  orderCount: number;
  onAddItem: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onSaveOrder: (order: Order) => Promise<void>;
  staffList: Staff[];
}

const PosModule: React.FC<PosModuleProps> = ({
  items,
  orderCount,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onSaveOrder,
  staffList,
}) => {
  const [activeCategory, setActiveCategory] = useState<Category>('Lechon & Grills');

  // Persistence: Load initial state from localStorage using storage utility
  const [cart, setCart] = useState<CartItem[]>(() => getItem('pos_cart', []));

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedServer, setSelectedServer] = useState<Staff | null>(() =>
    getItem('pos_selected_server', null)
  );

  const [orderType, setOrderType] = useState<OrderType>(() =>
    getItem('pos_order_type', 'DINE_IN')
  );

  const [deliveryDetails, setDeliveryDetails] = useState(() =>
    getItem('pos_delivery_details', { address: '', time: '', contact: '' })
  );

  const [tableNumber, setTableNumber] = useState(() => getItem('pos_table_number', ''));

  // Modals & Discount State
  const [isLechonModalOpen, setIsLechonModalOpen] = useState(false);
  const [selectedLechonItem, setSelectedLechonItem] = useState<MenuItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountDetails, setDiscountDetails] = useState<DiscountDetails | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);

  // Saved Orders State - requires custom Date revival logic
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => {
    const stored = getItem<SavedOrder[]>('pos_saved_orders', []);
    // Revive Date objects that were serialized to strings
    return stored.map((o: any) => ({
      ...o,
      timestamp: new Date(o.timestamp),
    }));
  });
  const [isSavedOrdersModalOpen, setIsSavedOrdersModalOpen] = useState(false);

  // Opening Fund State
  const [isOpeningFundModalOpen, setIsOpeningFundModalOpen] = useState(false);
  const [openingFundLoading, setOpeningFundLoading] = useState(false);

  // Check Opening Fund Status
  React.useEffect(() => {
    const checkOpeningFund = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('cash_transactions')
        .select('id')
        .eq('type', 'OPENING_FUND')
        .gte('created_at', today.toISOString())
        .limit(1);

      if (!error && (!data || data.length === 0)) {
        setIsOpeningFundModalOpen(true);
      }
    };

    checkOpeningFund();
  }, []);

  const handleOpeningFundSubmit = async (amount: number, performedBy: string) => {
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
  };

  // Variant State
  const [selectedVariantItem, setSelectedVariantItem] = useState<MenuItem | null>(null);

  // --- Optimized Persistence Effects with Debouncing ---
  // Debounced writes reduce blocking I/O operations by batching multiple state changes
  useEffect(() => {
    debouncedSetItem('pos_cart', cart);
  }, [cart]);

  useEffect(() => {
    debouncedSetItem('pos_saved_orders', savedOrders);
  }, [savedOrders]);

  useEffect(() => {
    debouncedSetItem('pos_order_type', orderType);
  }, [orderType]);

  useEffect(() => {
    debouncedSetItem('pos_table_number', tableNumber);
  }, [tableNumber]);

  useEffect(() => {
    debouncedSetItem('pos_delivery_details', deliveryDetails);
  }, [deliveryDetails]);

  useEffect(() => {
    if (selectedServer) {
      debouncedSetItem('pos_selected_server', selectedServer);
    } else {
      removeItem('pos_selected_server');
    }
  }, [selectedServer]);

  // --- Cart Logic ---
  const addToCart = (item: MenuItem) => {
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
  };

  const addVariantItemToCart = (variant: Variant) => {
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
  };

  const addWeightedItemToCart = (weight: number, price: number) => {
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
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
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
  };

  const clearCart = () => {
    setCart([]);
    setDiscountDetails(null);
    setDeliveryDetails({ address: '', time: '', contact: '' });
  };

  const handleOrderConfirmed = (order: Order) => {
    // Inject orderType and delivery details into the order object before saving
    const finalOrder = {
      ...order,
      orderType,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryDetails.address : undefined,
      deliveryTime: orderType === 'DELIVERY' ? deliveryDetails.time : undefined,
      contactNumber: orderType === 'DELIVERY' ? deliveryDetails.contact : undefined,
      tableNumber: tableNumber,
    };
    onSaveOrder(finalOrder);
    clearCart();
    setIsReceiptModalOpen(false);
  };

  // --- Saved Orders Logic ---
  const handleSaveForLater = () => {
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
  };

  const handleRestoreSavedOrder = (order: SavedOrder) => {
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
  };

  const handleDeleteSavedOrder = (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved order?')) {
      setSavedOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

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

  // --- Filtering ---
  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return item.category === activeCategory;
  });

  // Auto-switch category on search
  React.useEffect(() => {
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
    <div className="flex h-full w-full bg-stone-100 overflow-hidden font-roboto animate-in fade-in duration-300">
      {/* LEFT PANEL: CART (30%) */}
      <div className="w-[30%] h-full shrink-0">
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

      {/* RIGHT PANEL: MENU (70%) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Branding Bar */}
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-5">
            {/* Logo Representation */}
            <div className="w-16 h-16 rounded-full bg-white border-2 border-yellow-500 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group p-1">
              <img
                src="/assets/logo.png"
                alt="Nenita Farm Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-brand font-black text-red-800 tracking-tight leading-none drop-shadow-sm">
                NENITA FARM Lechon Haus and Catering Services
              </h1>
              <div className="text-xs font-bold text-yellow-600 tracking-[0.2em] uppercase bg-black/5 px-2 py-0.5 rounded mt-0.5 inline-block">
                POS Terminal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={20}
              />
              <input
                id="menu-search"
                name="menu-search"
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-stone-100 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500 w-64 transition-all shadow-inner"
              />
            </div>

            <button
              onClick={() => setIsMenuManagerOpen(true)}
              className="p-3 bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors shadow-lg"
              title="Manage Menu"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Category Navigation */}
        <nav className="bg-white border-b border-stone-200 px-6 pt-2 pb-0 flex gap-8 overflow-x-auto no-scrollbar shadow-sm z-10">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-4 px-1 text-sm font-bold uppercase tracking-wide whitespace-nowrap border-b-4 transition-all ${
                activeCategory === cat
                  ? 'border-red-600 text-red-800'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Menu Grid */}
        <main className="flex-1 overflow-y-auto p-6 bg-stone-100">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
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
    </div>
  );
};

export default PosModule;
