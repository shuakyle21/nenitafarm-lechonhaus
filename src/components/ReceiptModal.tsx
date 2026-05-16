import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
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

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  cart = [],
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
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'MAYA'>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stable Order Details per session
  const [orderNo, setOrderNo] = useState('');
  const [date, setDate] = useState('');

  // Initialize unique order details when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingOrder) {
        // Use existing order details
        setOrderNo(
          existingOrder.orderNumber?.toString().padStart(6, '0') || existingOrder.id.substring(0, 6)
        );

        // Format date from ISO string if needed, or use as is
        try {
          const dateObj = new Date(existingOrder.date);
          setDate(dateObj.toLocaleString('en-PH'));
        } catch (e) {
          setDate(existingOrder.date);
        }

        setAmountTendered(existingOrder.cash?.toString() || '0');
        setPaymentMethod((existingOrder.paymentMethod as any) || 'CASH');
        setReferenceNo(existingOrder.paymentReference || '');
      } else {
        // New Order: Sequential Order ID
        setOrderNo((orderCount + 1).toString().padStart(6, '0'));
        setDate(new Date().toISOString());
        setAmountTendered('');
        setPaymentMethod('CASH');
        setReferenceNo('');
      }
      setIsSubmitting(false); // Reset submitting state when modal reopened
    }
  }, [isOpen, orderCount, existingOrder]);

  if (!isOpen) return null;

  // Determine values based on mode
  const activeCart = existingOrder ? existingOrder.items : cart;
  const activeTotal = existingOrder ? existingOrder.total : total;
  const activeDiscount = existingOrder ? existingOrder.discount : discount;

  const subtotal = activeCart.reduce((acc, item) => acc + item.finalPrice, 0);

  // Recalculate discount for display logic inside receipt
  let discountAmount = 0;
  if (activeDiscount && activeDiscount.totalPax > 0) {
    const costPerPerson = subtotal / activeDiscount.totalPax;
    const discountableAmount = costPerPerson * activeDiscount.numberOfIds;
    discountAmount = discountableAmount * activeDiscount.amount;
  }

  // Payment Logic
  const cash = parseFloat(amountTendered) || 0;
  // If non-cash, change is 0. If cash, standard calculation.
  const change =
    paymentMethod === 'CASH'
      ? existingOrder
        ? existingOrder.change || 0
        : Math.max(0, cash - activeTotal)
      : 0;

  // Paid Check
  const isPaid = paymentMethod === 'CASH' ? cash >= activeTotal - 0.1 : !!referenceNo; // Digital payments require a reference number (simple validation)

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return { date: '', time: '' };
      const d = new Date(dateString);
      return {
        date: d.toLocaleDateString('en-PH'),
        time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  const handleDownload = async () => {
    if (receiptRef.current === null) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `nenita-receipt-${orderNo}.png`;
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
        id: orderNo,
        date: date,
        items: cart,
        subtotal,
        discount: discount || null,
        total,
        cash: paymentMethod === 'CASH' ? cash : total, // Record full amount as 'cash' equivalent for digital or distinct?
        // Better: Keep cash as tendered amount.
        change,
        paymentMethod,
        paymentReference: referenceNo,
        tableNumber: existingOrder?.tableNumber || tableNumber,
        serverName: existingOrder?.serverName || server?.name,
      };

      await onSaveOrder(newOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateTime = formatDate(date);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:h-auto print:block">
      <div className="min-h-full flex flex-col items-center justify-center py-10 print:h-auto print:max-h-none print:block print:py-0">
        {/* Receipt Paper */}
        <div
          ref={receiptRef}
          className="w-[380px] bg-white shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-4 duration-300 print:shadow-none print:w-full print:absolute print:top-0 print:left-0 print:m-0 shrink-0 font-receipt"
        >
          {/* Jagged Top */}
          <div
            className="w-full h-4 bg-stone-900 absolute top-0 z-10 print:hidden"
            style={{
              clipPath:
                'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)',
            }}
          ></div>

          <div className="flex-1 p-8 pt-10 text-xs text-stone-900 leading-relaxed print:overflow-visible min-h-[500px]">
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-stone-400 flex flex-col items-center">
              <div className="w-16 h-16 mb-2">
                <img
                  src="/assets/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain grayscale"
                />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wider mb-1 leading-tight">
                Nenita Farm Lechon Haus
              </h1>
              <h2 className="text-[10px] font-bold uppercase mb-3 tracking-widest">
                and Catering Services
              </h2>
              <div className="space-y-1 text-[11px] uppercase tracking-wide">
                <p>Natn.l Highway, Brgy. Poblacion</p>
                <p>Banga, South Cotabato</p>
                <p>Tel: +63 953 625 0833</p>
                <p>VAT REG TIN: 000-123-456-000</p>
              </div>
            </div>

            {/* Info */}
            <div className="flex justify-between mb-4 text-[11px] uppercase font-bold border-b border-dashed border-stone-400 pb-4">
              <div className="text-left space-y-1">
                <p>Order #: {orderNo}</p>
                <p>
                  Table:{' '}
                  {existingOrder?.tableNumber || tableNumber || 'N/A'}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p>{dateTime.date}</p>
                <p>{dateTime.time}</p>
                <p>Server: {existingOrder?.serverName || server?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="grid grid-cols-[30px_1fr_70px] gap-x-2 pb-2 mb-2 font-bold uppercase text-[11px] border-b border-dashed border-stone-400">
                <span>Qty</span>
                <span>Item</span>
                <span className="text-right">Amt</span>
              </div>
              <div className="space-y-2">
                {activeCart.map((item) => (
                  <div
                    key={item.cartId}
                    className="grid grid-cols-[30px_1fr_70px] gap-x-2 text-[11px] uppercase items-start"
                  >
                    <span className="font-bold">{item.isWeighted ? '1' : item.quantity}</span>
                    <div>
                      <div className="leading-tight">
                        {item.name}
                        {item.weight && (
                          <span className="ml-1 font-normal normal-case">
                            (
                            {item.weight < 1
                              ? `${Math.round(item.weight * 1000)}g`
                              : `${item.weight.toFixed(2)}kg`}
                            )
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-right font-medium">
                      {formatCurrency(item.finalPrice).replace('₱', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-stone-400 pt-4 space-y-1 text-[11px] uppercase">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              {activeDiscount && (
                <>
                  <div className="flex justify-between text-stone-500 mt-1">
                    <span>Total Pax:</span>
                    <span>{activeDiscount.totalPax}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>{activeDiscount.type} Pax:</span>
                    <span>{activeDiscount.numberOfIds}</span>
                  </div>
                  <div className="flex justify-between text-stone-800 font-bold">
                    <span>Less: {activeDiscount.type} (20%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-xl font-bold mt-4 border-y-2 border-dashed border-stone-400 py-3">
                <span>TOTAL</span>
                <span>{formatCurrency(activeTotal)}</span>
              </div>

              {/* Payment Details */}
              <div className="pt-4 space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>Payment Method</span>
                  <span>{paymentMethod}</span>
                </div>
                {paymentMethod !== 'CASH' && (
                  <div className="flex justify-between font-bold text-xs text-stone-500">
                    <span>Ref #</span>
                    <span>{referenceNo || existingOrder?.paymentReference || 'N/A'}</span>
                  </div>
                )}
                {paymentMethod === 'CASH' && cash > 0 && (
                  <>
                    <div className="flex justify-between font-bold text-sm mt-1">
                      <span>CASH</span>
                      <span>{formatCurrency(cash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>CHANGE</span>
                      <span>{formatCurrency(change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Discount Details */}
            {activeDiscount && (
              <div className="mt-6 border border-stone-400 p-2 text-[10px] uppercase text-center border-dashed">
                <p className="font-bold border-b border-stone-300 pb-1 mb-1 border-dashed">
                  Discount Details
                </p>
                <p>ID: {activeDiscount.idNumber}</p>
                <p>Name: {activeDiscount.name}</p>
              </div>
            )}

            {/* Footer Disclaimer */}
            <div className="text-center mt-10 text-[10px] uppercase space-y-1 font-bold text-stone-600">
              <p>*** This is not an official receipt ***</p>
              <p>Please request official receipt</p>
              <p>at the cashier</p>
              <p className="pt-4 text-xs">Thank you for dining with us!</p>
            </div>
          </div>

          {/* Jagged Bottom */}
          <div
            className="w-full h-4 bg-stone-900 absolute bottom-0 z-10 print:hidden"
            style={{
              clipPath:
                'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)',
              transform: 'rotate(180deg)',
            }}
          ></div>
        </div>

        {/* Payment Input Controls (Screen Only) - Hide if viewing existing order */}
        {!existingOrder && (
          <div className="w-[380px] mt-4 bg-stone-800 p-4 rounded-xl shadow-lg print:hidden space-y-4">
            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-stone-700 p-1 rounded-lg">
              {['CASH', 'GCASH', 'MAYA'].map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method as any);
                  }}
                  className={`text-xs font-bold py-2 rounded-md transition-all ${paymentMethod === method ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-white'}`}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'CASH' ? (
              <div>
                <div className="flex gap-2 items-center mb-2">
                  <Banknote className="text-green-400" size={20} />
                  <label className="text-white font-bold text-sm">Cash Tendered</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder="Enter Amount"
                    className="flex-1 bg-stone-700 text-white font-mono text-xl p-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    autoFocus
                  />
                </div>
                {/* Quick Suggestions */}
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmountTendered(amt.toString())}
                      className="flex-1 bg-stone-700 text-stone-300 text-xs py-1 px-2 rounded hover:bg-stone-600 transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmountTendered(Math.ceil(activeTotal).toString())}
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
                <label className="text-white font-bold text-sm mb-1 block">Reference Number</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Enter Ref #"
                  className="w-full bg-stone-700 text-white font-mono text-lg p-2 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}

            {/* CONFIRM BUTTON - Shown only when valid */}
            {isPaid && (
              <button
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
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
            title="Cancel"
          >
            <X size={20} />
          </button>

          <button
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

          <button
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
