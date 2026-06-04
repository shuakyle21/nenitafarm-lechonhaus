import * as React from 'react';
import { useState } from 'react';
import { MenuItem, Category } from '../types';
import { CATEGORIES } from '../constants';
import { X, Plus, Save, Trash2, Edit2, Image, Search, ArrowLeft, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  onUpdate: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

const MenuManagementModal: React.FC<MenuManagementModalProps> = ({
  isOpen,
  onClose,
  items,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState<{ item: MenuItem | null; formData: Partial<MenuItem> }>({
    item: null,
    formData: { name: '', price: 0, category: 'Lechon & Grills', image: '', isWeighted: false },
  });

  if (!isOpen) return null;

  const handleEdit = (item: MenuItem) => {
    setEditing({ item, formData: { ...item } });
    setView('FORM');
  };

  const handleAddNew = () => {
    setEditing({
      item: null,
      formData: { name: '', price: 0, category: 'Lechon & Grills', image: 'https://picsum.photos/400/300', isWeighted: false },
    });
    setView('FORM');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing.formData.name || !editing.formData.price || !editing.formData.category) return;

    if (editing.item) {
      onUpdate({ ...editing.item, ...(editing.formData as MenuItem) });
    } else {
      onAdd({ id: Math.random().toString(36).substr(2, 9), ...(editing.formData as Omit<MenuItem, 'id'>) });
    }
    setView('LIST');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(id);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {view === 'FORM' && (
              <button type="button"
                onClick={() => setView('LIST')}
                className="p-1 hover:bg-stone-700 rounded-full transition-colors mr-2"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold uppercase tracking-wide">
              {view === 'LIST' ? 'Menu Management' : editing.item ? 'Edit Item' : 'Add New Item'}
            </h2>
          </div>
          <button type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-stone-50">
          {view === 'LIST' ? (
            <>
              {/* Toolbar */}
              <div className="p-4 bg-white border-b border-stone-200 flex gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    size={20}
                  />
                  <input
                    type="text"
                    aria-label="Search menu items"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>
                <button type="button"
                  onClick={handleAddNew}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Plus size={20} />
                  Add Item
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4 hover:border-stone-300 transition-colors group"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-16 rounded-lg object-cover bg-stone-100"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-stone-800">{item.name}</h3>
                          {item.isWeighted && (
                            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded uppercase">
                              Weighted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500">{item.category}</p>
                      </div>

                      <div className="text-right mr-4">
                        <div className="font-bold text-stone-800">
                          ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                        {item.isWeighted && <div className="text-xs text-stone-400">per kg</div>}
                      </div>

                      <div className="flex gap-2">
                        <button type="button"
                          onClick={() => handleEdit(item)}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredItems.length === 0 && (
                    <div className="text-center py-20 text-stone-400">No items found.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // FORM VIEW
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label htmlFor="menu-item-name" className="block text-sm font-bold text-stone-600 mb-2 uppercase text-xs tracking-wider">
                      Item Name
                    </label>
                    <input
                      id="menu-item-name"
                      type="text"
                      required
                      value={editing.formData.name}
                      onChange={(e) => setEditing(prev => ({ ...prev, formData: { ...prev.formData, name: e.target.value } }))}
                      className="w-full p-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 font-medium"
                      placeholder="e.g. Crispy Pata"
                    />
                  </div>

                  <div>
                    <label htmlFor="menu-item-price" className="block text-sm font-bold text-stone-600 mb-2 uppercase text-xs tracking-wider">
                      Price (₱)
                    </label>
                    <input
                      id="menu-item-price"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editing.formData.price}
                      onChange={(e) =>
                        setEditing(prev => ({ ...prev, formData: { ...prev.formData, price: parseFloat(e.target.value) } }))
                      }
                      className="w-full p-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="menu-item-category" className="block text-sm font-bold text-stone-600 mb-2 uppercase text-xs tracking-wider">
                      Category
                    </label>
                    <select
                      id="menu-item-category"
                      value={editing.formData.category}
                      onChange={(e) =>
                        setEditing(prev => ({ ...prev, formData: { ...prev.formData, category: e.target.value as Category } }))
                      }
                      className="w-full p-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 font-medium"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="menu-item-image-url" className="block text-sm font-bold text-stone-600 mb-2 uppercase text-xs tracking-wider">
                      Image URL
                    </label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Image
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          size={20}
                        />
                        <input
                          id="menu-item-image-url"
                          type="text"
                          value={editing.formData.image}
                          onChange={(e) => setEditing(prev => ({ ...prev, formData: { ...prev.formData, image: e.target.value } }))}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 font-medium"
                          placeholder="https://..."
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <label
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${uploading ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
                          >
                            <Upload size={14} />
                            <span className="text-xs font-bold">
                              {uploading ? 'Uploading...' : 'Upload'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading}
                              onChange={async (e) => {
                                if (!e.target.files || e.target.files.length === 0) return;

                                try {
                                  setUploading(true);
                                  const file = e.target.files[0];
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                                  const filePath = `${fileName}`;

                                  const { error: uploadError } = await supabase.storage
                                    .from('menu-images')
                                    .upload(filePath, file);

                                  if (uploadError) throw uploadError;

                                  const { data } = supabase.storage
                                    .from('menu-images')
                                    .getPublicUrl(filePath);

                                  setEditing(prev => ({ ...prev, formData: { ...prev.formData, image: data.publicUrl } }));
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                  alert('Error uploading image');
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="size-12 rounded-lg bg-stone-200 border border-stone-300 overflow-hidden shrink-0">
                        {editing.formData.image && (
                          <img
                            src={editing.formData.image}
                            alt="Preview"
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-white border border-stone-300 rounded-xl cursor-pointer hover:border-stone-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={editing.formData.isWeighted}
                        onChange={(e) => setEditing(prev => ({ ...prev, formData: { ...prev.formData, isWeighted: e.target.checked } }))}
                        className="size-5 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                      <div>
                        <span className="block font-bold text-stone-800">Weighted Item</span>
                        <span className="text-xs text-stone-500">
                          Price is calculated per kilogram (e.g. Lechon)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-stone-200 mt-6">
                  <button
                    type="button"
                    onClick={() => setView('LIST')}
                    className="flex-1 py-3 text-stone-600 font-bold hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-stone-900 text-white font-bold rounded-xl shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {editing.item ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManagementModal;
