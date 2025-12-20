import * as React from 'react';
import { SavedOrder } from '../types';
import { Clock, ShoppingBag, Trash2, ArrowRight, X } from 'lucide-react';

interface SavedOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedOrders: SavedOrder[];
  onRestore: (order: SavedOrder) => void;
  onDelete: (id: string) => void;
}

const SavedOrdersModal: React.FC<SavedOrdersModalProps> = ({
  isOpen,
  onClose,
  savedOrders,
  onRestore,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-900 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Saved Orders</h2>
              <p className="text-red-200 text-sm">Select an order to resume</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
          {savedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400">
              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p className="font-bold text-lg">No saved orders</p>
              <p className="text-sm">Orders you save for later will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-stone-800 text-lg">{order.name}</h3>
                      <div className="flex items-center gap-2 text-stone-500 text-sm mt-1">
                        <Clock size={14} />
                        <span>
                          {order.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="w-1 h-1 bg-stone-300 rounded-full" />
                        <span>
                          {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {order.tableNumber && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                            Table {order.tableNumber}
                          </span>
                        )}
                        {order.serverName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                            Server: {order.serverName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-700 text-lg">
                        ₱
                        {order.items
                          .reduce((acc, item) => acc + item.finalPrice, 0)
                          .toLocaleString()}
                      </div>
                      <span className="text-xs font-bold bg-stone-100 text-stone-600 px-2 py-1 rounded uppercase tracking-wider">
                        {order.orderType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Preview Items */}
                  <div className="bg-stone-50 rounded-lg p-3 mb-4 text-sm text-stone-600">
                    <p className="line-clamp-1">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => onRestore(order)}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowRight size={18} />
                      Resume Order
                    </button>
                    <button
                      onClick={() => onDelete(order.id)}
                      className="px-4 border-2 border-red-100 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
                      title="Delete saved order"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-white text-center text-stone-400 text-xs">
          Saved orders are stored locally and will persist even if you refresh the page.
        </div>
      </div>
    </div>
  );
};

export default SavedOrdersModal;
