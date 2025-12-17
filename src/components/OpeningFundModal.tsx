import React, { useState } from 'react';
import { Wallet, CheckCircle, User } from 'lucide-react';

interface OpeningFundModalProps {
  isOpen: boolean;
  onSubmit: (amount: number, performedBy: string) => Promise<void>;
  isLoading: boolean;
}

const OpeningFundModal: React.FC<OpeningFundModalProps> = ({ isOpen, onSubmit, isLoading }) => {
  const [amount, setAmount] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val >= 0 && performedBy.trim()) {
      onSubmit(val, performedBy);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 text-center">
          <div className="mx-auto bg-stone-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Wallet size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-2xl font-brand font-black uppercase tracking-wide">Start Shift</h2>
          <p className="text-stone-400 text-sm mt-1">
            Please enter your opening fund / petty cash.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Opening Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold text-stone-800 bg-stone-100 border-2 border-transparent focus:border-yellow-500 focus:bg-white rounded-xl transition-all outline-none"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Counted By
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 font-medium text-stone-800 bg-stone-100 border-2 border-transparent focus:border-yellow-500 focus:bg-white rounded-xl transition-all outline-none"
                  placeholder="Enter your name"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !amount || !performedBy}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-black py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>OPEN REGISTER</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpeningFundModal;
