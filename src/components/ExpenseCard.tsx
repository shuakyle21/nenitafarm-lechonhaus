import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Trash2 } from 'lucide-react';

export interface ExpenseCardProps {
  reason: string;
  amount: number;
  person: string;
  date: string;
  type: 'EXPENSE' | 'SALES' | 'CASH_DROP';
  onDelete: () => void;
}

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  reason,
  amount,
  person,
  date,
  type,
  onDelete,
}) => {
  const isOutflow = type === 'EXPENSE' || type === 'CASH_DROP';
  const formattedTime = new Date(date).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isOutflow ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
            }`}
          >
            {type === 'EXPENSE' ? (
              <ArrowDownCircle size={18} />
            ) : type === 'CASH_DROP' ? (
              <Wallet size={18} />
            ) : (
              <ArrowUpCircle size={18} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-stone-800 text-sm truncate">{reason}</p>
            <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
              <span className="font-medium">{person}</span>
              <span>•</span>
              <span>{formattedTime}</span>
              {type === 'CASH_DROP' && (
                <span className="bg-stone-200 px-1 rounded text-[10px] font-bold text-stone-600">
                  DROP
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Right: amount + delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-black text-sm ${
              isOutflow ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isOutflow ? '-' : '+'}{formatCurrency(amount)}
          </span>
          <button
            onClick={onDelete}
            className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            aria-label="Delete transaction"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
