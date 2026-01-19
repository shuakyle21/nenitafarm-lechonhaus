import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Staff, Attendance, StaffTransaction, StaffTransactionType } from '../types';
import { Plus, Save, X, UserCheck, UserX, FileText, CreditCard, DollarSign, Calculator, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StaffModule: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Absent Modal State
  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);
  const [absentData, setAbsentData] = useState({ staffId: '', reason: '' });

  // Form State
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    role: 'Server',
    pin: '',
    status: 'ACTIVE',
    daily_wage: 0,
  });

  // Payroll & CA State
  const [transactions, setTransactions] = useState<StaffTransaction[]>([]);
  const [isCAModalOpen, setIsCAModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedStaffForAction, setSelectedStaffForAction] = useState<Staff | null>(null);
  const [transactionData, setTransactionData] = useState({ amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
  const [payrollRange, setPayrollRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchStaff();
    fetchAttendance();
    fetchTransactions();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase.from('staff').select('*').order('name');
      if (error) throw error;
      if (data) setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('attendance').select('*').eq('date', today);
      if (error) throw error;
      if (data) setAttendanceList(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('staff').insert([formData]).select().single();

      if (error) throw error;

      if (data) {
        setStaffList([...staffList, data]);
        setIsAddModalOpen(false);
        setFormData({ name: '', role: 'Server', pin: '', status: 'ACTIVE', daily_wage: 0 });
        alert('Staff added successfully!');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to add staff');
    }
  };

  const handleClockIn = async (staffId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            staff_id: staffId,
            clock_in: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            status: 'PRESENT',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAttendanceList([...attendanceList, data]);
        alert('Clocked in successfully!');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in');
    }
  };

  const handleClockOut = async (attendanceId: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', attendanceId);

      if (error) throw error;

      setAttendanceList((prev) =>
        prev.map((a) => (a.id === attendanceId ? { ...a, clock_out: new Date().toISOString() } : a))
      );
      alert('Clocked out successfully!');
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out');
    }
  };

  const handleMarkAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            staff_id: absentData.staffId,
            clock_in: new Date().toISOString(), // Required by schema, but irrelevant for absent
            date: new Date().toISOString().split('T')[0],
            status: 'ABSENT',
            notes: absentData.reason,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setAttendanceList([...attendanceList, data]);
        setIsAbsentModalOpen(false);
        setAbsentData({ staffId: '', reason: '' });
        alert('Marked as absent.');
      }
    } catch (error) {
      console.error('Error marking absent:', error);
      alert('Failed to mark absent');
    }
  };

  const getAttendanceStatus = (staffId: string) => {
    const record = attendanceList.find((a) => a.staff_id === staffId);
    if (!record) return { status: 'NO_RECORD', recordId: null };
    if (record.status === 'ABSENT')
      return { status: 'ABSENT', recordId: record.id, notes: record.notes };
    if (!record.clock_out) return { status: 'CLOCKED_IN', recordId: record.id };
    return { status: 'CLOCKED_OUT', recordId: record.id };
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase.from('staff_transactions').select('*').order('date', { ascending: false });
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getOutstandingAdvance = (staffId: string) => {
    const staffTx = transactions.filter(t => t.staff_id === staffId);
    const advances = staffTx.filter(t => t.type === 'ADVANCE').reduce((sum, t) => sum + Number(t.amount), 0);
    const payments = staffTx.filter(t => t.type === 'PAYMENT' || t.type === 'SALARY_PAYOUT').reduce((sum, t) => sum + Number(t.amount), 0);
    return advances - payments;
  };

  const handleSaveTransaction = async (type: StaffTransactionType) => {
    if (!selectedStaffForAction) return;
    try {
      const { data, error } = await supabase
        .from('staff_transactions')
        .insert([{
          staff_id: selectedStaffForAction.id,
          amount: transactionData.amount,
          type,
          date: transactionData.date,
          notes: transactionData.notes
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTransactions([data, ...transactions]);
        setIsCAModalOpen(false);
        setIsPayModalOpen(false);
        setTransactionData({ amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
        alert(`${type === 'ADVANCE' ? 'Cash Advance' : 'Payment'} recorded successfully!`);
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
      alert('Failed to record transaction');
    }
  };

  // --- Clock & Report Logic ---
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const generateWeeklyReport = async () => {
    try {
      // 1. Fetch last 7 days attendance
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const { data: reportData, error } = await supabase
        .from('attendance')
        .select(
          `
                    *,
                    staff (name, role, daily_wage)
                `
        )
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      if (!reportData || reportData.length === 0) {
        alert('No attendance records found for the last 7 days.');
        return;
      }

      // 2. Generate PDF
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('NENITA FARM LECHON HAUS', 105, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Weekly Attendance & Payroll Report', 105, 30, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 38, { align: 'center' });

      // Table Data
      const tableData = reportData.map((record) => {
        const status = record.status || 'PRESENT';
        const wage = record.staff?.daily_wage || 0;
        const pay = status === 'ABSENT' ? 0 : wage; // Simple logic: No pay if absent

        return [
          record.date,
          record.staff?.name || 'Unknown',
          record.staff?.role || 'Unknown',
          status === 'ABSENT' ? 'ABSENT' : new Date(record.clock_in).toLocaleTimeString(),
          status === 'ABSENT'
            ? record.notes || '-'
            : record.clock_out
              ? new Date(record.clock_out).toLocaleTimeString()
              : 'Active',
          status,
          `P ${wage.toFixed(2)}`,
          `P ${pay.toFixed(2)}`,
        ];
      });

      autoTable(doc, {
        head: [
          ['Date', 'Staff Name', 'Role', 'In', 'Out/Reason', 'Status', 'Daily Rate', 'Est. Pay'],
        ],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] }, // Red header to match brand
      });

      // Force download via Blob and Anchor tag
      const blob = doc.output('blob');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  return (
    <div className="flex-1 bg-stone-100 overflow-hidden flex flex-col font-roboto animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white p-6 border-b border-stone-200 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-brand font-black text-stone-800">Staff Management</h1>
          <p className="text-stone-500 text-sm">Manage servers, roles, and attendance</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Clock Display */}
          <div className="flex flex-col items-end mr-4">
            <div className="text-2xl font-mono font-bold text-stone-800 leading-none">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              {currentTime.toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          <button
            onClick={generateWeeklyReport}
            className="bg-white text-stone-700 border border-stone-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm"
          >
            <FileText size={18} />
            Report
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg"
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((staff) => {
            const { status, recordId, notes } = getAttendanceStatus(staff.id);
            return (
              <div
                key={staff.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-xl overflow-hidden">
                      {staff.image_url ? (
                        <img
                          src={staff.image_url}
                          alt={staff.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        staff.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800">{staff.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
                          {staff.role}
                        </span>
                        <span className="text-xs font-bold text-green-700">
                          P {staff.daily_wage?.toFixed(2)}/day
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status === 'CLOCKED_IN'
                        ? 'bg-green-500'
                        : status === 'ABSENT'
                          ? 'bg-red-500'
                          : 'bg-stone-300'
                    }`}
                    title={status}
                  />
                </div>

                {status === 'ABSENT' ? (
                  <div className="bg-red-50 text-red-800 p-3 rounded-xl text-sm border border-red-100 mb-2">
                    <div className="font-bold flex items-center gap-2">
                      <UserX size={14} /> ABSENT
                    </div>
                    <div className="text-xs mt-1 italic opacity-75">"{notes}"</div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-4">
                    {status === 'CLOCKED_OUT' || status === 'NO_RECORD' ? (
                      <>
                        <button
                          onClick={() => handleClockIn(staff.id)}
                          className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg font-bold text-sm hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <UserCheck size={16} /> Clock In
                        </button>
                        <button
                          onClick={() => {
                            setAbsentData({ ...absentData, staffId: staff.id });
                            setIsAbsentModalOpen(true);
                          }}
                          className="flex-1 bg-stone-100 text-stone-600 py-2 rounded-lg font-bold text-sm hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <UserX size={16} /> Absent
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => recordId && handleClockOut(recordId)}
                        className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <UserX size={16} /> Clock Out
                      </button>
                    )}
                  </div>
                )}

                {/* Payroll & CA Actions */}
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Outstanding CA</span>
                    <span className={`text-sm font-black ${getOutstandingAdvance(staff.id) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      P {getOutstandingAdvance(staff.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setSelectedStaffForAction(staff); setIsCAModalOpen(true); }}
                      className="bg-orange-50 text-orange-700 p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 hover:bg-orange-100 transition-colors"
                    >
                      <DollarSign size={14} /> CA Advance
                    </button>
                    <button
                      onClick={() => { setSelectedStaffForAction(staff); setIsPayModalOpen(true); }}
                      className="bg-blue-50 text-blue-700 p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 hover:bg-blue-100 transition-colors"
                    >
                      <CreditCard size={14} /> Pay CA
                    </button>
                    <button
                      onClick={() => { setSelectedStaffForAction(staff); setIsPayrollModalOpen(true); }}
                      className="bg-purple-50 text-purple-700 p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 hover:bg-purple-100 transition-colors"
                    >
                      <Calculator size={14} /> Payroll
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 className="font-bold text-lg text-stone-800">Add New Staff</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="Server">Server</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">
                  Daily Wage (PHP)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.daily_wage}
                  onChange={(e) =>
                    setFormData({ ...formData, daily_wage: parseFloat(e.target.value) })
                  }
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">
                  PIN (4 digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono tracking-widest text-center text-lg"
                  placeholder="0000"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-stone-800 transition-all mt-4 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Staff Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mark Absent Modal */}
      {isAbsentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-red-50">
              <h2 className="font-bold text-lg text-red-800">Mark Staff as Absent</h2>
              <button
                onClick={() => setIsAbsentModalOpen(false)}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
              >
                <X size={20} className="text-red-500" />
              </button>
            </div>

            <form onSubmit={handleMarkAbsent} className="p-6 space-y-4">
              <p className="text-sm text-stone-600">
                Please provide a reason for this absence. This will be recorded in the attendance
                log.
              </p>
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">
                  Reason for Absence
                </label>
                <textarea
                  required
                  value={absentData.reason}
                  onChange={(e) => setAbsentData({ ...absentData, reason: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                  placeholder="e.g. Sick Leave, Personal Emergency, etc."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition-all mt-4 flex items-center justify-center gap-2"
              >
                <UserX size={20} />
                Confirm Absence
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cash Advance & Payment Modals */}
      {(isCAModalOpen || isPayModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-4 border-b border-stone-100 flex justify-between items-center ${isCAModalOpen ? 'bg-orange-50' : 'bg-blue-50'}`}>
              <h2 className="font-bold text-lg text-stone-800">
                {isCAModalOpen ? 'Cash Advance' : 'Pay Advance'} - {selectedStaffForAction?.name}
              </h2>
              <button
                onClick={() => { setIsCAModalOpen(false); setIsPayModalOpen(false); }}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Amount (PHP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: parseFloat(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Date</label>
                <input
                  type="date"
                  value={transactionData.date}
                  onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1">Notes (Optional)</label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 min-h-[80px]"
                  placeholder="Reason or details..."
                />
              </div>

              <button
                onClick={() => handleSaveTransaction(isCAModalOpen ? 'ADVANCE' : 'PAYMENT')}
                className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all mt-4 flex items-center justify-center gap-2 ${isCAModalOpen ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Save size={20} />
                Confirm {isCAModalOpen ? 'Advance' : 'Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-purple-50">
              <h2 className="font-bold text-lg text-stone-800">Generate Payroll - {selectedStaffForAction?.name}</h2>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={payrollRange.startDate}
                    onChange={(e) => setPayrollRange({ ...payrollRange, startDate: e.target.value })}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={payrollRange.endDate}
                    onChange={(e) => setPayrollRange({ ...payrollRange, endDate: e.target.value })}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <button
                onClick={() => { /* TODO: Generate PDF logic */ }}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-purple-700 transition-all mt-4 flex items-center justify-center gap-2"
              >
                <FileText size={20} />
                Generate Salary Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffModule;
