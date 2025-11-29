import * as React from 'react';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, parseISO } from 'date-fns';
import { Booking } from '../types';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, Clock, Users, Phone, User, FileText, CheckCircle, XCircle, Loader2, Pencil, Trash2 } from 'lucide-react';

interface BookingModuleProps {
    // Add props if needed later
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const BookingModule: React.FC<BookingModuleProps> = () => {
    const [date, setDate] = useState<Value>(new Date());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter State
    const [filterType, setFilterType] = useState<'ALL' | 'CATERING' | 'RESERVATION'>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

    // Form State
    const [formData, setFormData] = useState<Booking>({
        customer_name: '',
        contact_number: '',
        booking_date: format(new Date(), 'yyyy-MM-dd'),
        booking_time: '12:00',
        pax: 10,
        type: 'RESERVATION',
        status: 'PENDING',
        notes: ''
    });

    const selectedDate = date instanceof Date ? date : new Date();

    // Filtered Bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesType = filterType === 'ALL' || booking.type === filterType;
        const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;
        return matchesType && matchesStatus;
    });

    useEffect(() => {
        fetchBookings();
        // Update form date when calendar selection changes, unless we are editing a specific booking
        if (!editingId) {
            setFormData(prev => ({
                ...prev,
                booking_date: format(selectedDate, 'yyyy-MM-dd')
            }));
        }
    }, [date]); // Keep date dependency to update form, but fetchBookings won't use it for filtering

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            // Fetch all current and future bookings (from today onwards)
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If date input changes, update calendar view
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
            notes: booking.notes || ''
        });
        // Also update calendar to the booking's date
        const bookingDate = parseISO(booking.booking_date);
        setDate(bookingDate);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this booking?')) return;

        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchBookings();
            // If deleting the currently edited item, reset form
            if (editingId === id) {
                resetForm();
            }
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
            notes: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingId) {
                // Update existing booking
                const { error } = await supabase
                    .from('bookings')
                    .update({
                        ...formData,
                        pax: Number(formData.pax)
                    })
                    .eq('id', editingId);

                if (error) throw error;
                alert('Booking updated successfully!');
            } else {
                // Create new booking
                const { error } = await supabase
                    .from('bookings')
                    .insert([{
                        ...formData,
                        pax: Number(formData.pax)
                    }]);

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
        <div className="flex h-full w-full bg-stone-100 overflow-hidden font-roboto animate-in fade-in duration-300">
            {/* Custom Styles for Calendar */}
            <style>{`
                .react-calendar { 
                    width: 100% !important; 
                    border: none !important; 
                    font-family: inherit;
                    background: transparent;
                }
                .react-calendar__tile {
                    padding: 1.5em 0.5em;
                }
                .react-calendar__tile--active {
                    background: #dc2626 !important;
                    color: white !important;
                    border-radius: 0.5rem;
                }
                .react-calendar__tile--now {
                    background: #fee2e2;
                    color: #dc2626;
                    border-radius: 0.5rem;
                }
                .react-calendar__navigation button {
                    font-size: 1.2em;
                    font-weight: bold;
                }
            `}</style>

            {/* LEFT PANEL: Calendar & List (40%) */}
            <div className="w-[40%] h-full flex flex-col border-r border-stone-200 bg-white overflow-y-auto">
                <div className="p-6 border-b border-stone-200 bg-stone-50/50 shrink-0">
                    <h2 className="text-2xl font-brand font-black text-stone-800 mb-6 flex items-center gap-2">
                        <CalendarIcon className="text-red-600" />
                        Bookings & Reservations
                    </h2>
                    <div className="calendar-wrapper shadow-lg rounded-2xl overflow-hidden border border-stone-100 bg-white p-2">
                        <Calendar
                            onChange={setDate}
                            value={date}
                            className="w-full border-none font-sans"
                            tileContent={({ date, view }) => {
                                if (view === 'month') {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const hasConfirmed = bookings.some(b => b.booking_date === dateStr && b.status === 'CONFIRMED');
                                    if (hasConfirmed) {
                                        return (
                                            <div className="flex justify-center mt-1">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            }}
                        />
                    </div>
                </div>

                <div className="p-6 bg-stone-50 min-h-0">
                    <div className="sticky top-0 bg-stone-50 z-10 pb-4 shadow-sm -mx-6 px-6 pt-2 mb-2">
                        <h3 className="font-bold text-stone-700 mb-4 flex items-center justify-between">
                            <span>Upcoming Bookings</span>
                            <span className="bg-stone-200 text-stone-600 text-xs px-2 py-1 rounded-full">{filteredBookings.length}</span>
                        </h3>

                        {/* Filters */}
                        <div className="flex gap-2 mb-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="flex-1 p-2 text-xs font-bold border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="ALL">All Types</option>
                                <option value="CATERING">Catering</option>
                                <option value="RESERVATION">Reservation</option>
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
                            {filteredBookings.map(booking => (
                                <div key={booking.id} className={`bg-white p-4 rounded-xl shadow-sm border border-stone-200 hover:shadow-md transition-all group ${editingId === booking.id ? 'ring-2 ring-red-500' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${booking.type === 'CATERING' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {booking.type}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-stone-100 text-stone-600'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(booking)}
                                                className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(booking.id!)}
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

            {/* RIGHT PANEL: Form (60%) */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
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

                        <div className="grid grid-cols-3 gap-6">
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

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-700">Type</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'RESERVATION' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
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
                                    <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${formData.type === 'CATERING' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
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
        </div>
    );
};

export default BookingModule;
