import * as React from 'react';
import { CartItem, DiscountDetails, Order, Staff } from '../types';

const formatCurrency = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

interface ReceiptPaperProps {
  receiptRef: React.RefObject<HTMLDivElement>;
  orderMeta: { orderNo: string; date: string };
  activeCart: CartItem[];
  activeTotal: number;
  activeDiscount: DiscountDetails | null;
  existingOrder: Order | null;
  tableNumber?: string;
  server?: Staff | null;
  cash: number;
  change: number;
  payment: { paymentMethod: string; referenceNo: string; amountTendered: string };
}

const ReceiptPaper: React.FC<ReceiptPaperProps> = ({
  receiptRef,
  orderMeta,
  activeCart,
  activeTotal,
  activeDiscount,
  existingOrder,
  tableNumber,
  server,
  cash,
  change,
  payment,
}) => {
  const subtotal = activeCart.reduce((acc, item) => acc + item.finalPrice, 0);

  let discountAmount = 0;
  if (activeDiscount && activeDiscount.totalPax > 0) {
    const costPerPerson = subtotal / activeDiscount.totalPax;
    const discountableAmount = costPerPerson * activeDiscount.numberOfIds;
    discountAmount = discountableAmount * activeDiscount.amount;
  }

  const dateTime = formatDate(orderMeta.date);

  return (
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
          <div className="size-16 mb-2">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="size-full object-contain grayscale"
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
            <p>Order #: {orderMeta.orderNo}</p>
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
              <span>{payment.paymentMethod}</span>
            </div>
            {payment.paymentMethod !== 'CASH' && (
              <div className="flex justify-between font-bold text-xs text-stone-500">
                <span>Ref #</span>
                <span>{payment.referenceNo || existingOrder?.paymentReference || 'N/A'}</span>
              </div>
            )}
            {payment.paymentMethod === 'CASH' && payment.amountTendered && parseFloat(payment.amountTendered) > 0 && (
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
  );
};


export default ReceiptPaper;
