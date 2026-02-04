import * as React from 'react';
import { useMemo, useState } from 'react';
import { CartItem, DiscountDetails, Staff, OrderType } from '../types';
import {
  Trash2,
  Minus,
  Plus,
  Receipt,
  Tag,
  Users,
  ChevronDown,
  Utensils,
  ShoppingBag,
  Clock,
} from 'lucide-react';

interface SidebarCartProps {
  cart: CartItem[];
  discount: DiscountDetails | null;
  onRemove: (cartId: string) => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onClear: () => void;
  onOpenDiscount: () => void;
  onConfirmOrder: () => void;
  staffList: Staff[];
  selectedServer: Staff | null;
  onSelectServer: (server: Staff) => void;
  orderType: OrderType;
  onSetOrderType: (type: OrderType) => void;
  orderCount: number;
  deliveryDetails?: {
    address: string;
    time: string;
    contact: string;
  };
  onUpdateDeliveryDetails?: (details: { address: string; time: string; contact: string }) => void;
  onSaveForLater: () => void;
  savedOrdersCount: number;
  onOpenSavedOrders: () => void;
  tableNumber: string;
  onSetTableNumber: (num: string) => void;
}

const SidebarCart: React.FC<SidebarCartProps> = ({
  cart,
  discount,
  onRemove,
  onUpdateQuantity,
  onClear,
  onOpenDiscount,
  onConfirmOrder,
  staffList,
  selectedServer,
  onSelectServer,
  orderType,
  onSetOrderType,
  orderCount,
  deliveryDetails,
  onUpdateDeliveryDetails,
  onSaveForLater,
  savedOrdersCount,
  onOpenSavedOrders,
  tableNumber,
  onSetTableNumber,
}) => {
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.finalPrice, 0);
  }, [cart]);

  // Logic: Discount = (Subtotal / TotalPax) * NumberOfIds * 0.20
  let discountAmount = 0;
  if (discount && discount.totalPax > 0) {
    const costPerPerson = subtotal / discount.totalPax;
    const discountableAmount = costPerPerson * discount.numberOfIds;
    discountAmount = discountableAmount * discount.amount;
  }

  const total = subtotal - discountAmount;

  return (
    <div className="h-auto lg:h-full flex flex-col bg-white lg:border-r lg:border-stone-200 lg:shadow-xl z-20">
      {/* Header */}
      <div className="bg-red-900 text-white p-4 shadow-md bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <Receipt size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Order Summary</span>
        </div>
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-brand font-bold">Order #{orderCount + 1}</h2>
          <div className="flex items-center gap-2 bg-red-800/50 px-2 py-1 rounded">
            <span className="text-xs font-bold uppercase text-red-200">Table</span>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => onSetTableNumber(e.target.value)}
              className="w-12 bg-transparent text-white font-bold text-center border-b border-red-300 focus:outline-none focus:border-white"
              placeholder="#"
            />
          </div>
        </div>

        {/* Order Type Toggle */}
        <div className="flex bg-red-800/50 p-1 rounded-lg mt-2 mb-2">
          <button
            onClick={() => onSetOrderType('DINE_IN')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold transition-all ${
              orderType === 'DINE_IN'
                ? 'bg-white text-red-900 shadow-sm'
                : 'text-red-200 hover:bg-red-800'
            }`}
          >
            <Utensils size={12} /> Dine-in
          </button>
          <button
            onClick={() => onSetOrderType('TAKEOUT')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold transition-all ${
              orderType === 'TAKEOUT'
                ? 'bg-white text-red-900 shadow-sm'
                : 'text-red-200 hover:bg-red-800'
            }`}
          >
            <ShoppingBag size={12} /> Takeout
          </button>
          <button
            onClick={() => onSetOrderType('DELIVERY')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold transition-all ${
              orderType === 'DELIVERY'
                ? 'bg-white text-red-900 shadow-sm'
                : 'text-red-200 hover:bg-red-800'
            }`}
          >
            <ShoppingBag size={12} /> Delivery
          </button>
        </div>

        {/* Server Selection */}
        <div className="relative mt-1">
          <button
            onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
            className="text-xs text-red-100 flex items-center gap-1 hover:text-white transition-colors"
          >
            Server:{' '}
            <span className="font-bold underline decoration-dotted">
              {selectedServer ? selectedServer.name : 'Select Server'}
            </span>
            <ChevronDown size={12} />
          </button>

          {isServerMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsServerMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-20 text-stone-800 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                  Select Server
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {staffList.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        onSelectServer(staff);
                        setIsServerMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center gap-2 ${selectedServer?.id === staff.id ? 'bg-red-50 text-red-700 font-bold' : ''}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500">
                        {staff.name.charAt(0)}
                      </div>
                      {staff.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delivery Details Input */}
      {orderType === 'DELIVERY' && onUpdateDeliveryDetails && (
        <div className="bg-red-50 p-3 border-b border-red-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider mb-1">
            <ShoppingBag size={12} /> Delivery Details
          </div>
          <input
            type="text"
            placeholder="Delivery Address"
            value={deliveryDetails?.address || ''}
            onChange={(e) =>
              onUpdateDeliveryDetails({ ...deliveryDetails, address: e.target.value })
            }
            className="w-full p-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={deliveryDetails?.time || ''}
              onChange={(e) =>
                onUpdateDeliveryDetails({ ...deliveryDetails, time: e.target.value })
              }
              className="flex-1 p-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <input
              type="text"
              placeholder="Contact #"
              value={deliveryDetails?.contact || ''}
              onChange={(e) =>
                onUpdateDeliveryDetails({ ...deliveryDetails, contact: e.target.value })
              }
              className="flex-1 p-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-none lg:flex-1 lg:overflow-y-auto p-2 space-y-2 bg-stone-50/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8 text-center">
            <div className="bg-stone-100 p-4 rounded-full mb-4">
              <Receipt size={48} />
            </div>
            <p className="font-medium">No items yet</p>
            <p className="text-sm">Select items from the menu to add them here.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.cartId}
              className="bg-white border border-stone-100 p-3 rounded-lg shadow-sm flex flex-col gap-2 relative group animate-in slide-in-from-left-2 duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-stone-800 leading-tight">{item.name}</h4>
                  {item.weight && (
                    <div className="text-xs text-stone-500 mt-1 font-mono bg-stone-100 inline-block px-1 rounded">
                      {item.weight.toFixed(3)} kg @ ₱{item.price}/kg
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-700">
                    ₱{item.finalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                {/* Quantity Controls */}
                {!item.isWeighted ? (
                  <div className="flex items-center bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                    <button
                      onClick={() => onUpdateQuantity(item.cartId, -1)}
                      className="p-1.5 hover:bg-stone-200 text-stone-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.cartId, 1)}
                      className="p-1.5 hover:bg-stone-200 text-stone-600 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    Weighted Item
                  </span>
                )}

                <button
                  onClick={() => onRemove(item.cartId)}
                  className="text-stone-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Totals - compact on mobile */}
      <div className="bg-white p-3 md:p-4 border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
          <div className="flex justify-between text-stone-500 text-sm">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Discount Display */}
          {discount ? (
            <div className="flex justify-between text-red-600 text-sm font-medium">
              <div className="flex flex-col">
                <span className="flex items-center gap-1">
                  <Tag size={12} /> {discount.type} (20%)
                </span>
                <span className="text-[10px] text-red-400 flex items-center gap-1">
                  <Users size={10} /> Applied to {discount.numberOfIds} of {discount.totalPax} pax
                </span>
              </div>
              <span>- ₱{discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <div className="flex justify-between text-stone-400 text-sm">
              <span>Discount</span>
              <span>-</span>
            </div>
          )}

          <div className="flex justify-between text-stone-800 text-lg md:text-xl font-bold pt-2 border-t border-dashed border-stone-200">
            <span>Total</span>
            <span className="font-brand text-xl md:text-2xl">
              ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={onOpenDiscount}
            className={`py-2 px-3 rounded-xl border-2 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
              discount
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {discount ? 'Edit' : 'Discount'}
          </button>
          <button
            onClick={onClear}
            className="py-2 px-3 rounded-xl border-2 border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors"
          >
            Void
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={onSaveForLater}
            disabled={cart.length === 0}
            className="py-2 px-3 rounded-xl border-2 border-blue-100 text-blue-600 font-bold text-xs hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={14} />
            Save
          </button>
          <button
            onClick={onOpenSavedOrders}
            className="py-2 px-3 rounded-xl border-2 border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 relative"
          >
            <Clock size={14} />
            Saved
            {savedOrdersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {savedOrdersCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onConfirmOrder}
          disabled={cart.length === 0}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-base shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-0"
        >
          <span>PAY</span>
          <span>₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(SidebarCart);
