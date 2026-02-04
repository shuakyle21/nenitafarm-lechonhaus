import * as React from 'react';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, parseISO } from 'date-fns';
import { Booking, MenuItem, CartItem } from '../types';
import { supabase } from '../lib/supabase';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  User,
  FileText,
  CheckCircle,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ShoppingBag,
  CreditCard,
  Printer,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import BookingReceiptPDF from './BookingReceiptPDF';
import BookingItemSelector from './BookingItemSelector';

interface BookingModuleProps {
  items: MenuItem[];
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const BookingModule: React.FC<BookingModuleProps> = ({ items }) => {
  const [date, setDate] = useState<Value>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<'ALL' | 'CATERING' | 'RESERVATION' | 'PRE_ORDER'>(
    'ALL'
  );
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  >('ALL');

  // Form State
  const [formData, setFormData] = useState<Booking>({
    customer_name: '',
    contact_number: '',
    booking_date: format(new Date(), 'yyyy-MM-dd'),
    booking_time: '12:00',
    pax: 10,
    type: 'RESERVATION',
    status: 'PENDING',
    notes: '',
    items: [],
    payment_method: 'CASH',
    total_amount: 0,
  });

  // Item Selection State
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);

  const selectedDate = date instanceof Date ? date : new Date();

  // Filtered Bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesType = filterType === 'ALL' || booking.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;
    return matchesType && matchesStatus;
  });

  useEffect(() => {
    fetchBookings();
    if (!editingId) {
      setFormData((prev) => ({
        ...prev,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
      }));
    }
  }, [date]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', todayStr)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'booking_date') {
      const newDate = parseISO(value);
      if (!isNaN(newDate.getTime())) {
        setDate(newDate);
      }
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id || null);
    setFormData({
      customer_name: booking.customer_name,
      contact_number: booking.contact_number,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      pax: booking.pax,
      type: booking.type,
      status: booking.status,
      notes: booking.notes || '',
      items: booking.items || [],
      payment_method: booking.payment_method || 'CASH',
      total_amount: booking.total_amount || 0,
    });
    const bookingDate = parseISO(booking.booking_date);
    setDate(bookingDate);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      fetchBookings();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      customer_name: '',
      contact_number: '',
      booking_date: format(selectedDate, 'yyyy-MM-dd'),
      booking_time: '12:00',
      pax: 10,
      type: 'RESERVATION',
      status: 'PENDING',
      notes: '',
      items: [],
      payment_method: 'CASH',
      total_amount: 0,
    });
    setIsItemSelectorOpen(false);
  };

  const handlePrintReceipt = async (booking: Booking) => {
    try {
      const blob = await pdf(<BookingReceiptPDF booking={booking} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt');
    }
  };

  // Item Management
  const handleAddItemsFromSelector = (selectedCartItems: CartItem[]) => {
    setFormData((prev) => {
      const newItems = [...(prev.items || []), ...selectedCartItems];
      const newTotal = newItems.reduce((sum, item) => sum + item.finalPrice, 0);
      return { ...prev, items: newItems, total_amount: newTotal };
    });
  };

  const handleRemoveItem = (cartId: string) => {
    setFormData((prev) => {
      const newItems = (prev.items || []).filter((i) => i.cartId !== cartId);
      const newTotal = newItems.reduce((sum, item) => sum + item.finalPrice, 0);
      return { ...prev, items: newItems, total_amount: newTotal };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        pax: Number(formData.pax),
        total_amount: formData.total_amount || 0,
      };

      if (editingId) {
        const { error } = await supabase.from('bookings').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('Booking updated successfully!');
      } else {
        const { error } = await supabase.from('bookings').insert([payload]);
        if (error) throw error;
        alert('Booking saved successfully!');
      }

      resetForm();
      fetchBookings();
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-stone-100 overflow-hidden font-roboto animate-in fade-in duration-300">
      <style>{`
                .react-calendar { width: 100% !important; border: none !important; font-family: inherit; background: transparent; }
                .react-calendar__tile { padding: 1em 0.5em; }
                .react-calendar__tile--active { background: #dc2626 !important; color: white !important; border-radius: 0.5rem; }
                .react-calendar__tile--now { background: #fee2e2; color: #dc2626; border-radius: 0.5rem; }
                .react-calendar__navigation button { font-size: 1.1em; font-weight: bold; }
            `}</style>

      {/* LEFT PANEL: Calendar & List - responsive width */}
      <div className="w-full lg:w-[40%] h-auto lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-stone-200 bg-white overflow-y-auto">
        <div className="p-3 md:p-6 lg:p-8 border-b border-stone-200 bg-stone-50/50 shrink-0">
          <h2 className="text-lg md:text-2xl font-brand font-black text-stone-800 mb-4 md:mb-6 flex items-center gap-2">
            <CalendarIcon className="text-red-600" size={20} />
            <span className="hidden sm:inline">Bookings & Reservations</span>
            <span className="sm:hidden">Bookings</span>
          </h2>
          <div className="calendar-wrapper shadow-lg rounded-2xl overflow-hidden border border-stone-100 bg-white p-1.5 md:p-2">
            <Calendar
              onChange={setDate}
              value={date}
              className="w-full border-none font-sans"
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const hasConfirmed = bookings.some(
                    (b) => b.booking_date === dateStr && b.status === 'CONFIRMED'
                  );
                  if (hasConfirmed)
                    return (
                      <div className="flex justify-center mt-1">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      </div>
                    );
                }
                return null;
              }}
            />
          </div>
        </div>

        <div className="p-3 md:p-6 lg:p-8 bg-stone-50 min-h-0">
          <div className="sticky top-0 bg-stone-50 z-10 pb-4 shadow-sm -mx-6 px-6 pt-2 mb-2">
            <h3 className="font-bold text-stone-700 mb-4 flex items-center justify-between">
              <span>Upcoming Bookings</span>
              <span className="bg-stone-200 text-stone-600 text-xs px-2 py-1 rounded-full">
                {filteredBookings.length}
              </span>
            </h3>
            <div className="flex gap-2 mb-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="flex-1 p-2 text-xs font-bold border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">All Types</option>
                <option value="CATERING">Catering</option>
                <option value="RESERVATION">Reservation</option>
                <option value="PRE_ORDER">Pre-order</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="flex-1 p-2 text-xs font-bold border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-stone-400" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center text-stone-400 py-10 border-2 border-dashed border-stone-200 rounded-xl">
              <p>No upcoming bookings found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`bg-white p-4 rounded-xl shadow-sm border border-stone-200 hover:shadow-md transition-all group ${editingId === booking.id ? 'ring-2 ring-red-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${booking.type === 'CATERING' ? 'bg-purple-100 text-purple-700' : booking.type === 'PRE_ORDER' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {booking.type.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600'}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handlePrintReceipt(booking)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Print Receipt"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(booking)}
                        className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-stone-800 text-lg">{booking.customer_name}</h4>
                  <div className="text-sm text-stone-500 space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-stone-800 font-medium">
                      <CalendarIcon size={14} className="text-red-500" />
                      <span>{format(parseISO(booking.booking_date), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{booking.booking_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span>{booking.pax} Pax</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{booking.contact_number}</span>
                    </div>
                    {booking.type === 'PRE_ORDER' && booking.total_amount && (
                      <div className="flex items-center gap-2 font-bold text-green-600">
                        <CreditCard size={14} />
                        <span>
                          ₱{booking.total_amount.toLocaleString()} ({booking.payment_method})
                        </span>
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500 italic">
                      "{booking.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Form - responsive */}
      <div className="flex-1 p-3 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-4 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100">
            <h3 className="text-xl font-bold text-stone-800">
              {editingId ? 'Edit Booking' : 'New Booking'}
            </h3>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <User size={16} /> Customer Name
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <Phone size={16} /> Contact Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                  placeholder="Enter contact"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">Date</label>
                <input
                  type="date"
                  name="booking_date"
                  value={formData.booking_date}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <Clock size={16} /> Time
                </label>
                <input
                  type="time"
                  name="booking_time"
                  value={formData.booking_time}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <Users size={16} /> Pax
                </label>
                <input
                  type="number"
                  name="pax"
                  value={formData.pax}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Type</label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'RESERVATION' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="RESERVATION"
                    checked={formData.type === 'RESERVATION'}
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  Table Reservation
                </label>
                <label
                  className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'CATERING' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="CATERING"
                    checked={formData.type === 'CATERING'}
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  Catering
                </label>
                <label
                  className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'PRE_ORDER' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="PRE_ORDER"
                    checked={formData.type === 'PRE_ORDER'}
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  Pre-order
                </label>
              </div>
            </div>

            {/* PRE-ORDER SPECIFIC FIELDS */}
            {formData.type === 'PRE_ORDER' && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-4 animate-in slide-in-from-top-2">
                <h4 className="font-bold text-orange-800 flex items-center gap-2">
                  <ShoppingBag size={18} /> Order Details
                </h4>

                {/* Item Selector */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    data-testid="open-item-selector"
                    onClick={() => setIsItemSelectorOpen(true)}
                    className="w-full py-4 border-2 border-dashed border-orange-300 rounded-2xl text-orange-600 font-black uppercase tracking-widest hover:bg-orange-100/50 hover:border-orange-400 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Add Items to Order
                  </button>
                </div>

                {/* Items List */}
                {formData.items && formData.items.length > 0 && (
                  <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                    {formData.items.map((item, idx) => (
                      <div
                        key={item.cartId || idx}
                        className="flex justify-between items-center p-3 border-b border-orange-100 last:border-0 text-sm"
                      >
                        <div>
                          <span className="font-bold text-stone-800">{item.quantity}x</span>{' '}
                          {item.name}{' '}
                          <span className="text-stone-400 text-xs">(@ ₱{item.price})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-stone-600">
                            ₱{item.finalPrice.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.cartId)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-orange-100 flex justify-between items-center font-bold text-orange-900">
                      <span>Total Amount</span>
                      <span data-testid="total-amount">
                        ₱{formData.total_amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method - Available for ALL types */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Payment Method</label>
              <div className="flex gap-2">
                {['CASH', 'GCASH', 'MAYA'].map((method) => (
                  <label
                    key={method}
                    className={`flex-1 cursor-pointer border rounded-lg p-2 text-center text-xs font-bold transition-all ${formData.payment_method === method ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method}
                      checked={formData.payment_method === method}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                <FileText size={16} /> Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all resize-none"
                placeholder="Special requests, allergies, etc."
              />
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-stone-500 font-bold hover:bg-stone-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                {editingId ? 'Update Booking' : 'Save Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <BookingItemSelector
        isOpen={isItemSelectorOpen}
        onClose={() => setIsItemSelectorOpen(false)}
        items={items}
        onAddSelectedItems={handleAddItemsFromSelector}
      />
    </div>
  );
};

export default BookingModule;
