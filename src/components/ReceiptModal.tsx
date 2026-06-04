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
  orderCount?: number;
  onSaveOrder?: (order: Order) => void;
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
  orderCount = 0,
  onSaveOrder = () => {},
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

  const [orderMeta] = useState(() => ({
    orderNo: existingOrder
      ? (existingOrder.orderNumber?.toString().padStart(6, '0') || existingOrder.id.substring(0, 6))
      : (orderCount + 1).toString().padStart(6, '0'),
    date: existingOrder ? existingOrder.date : new Date().toISOString(),
  }));

  if (!isOpen) return null;

  // Determine values based on mode
  const activeCart = existingOrder ? existingOrder.items : cart;
  const activeTotal = existingOrder ? existingOrder.total : total;
  const activeDiscount = existingOrder ? existingOrder.discount : discount;

  const subtotal = activeCart.reduce((acc, item) => acc + item.finalPrice, 0);

  // Payment Logic
  const cash = parseFloat(payment.amountTendered) || 0;
  // If non-cash, change is 0. If cash, standard calculation.
  const change =
    payment.paymentMethod === 'CASH'
      ? existingOrder
        ? existingOrder.change || 0
        : Math.max(0, cash - activeTotal)
      : 0;

  // Paid Check
  const isPaid = payment.paymentMethod === 'CASH' ? cash >= activeTotal - 0.1 : !!payment.referenceNo; // Digital payments require a reference number (simple validation)

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
    if (!isPaid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newOrder: Order = {
        id: orderMeta.orderNo,
        date: orderMeta.date,
        items: cart,
        subtotal,
        discount: discount || null,
        total,
        cash: payment.paymentMethod === 'CASH' ? cash : total, // Record full amount as 'cash' equivalent for digital or distinct?
        // Better: Keep cash as tendered amount.
        change,
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.referenceNo,
        tableNumber: existingOrder?.tableNumber || tableNumber,
        serverName: existingOrder?.serverName || server?.name,
      };

      await onSaveOrder(newOrder);
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

        {/* Payment Input Controls (Screen Only) - Hide if viewing existing order */}
        {!existingOrder && (
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

        {/* Action Buttons - Hide during print */}
        <div className="mt-4 flex gap-3 w-[380px] print:hidden">
          <button type="button"
            onClick={onClose}
            className="size-12 flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
            title="Cancel"
          >
            <X size={20} />
          </button>

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
