import * as React from 'react';
import { Variant } from '../types';
import { X } from 'lucide-react';

interface VariantSelectorProps {
  item: { name: string; variants?: Variant[] };
  onSelect: (variant: Variant) => void;
  onClose: () => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({ item, onSelect, onClose }) => {
  if (!item.variants) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="font-bold text-lg text-stone-800">Select Size for {item.name}</h3>
          <button type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="size-5 text-stone-500" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {item.variants.map((variant) => (
            <button type="button"
              key={variant.name}
              onClick={() => onSelect(variant)}
              className="w-full flex justify-between items-center p-4 border border-stone-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <span className="font-medium text-stone-700 group-hover:text-orange-700">
                {variant.name}
              </span>
              <span className="font-bold text-orange-600">₱{variant.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
