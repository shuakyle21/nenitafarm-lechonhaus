import * as React from 'react';
import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { X, Scale, Banknote } from 'lucide-react';

interface LechonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (weight: number, price: number) => void;
  item: MenuItem | null;
}

const LechonModal: React.FC<LechonModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
  const [mode, setMode] = useState<'weight' | 'price'>('weight');
  const [inputValue, setInputValue] = useState<string>('0');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setInputValue('0');
      setMode('weight');
    }
  }, [isOpen]);

  // Keyboard Support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumPress(e.key);
      } else if (e.key === '.') {
        handleNumPress('.');
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        // We need to access the latest state for confirmation,
        // but handleConfirm relies on calculated values which are derived from state.
        // Since this effect closes over the initial state, we might have stale closures if we just call handleConfirm directly
        // without dependencies. However, handleConfirm uses displayPrice/Weight which are calculated in render.
        // Actually, handleConfirm calls onConfirm with calculated values.
        // To avoid stale state issues in the event listener, it's better to trigger the button click or use a ref for current values.
        // OR, simply add dependencies to this useEffect.
        // Adding dependencies [inputValue, mode] will re-attach listener on every keystroke, which is fine.
        e.preventDefault();
        // We can't call handleConfirm directly here because it uses variables calculated in the render scope (displayPrice, displayWeight).
        // Instead, let's just trigger the confirm button programmatically or refactor handleConfirm to calculate inside.
        // Let's refactor handleConfirm to calculate inside or use a ref.
        // EASIER: Just click the confirm button if it exists.
        const confirmBtn = document.getElementById('lechon-confirm-btn');
        if (confirmBtn && !confirmBtn.hasAttribute('disabled')) {
          confirmBtn.click();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputValue, mode]); // Re-bind when state changes so we have fresh state if we were to use it directly, though we use DOM click for Enter.

  if (!isOpen || !item) return null;

  const handleNumPress = (num: string) => {
    setInputValue((prev) => {
      if (prev === '0' && num !== '.') return num;
      if (num === '.' && prev.includes('.')) return prev;
      // limit decimals
      if (prev.includes('.')) {
        const parts = prev.split('.');
        if (parts[1].length >= 2) return prev;
      }
      return prev + num;
    });
  };

  const handleBackspace = () => {
    setInputValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleClear = () => {
    setInputValue('0');
  };

  // Calculations
  const numericValue = parseFloat(inputValue) || 0;
  const basePrice = item.price; // Price per KG

  let displayWeight = 0;
  let displayPrice = 0;

  if (mode === 'weight') {
    displayWeight = numericValue;
    displayPrice = numericValue * basePrice;
  } else {
    displayPrice = numericValue;
    displayWeight = numericValue / basePrice;
  }

  const handleConfirm = () => {
    if (displayPrice > 0 && displayWeight > 0) {
      onConfirm(displayWeight, displayPrice);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-brand font-bold">Select Lechon Quantity</h2>
          <button onClick={onClose} className="p-1 hover:bg-red-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 bg-stone-50">
          {/* Toggles */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setMode('weight');
                setInputValue('0');
              }}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                mode === 'weight'
                  ? 'border-red-600 bg-red-50 text-red-800 ring-2 ring-red-200'
                  : 'border-stone-200 bg-white text-stone-500 hover:border-red-200'
              }`}
            >
              <Scale size={24} className="mb-2" />
              <span className="font-bold">By Weight</span>
              <span className="text-xs opacity-75">e.g., 0.5 kg</span>
            </button>

            <button
              onClick={() => {
                setMode('price');
                setInputValue('0');
              }}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                mode === 'price'
                  ? 'border-green-600 bg-green-50 text-green-800 ring-2 ring-green-200'
                  : 'border-stone-200 bg-white text-stone-500 hover:border-green-200'
              }`}
            >
              <Banknote size={24} className="mb-2" />
              <span className="font-bold">By Price</span>
              <span className="text-xs opacity-75">e.g., ₱500</span>
            </button>
          </div>
          
          {/* Quick Select Buttons */}
          <div className="mb-6">
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 px-1">
              Quick Select (By Price)
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[100, 175, 350, 700].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setMode('price');
                    setInputValue(preset.toString());
                  }}
                  className="py-2.5 rounded-lg border-b-4 border-stone-200 bg-white text-stone-700 font-bold text-sm hover:bg-red-50 hover:text-red-700 hover:border-red-200 active:border-b-0 active:mt-1 active:mb-[3px] transition-all shadow-sm"
                >
                  ₱{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Display Preview */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
            <div>
              <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Estimated Weight
              </div>
              <div className="text-2xl font-bold text-stone-800">{displayWeight.toFixed(3)} kg</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Total Price
              </div>
              <div className="text-3xl font-brand font-black text-red-700">
                ₱
                {displayPrice.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
              <button
                key={num}
                onClick={() => handleNumPress(num.toString())}
                className="h-16 rounded-lg bg-white border-b-4 border-stone-200 active:border-b-0 active:mt-1 active:mb-[3px] text-2xl font-bold text-stone-700 hover:bg-stone-100 transition-all flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="h-16 rounded-lg bg-stone-200 border-b-4 border-stone-300 active:border-b-0 active:mt-1 active:mb-[3px] text-stone-600 hover:bg-stone-300 transition-all flex items-center justify-center shadow-sm"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-200 flex gap-4">
          <button
            onClick={handleClear}
            className="flex-1 py-4 font-bold text-stone-500 hover:text-red-600 transition-colors"
          >
            Clear
          </button>
          <button
            id="lechon-confirm-btn"
            onClick={handleConfirm}
            disabled={displayPrice <= 0}
            className="flex-[2] py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CONFIRM ORDER
          </button>
        </div>
      </div>
    </div>
  );
};

export default LechonModal;
