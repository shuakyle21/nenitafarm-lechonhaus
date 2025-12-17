import React, { useState } from 'react';
import { TrendingUp, User } from 'lucide-react';

interface SalesAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  amount: string;
  setAmount: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  person: string;
  setPerson: (val: string) => void;
}

const SalesAdjustmentModal: React.FC<SalesAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  amount,
  setAmount,
  reason,
  setReason,
  person,
  setPerson,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="bg-green-600 text-white p-6 text-center">
          <div className="mx-auto bg-green-700 w-12 h-12 rounded-full flex items-center justify-center mb-3">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-brand font-black uppercase tracking-wide">Add Sales</h2>
          <p className="text-green-100 text-xs mt-1">Record manual sales adjustment</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                ₱
              </span>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xl font-bold text-stone-800 bg-stone-100 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-xl transition-all outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Reason</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 font-medium text-stone-800 bg-stone-100 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-xl transition-all outline-none text-sm"
              placeholder="e.g. Late Entry, Correction"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
              Added By
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                required
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full pl-10 pr-4 py-3 font-medium text-stone-800 bg-stone-100 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-xl transition-all outline-none text-sm"
                placeholder="Name"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold py-3 rounded-xl transition-all text-sm"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? 'Saving...' : 'CONFIRM ADDITION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesAdjustmentModal;
