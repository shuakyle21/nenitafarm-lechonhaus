import * as React from 'react';
import { useRef, useState } from 'react';
import { CartItem, DiscountDetails, Order, Staff } from '../types';
import { Printer, X, Download, Loader2, Banknote, CheckCircle } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart?: CartItem[];
  discount?: DiscountDetails | null;
  total?: number;
  onSaveOrder?: (order: Order) => Promise<Order | null>;
  existingOrder?: Order | null;
  tableNumber?: string;
  server?: Staff | null;
}

const EMPTY_CART: CartItem[] = [];

// --- Sub-components ---

import ReceiptPaper from './ReceiptPaper';

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  cart = EMPTY_CART,
  discount = null,
  total = 0,
  onSaveOrder = async () => null,
  existingOrder,
  tableNumber,
  server,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [payment, setPayment] = useState(() => ({
    amountTendered: existingOrder?.cash?.toString() || '',
    paymentMethod: ((existingOrder?.paymentMethod as 'CASH' | 'GCASH' | 'MAYA') || 'CASH'),
    referenceNo: existingOrder?.paymentReference || '',
  }));

  // Snapshot of the order once it has been persisted, so the receipt can show
  // the real DB order number and survive the cart being cleared.
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);
  const [createdAt] = useState(() => new Date().toISOString());

  if (!isOpen) return null;

  // The order being shown: a reprint (existingOrder) or the just-saved order.
  // A brand-new order has no DB number until saved, so it reads "PENDING".
  const sourceOrder = existingOrder ?? savedOrder;

  const orderMeta = {
    orderNo: sourceOrder
      ? sourceOrder.orderNumber != null
        ? sourceOrder.orderNumber.toString().padStart(6, '0')
        : sourceOrder.id?.startsWith('OFFLINE')
          ? 'PENDING SYNC'
          : sourceOrder.id.substring(0, 6)
      : 'PENDING',
    date: sourceOrder ? sourceOrder.date : createdAt,
  };

  // Determine values based on mode
  const activeCart = sourceOrder ? sourceOrder.items : cart;
  const activeTotal = sourceOrder ? sourceOrder.total : total;
  const activeDiscount = sourceOrder ? sourceOrder.discount : discount;

  const subtotal = activeCart.reduce((acc, item) => acc + item.finalPrice, 0);

  // Payment Logic. Once finalized (reprint or saved) use the stored values.
  const enteredCash = parseFloat(payment.amountTendered) || 0;
  const cash = sourceOrder ? sourceOrder.cash ?? 0 : enteredCash;
  const change = sourceOrder
    ? sourceOrder.change ?? 0
    : payment.paymentMethod === 'CASH'
      ? Math.max(0, enteredCash - activeTotal)
      : 0;

  // Paid Check (pre-save only)
  const isPaid = payment.paymentMethod === 'CASH' ? enteredCash >= activeTotal - 0.1 : !!payment.referenceNo;

  const handleDownload = async () => {
    if (receiptRef.current === null) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `nenita-receipt-${orderMeta.orderNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download receipt', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmOrder = async () => {
    if (!isPaid || isSubmitting || savedOrder) return;

    setIsSubmitting(true);
    try {
      const newOrder: Order = {
        // id and orderNumber are assigned by the persistence layer (DB UUID +
        // order_number sequence, or an offline temp id); don't fabricate them.
        id: '',
        date: orderMeta.date,
        items: cart,
        subtotal,
        discount: discount || null,
        total,
        cash: payment.paymentMethod === 'CASH' ? enteredCash : total,
        change,
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.referenceNo,
        tableNumber: existingOrder?.tableNumber || tableNumber,
        serverName: existingOrder?.serverName || server?.name,
      };

      const saved = await onSaveOrder(newOrder);
      if (saved) setSavedOrder(saved);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:h-auto print:block">
      <div className="min-h-full flex flex-col items-center justify-center py-10 print:h-auto print:max-h-none print:block print:py-0">
        {/* Receipt Paper */}
        <ReceiptPaper
          receiptRef={receiptRef}
          orderMeta={orderMeta}
          activeCart={activeCart}
          activeTotal={activeTotal}
          activeDiscount={activeDiscount}
          existingOrder={existingOrder ?? null}
          tableNumber={tableNumber}
          server={server}
          cash={cash}
          change={change}
          payment={payment}
        />

        {/* Payment Input Controls (Screen Only) - Hidden for reprints and once saved */}
        {!sourceOrder && (
          <div className="w-[380px] mt-4 bg-stone-800 p-4 rounded-xl shadow-lg print:hidden space-y-4">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-stone-700 p-1 rounded-lg">
              {['CASH', 'GCASH', 'MAYA'].map((method) => (
                <button type="button"
                  key={method}
                  onClick={() => {
                    setPayment(prev => ({ ...prev, paymentMethod: method as 'CASH' | 'GCASH' | 'MAYA' }));
                  }}
                  className={`text-xs font-bold py-2 rounded-md transition-all ${payment.paymentMethod === method ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-white'}`}
                >
                  {method}
                </button>
              ))}
            </div>

            {payment.paymentMethod === 'CASH' ? (
              <div>
                <div className="flex gap-2 items-center mb-2">
                  <Banknote className="text-green-400" size={20} />
                  <label htmlFor="receipt-cash-tendered" className="text-white font-bold text-sm">Cash Tendered</label>
                </div>
                <div className="flex gap-2">
                  <input
                    id="receipt-cash-tendered"
                    type="number"
                    value={payment.amountTendered}
                    onChange={(e) => setPayment(prev => ({ ...prev, amountTendered: e.target.value }))}
                    placeholder="Enter Amount"
                    className="flex-1 bg-stone-700 text-white font-mono text-xl p-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    autoFocus
                  />
                </div>
                {/* Quick Suggestions */}
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000].map((amt) => (
                    <button type="button"
                      key={amt}
                      onClick={() => setPayment(prev => ({ ...prev, amountTendered: amt.toString() }))}
                      className="flex-1 bg-stone-700 text-stone-300 text-xs py-1 px-2 rounded hover:bg-stone-600 transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => setPayment(prev => ({ ...prev, amountTendered: Math.ceil(activeTotal).toString() }))}
                    className="flex-1 bg-stone-700 text-stone-300 text-xs py-1 px-2 rounded hover:bg-stone-600 transition-colors"
                  >
                    Exact
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                  <p className="text-yellow-200 text-xs text-center">
                    Please verify the transfer of
                    <span className="font-bold text-white text-lg block my-1">
                      ₱{activeTotal.toLocaleString()}
                    </span>
                    to the store account.
                  </p>
                </div>
                <label htmlFor="receipt-reference-no" className="text-white font-bold text-sm mb-1 block">Reference Number</label>
                <input
                  id="receipt-reference-no"
                  type="text"
                  value={payment.referenceNo}
                  onChange={(e) => setPayment(prev => ({ ...prev, referenceNo: e.target.value }))}
                  placeholder="Enter Ref #"
                  className="w-full bg-stone-700 text-white font-mono text-lg p-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}

            {/* CONFIRM BUTTON - Shown only when valid */}
            {isPaid && (
              <button type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300 transition-colors ${
                  isSubmitting
                    ? 'bg-stone-600 text-stone-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <CheckCircle size={24} />
                )}
                {isSubmitting ? 'SAVING...' : 'CONFIRM & SAVE ORDER'}
              </button>
            )}
          </div>
        )}

        {/* Saved confirmation (Screen Only) */}
        {savedOrder && (
          <div className="w-[380px] mt-4 bg-green-600/15 border border-green-500/30 rounded-xl p-3 flex items-center justify-center gap-2 print:hidden">
            <CheckCircle size={20} className="text-green-400" />
            <span className="text-green-200 font-bold text-sm">
              Order #{orderMeta.orderNo} saved
            </span>
          </div>
        )}

        {/* Action Buttons - Hide during print */}
        <div className="mt-4 flex gap-3 w-[380px] print:hidden">
          {savedOrder ? (
            <button type="button"
              onClick={onClose}
              className="flex-1 bg-stone-700 hover:bg-stone-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              New Order
            </button>
          ) : (
            <button type="button"
              onClick={onClose}
              className="size-12 flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
              title="Cancel"
            >
              <X size={20} />
            </button>
          )}

          <button type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 bg-stone-800 hover:bg-stone-900 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-70"
          >
            {isDownloading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download
          </button>

          <button type="button"
            onClick={handlePrint}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <Printer size={18} /> Print Slip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
