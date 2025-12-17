import * as React from 'react';
import { useState } from 'react';
import { X, User, CreditCard, Percent, Users } from 'lucide-react';
import { DiscountDetails, DiscountType } from '../types';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (details: DiscountDetails) => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, onApply }) => {
  const [type, setType] = useState<DiscountType>('SENIOR');
  const [idNumber, setIdNumber] = useState('');
  const [name, setName] = useState('');
  const [totalPax, setTotalPax] = useState<string>('1');
  const [numberOfIds, setNumberOfIds] = useState<string>('1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pax = parseInt(totalPax) || 1;
    const ids = parseInt(numberOfIds) || 1;

    if (ids > pax) {
      alert('Number of IDs cannot be greater than Total Pax.');
      return;
    }

    if (idNumber && name) {
      onApply({
        type,
        idNumber,
        name,
        totalPax: pax,
        numberOfIds: ids,
        amount: 0.2, // 20% Standard Discount
      });
      onClose();
      // Reset fields
      setIdNumber('');
      setName('');
      setTotalPax('1');
      setNumberOfIds('1');
      setType('SENIOR');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-yellow-500 text-stone-900 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Percent className="w-6 h-6 text-stone-900" />
            <h2 className="text-xl font-bold uppercase tracking-wide">Apply Discount</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-yellow-600/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Discount Type Selector */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('SENIOR')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                type === 'SENIOR'
                  ? 'border-yellow-500 bg-yellow-50 text-stone-900'
                  : 'border-stone-200 text-stone-400 hover:border-stone-300'
              }`}
            >
              <User size={24} />
              <span className="font-bold">Senior Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => setType('PWD')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                type === 'PWD'
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-stone-200 text-stone-400 hover:border-stone-300'
              }`}
            >
              <CreditCard size={24} />
              <span className="font-bold">PWD</span>
            </button>
          </div>

          {/* Pax and ID Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1 uppercase text-xs tracking-wider">
                Total Diners (Pax)
              </label>
              <div className="relative">
                <Users
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  size={16}
                />
                <input
                  type="number"
                  min="1"
                  required
                  value={totalPax}
                  onChange={(e) => setTotalPax(e.target.value)}
                  className="w-full pl-10 p-3 bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-stone-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1 uppercase text-xs tracking-wider">
                No. of IDs
              </label>
              <div className="relative">
                <CreditCard
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  size={16}
                />
                <input
                  type="number"
                  min="1"
                  max={totalPax}
                  required
                  value={numberOfIds}
                  onChange={(e) => setNumberOfIds(e.target.value)}
                  className="w-full pl-10 p-3 bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-bold text-stone-800"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1 uppercase text-xs tracking-wider">
                Representative ID #
              </label>
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter ID Number"
                className="w-full p-3 bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1 uppercase text-xs tracking-wider">
                Cardholder Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Full Name"
                className="w-full p-3 bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 flex justify-between items-center">
            <span className="text-stone-500 font-medium text-sm">Application</span>
            <span className="text-sm font-bold text-stone-800 text-right">
              20% off on {numberOfIds}/{totalPax} share
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-stone-900 text-white font-bold rounded-xl shadow-lg hover:bg-stone-800 active:scale-[0.98] transition-all"
          >
            APPLY DISCOUNT
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiscountModal;
