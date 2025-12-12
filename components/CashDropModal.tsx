import React, { useState } from 'react';
import { ArrowDownCircle, CheckCircle, User } from 'lucide-react';

interface CashDropModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number, reason: string, performedBy: string) => Promise<void>;
    isLoading: boolean;
}

const CashDropModal: React.FC<CashDropModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [performedBy, setPerformedBy] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (val > 0 && reason.trim() && performedBy.trim()) {
            onSubmit(val, reason, performedBy);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="bg-red-900 text-white p-6 text-center">
                    <div className="mx-auto bg-red-800 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <ArrowDownCircle size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-brand font-black uppercase tracking-wide">Cash Drop</h2>
                    <p className="text-red-200 text-xs mt-1">Record cash removal from drawer</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Amount to Drop</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">₱</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 text-xl font-bold text-stone-800 bg-stone-100 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Reason / Destination</label>
                        <input
                            type="text"
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 font-medium text-stone-800 bg-stone-100 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all outline-none text-sm"
                            placeholder="e.g. Bank Deposit, Safe Keeping"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Performed By</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input
                                type="text"
                                required
                                value={performedBy}
                                onChange={(e) => setPerformedBy(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 font-medium text-stone-800 bg-stone-100 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all outline-none text-sm"
                                placeholder="Enter your name"
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
                            disabled={isLoading || !amount || !reason || !performedBy}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            {isLoading ? 'Saving...' : 'CONFIRM DROP'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashDropModal;
