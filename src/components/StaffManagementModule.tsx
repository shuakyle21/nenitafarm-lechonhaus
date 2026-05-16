import React, { useState, useEffect, useMemo } from 'react';
import { Staff, Attendance, StaffTransaction } from '@/types';
import { staffManagementService } from '@/services/staffManagementService';
import { 
  Plus, X, UserCheck, UserX, FileText, DollarSign, Calculator, 
  Settings, Search, Filter, ChevronRight, Clock, Wallet, Users,
  Edit2, Trash2, Save, ArrowLeft
} from 'lucide-react';
import StaffDetailedManagement from './StaffDetailedManagement';
import BulkPayrollGeneration from './BulkPayrollGeneration';
import FinancialLedger from './FinancialLedger';

type ViewMode = 'grid' | 'manage' | 'payroll' | 'ledger';
type RoleFilter = 'All' | 'Server' | 'Cashier' | 'Kitchen' | 'Manager';

const StaffManagementModule: React.FC = () => {
  // Core State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<StaffTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [showCAModal, setShowCAModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  
  // Form States
  const [staffForm, setStaffForm] = useState<Partial<Staff>>({
    name: '', role: 'Server', pin: '', status: 'ACTIVE', daily_wage: 0
  });
  const [absentReason, setAbsentReason] = useState('');
  const [caForm, setCAForm] = useState({ amount: 0, reason: '' });
  const [deductionForm, setDeductionForm] = useState({ 
    amount: 0, type: 'Uniform' as string, description: '' 
  });
  const [payrollRange, setPayrollRange] = useState({
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data fetching
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [staff, attendance, txs] = await Promise.all([
        staffManagementService.getStaff(),
        staffManagementService.getAttendance(),
        staffManagementService.getTransactions(),
      ]);
      setStaffList(staff);
      setAttendanceList(attendance);
      setTransactions(txs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesRole = roleFilter === 'All' || s.role === roleFilter;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [staffList, roleFilter, searchQuery]);

  // Attendance helpers
  const getAttendanceStatus = (staffId: string) => {
    const record = attendanceList.find(a => a.staff_id === staffId);
    if (!record) return { status: 'NO_RECORD', recordId: null, notes: '' };
    if (record.status === 'ABSENT') return { status: 'ABSENT', recordId: record.id, notes: record.notes };
    if (!record.clock_out) return { status: 'CLOCKED_IN', recordId: record.id, notes: '' };
    return { status: 'CLOCKED_OUT', recordId: record.id, notes: '' };
  };

  const getOutstandingCA = (staffId: string) => {
    return transactions
      .filter(t => t.staff_id === staffId && t.type === 'ADVANCE' && t.status === 'ACTIVE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  // Actions
  const handleClockIn = async (staffId: string) => {
    try {
      const record = await staffManagementService.clockIn(staffId);
      setAttendanceList(prev => [...prev, record]);
    } catch (error) {
      console.error('Clock in error:', error);
      alert('Failed to clock in');
    }
  };

  const handleClockOut = async (attendanceId: string) => {
    try {
      await staffManagementService.clockOut(attendanceId);
      setAttendanceList(prev => prev.map(a => 
        a.id === attendanceId ? { ...a, clock_out: new Date().toISOString() } : a
      ));
    } catch (error) {
      console.error('Clock out error:', error);
      alert('Failed to clock out');
    }
  };

  const handleMarkAbsent = async () => {
    if (!selectedStaff) return;
    try {
      const record = await staffManagementService.markAbsent(selectedStaff.id, absentReason);
      setAttendanceList(prev => [...prev, record]);
      setShowAbsentModal(false);
      setAbsentReason('');
    } catch (error) {
      console.error('Mark absent error:', error);
      alert('Failed to mark absent');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newStaff = await staffManagementService.createStaff(staffForm);
      setStaffList(prev => [...prev, newStaff]);
      setShowAddModal(false);
      setStaffForm({ name: '', role: 'Server', pin: '', status: 'ACTIVE', daily_wage: 0 });
    } catch (error) {
      console.error('Add staff error:', error);
      alert('Failed to add staff');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await staffManagementService.deleteStaff(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
      if (selectedStaff?.id === id) {
        setSelectedStaff(null);
        setViewMode('grid');
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      alert('Failed to delete staff');
    }
  };

  const handleIssueCA = async () => {
    if (!selectedStaff) return;
    try {
      await staffManagementService.createTransaction({
        staff_id: selectedStaff.id,
        amount: caForm.amount,
        type: 'ADVANCE',
        description: caForm.reason,
        status: 'ACTIVE',
      });
      await fetchAllData();
      setShowCAModal(false);
      setCAForm({ amount: 0, reason: '' });
    } catch (error) {
      console.error('Issue CA error:', error);
      alert('Failed to issue cash advance');
    }
  };

  const handleApplyDeduction = async () => {
    if (!selectedStaff) return;
    try {
      await staffManagementService.createTransaction({
        staff_id: selectedStaff.id,
        amount: deductionForm.amount,
        type: 'DEDUCTION',
        description: `${deductionForm.type}: ${deductionForm.description}`,
        status: 'APPLIED',
      });
      await fetchAllData();
      setShowDeductionModal(false);
      setDeductionForm({ amount: 0, type: 'Uniform', description: '' });
    } catch (error) {
      console.error('Apply deduction error:', error);
      alert('Failed to apply deduction');
    }
  };

  // Role badge colors
  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      Server: 'bg-emerald-100 text-emerald-700',
      Cashier: 'bg-blue-100 text-blue-700',
      Kitchen: 'bg-amber-100 text-amber-700',
      Manager: 'bg-purple-100 text-purple-700',
    };
    return styles[role] || 'bg-stone-100 text-stone-700';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-stone-50 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 p-3 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title row */}
          <div className="flex items-center gap-3">
            {viewMode !== 'grid' && (
              <button
                onClick={() => { setViewMode('grid'); setSelectedStaff(null); }}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-stone-800 truncate">
                {viewMode === 'grid' && 'Staff Management'}
                {viewMode === 'manage' && 'Staff Details'}
                {viewMode === 'payroll' && 'Bulk Payroll'}
                {viewMode === 'ledger' && 'Financial Ledger'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 hidden sm:block">
                {viewMode === 'grid' && 'Manage servers, roles, and attendance'}
                {viewMode === 'manage' && 'Personal info, employment details, and payroll history'}
                {viewMode === 'payroll' && 'Generate payroll for selected staff'}
                {viewMode === 'ledger' && 'Overview of all financial transactions'}
              </p>
            </div>
          </div>
          
          {/* Actions row */}
          <div className="flex items-center gap-2">
            {/* Clock - desktop only */}
            <div className="hidden md:flex flex-col items-end mr-2">
              <div className="text-lg font-mono font-bold text-stone-800 leading-none">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-xs text-stone-400 uppercase tracking-wide">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
            
            {viewMode === 'grid' && (
              <>
                <button
                  onClick={() => setViewMode('ledger')}
                  className="px-3 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium flex items-center gap-1.5 hover:bg-stone-200 transition-colors text-sm"
                >
                  <Wallet size={16} />
                  <span className="hidden sm:inline">Ledger</span>
                </button>
                <button
                  onClick={() => setViewMode('payroll')}
                  className="px-3 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium flex items-center gap-1.5 hover:bg-stone-200 transition-colors text-sm"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Bulk Payroll</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-2 bg-stone-900 text-white rounded-lg font-medium flex items-center gap-1.5 hover:bg-stone-800 transition-colors text-sm"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Add Staff</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Filters (Grid View Only) */}
        {viewMode === 'grid' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 snap-x">
              <Filter size={16} className="text-stone-400 shrink-0" />
              {(['All', 'Server', 'Cashier', 'Kitchen', 'Manager'] as RoleFilter[]).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap snap-start shrink-0 ${
                    roleFilter === role 
                      ? 'bg-stone-900 text-white' 
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-8">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredStaff.map(staff => {
              const { status, recordId } = getAttendanceStatus(staff.id);
              const outstandingCA = getOutstandingCA(staff.id);
              
              return (
                <div key={staff.id} className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
                  {/* Staff Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-lg overflow-hidden">
                        {staff.image_url ? (
                          <img src={staff.image_url} alt={staff.name} className="w-full h-full object-cover" />
                        ) : staff.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-800">{staff.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(staff.role)}`}>
                            {staff.role}
                          </span>
                          <span className="text-xs text-emerald-600 font-medium">
                            ₱{staff.daily_wage?.toFixed(2)}/day
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      status === 'CLOCKED_IN' ? 'bg-emerald-500' :
                      status === 'ABSENT' ? 'bg-red-500' : 'bg-stone-300'
                    }`} />
                  </div>
                  
                  {/* Clock In/Out Buttons */}
                  <div className="flex gap-2 mb-4">
                    {status === 'NO_RECORD' || status === 'CLOCKED_OUT' ? (
                      <>
                        <button
                          onClick={() => handleClockIn(staff.id)}
                          className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
                        >
                          <Clock size={15} /> Clock In
                        </button>
                        <button
                          onClick={() => { setSelectedStaff(staff); setShowAbsentModal(true); }}
                          className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-stone-200 transition-colors"
                        >
                          <UserX size={15} /> Absent
                        </button>
                      </>
                    ) : status === 'CLOCKED_IN' ? (
                      <button
                        onClick={() => recordId && handleClockOut(recordId)}
                        className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors"
                      >
                        <UserX size={15} /> Clock Out
                      </button>
                    ) : (
                      <div className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium text-center">
                        Marked Absent
                      </div>
                    )}
                  </div>
                  
                  {/* Outstanding CA */}
                  <div className="flex items-center justify-between py-2 border-t border-stone-100">
                    <span className="text-xs text-stone-400 uppercase tracking-wide font-medium">Outstanding CA</span>
                    <span className={`text-sm font-bold ${outstandingCA > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ₱ {outstandingCA.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => { setSelectedStaff(staff); setShowCAModal(true); }}
                      className="py-2 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 hover:bg-orange-100 transition-colors"
                    >
                      <DollarSign size={14} />
                      CA Advance
                    </button>
                    <button
                      onClick={() => { setSelectedStaff(staff); setShowDeductionModal(true); }}
                      className="py-2 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 hover:bg-blue-100 transition-colors"
                    >
                      <Wallet size={14} />
                      Deduction
                    </button>
                    <button
                      onClick={() => { setSelectedStaff(staff); setViewMode('manage'); }}
                      className="py-2 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-0.5 hover:bg-purple-100 transition-colors"
                    >
                      <Settings size={14} />
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Staff Member Detailed Management View */}
        {viewMode === 'manage' && selectedStaff && (
          <StaffDetailedManagement
            staff={selectedStaff}
            transactions={transactions.filter(t => t.staff_id === selectedStaff.id)}
            onSave={async (updates) => {
              try {
                await staffManagementService.updateStaff(selectedStaff.id, updates);
                await fetchAllData();
                // Update selectedStaff with new data
                setSelectedStaff(prev => prev ? { ...prev, ...updates } : null);
                alert('Staff member updated successfully');
              } catch (error) {
                console.error('Update staff error:', error);
                alert('Failed to update staff');
              }
            }}
            onDelete={() => handleDeleteStaff(selectedStaff.id)}
          />
        )}

        {/* Bulk Payroll View */}
        {viewMode === 'payroll' && (
          <BulkPayrollGeneration />
        )}

        {/* Financial Ledger View */}
        {viewMode === 'ledger' && (
          <FinancialLedger onBack={() => setViewMode('grid')} />
        )}
      </main>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center">
              <h2 className="font-bold text-lg">Add New Staff</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">Role</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value as Staff['role'] })}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="Server">Server</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">Daily Wage (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={staffForm.daily_wage}
                    onChange={e => setStaffForm({ ...staffForm, daily_wage: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">PIN (4 digits)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={staffForm.pin}
                  onChange={e => setStaffForm({ ...staffForm, pin: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono tracking-widest text-center"
                  placeholder="0000"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-stone-900 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
              >
                <Save size={18} />
                Save Staff Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Absent Modal */}
      {showAbsentModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-red-50">
              <h2 className="font-bold text-lg text-red-800">Mark {selectedStaff.name} Absent</h2>
              <button onClick={() => setShowAbsentModal(false)} className="p-2 hover:bg-red-100 rounded-lg">
                <X size={20} className="text-red-600" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                required
                value={absentReason}
                onChange={e => setAbsentReason(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                placeholder="Reason for absence..."
              />
              <button
                onClick={handleMarkAbsent}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700"
              >
                <UserX size={18} />
                Confirm Absence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CA Modal */}
      {showCAModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-orange-50">
              <h2 className="font-bold text-lg">Cash Advance - {selectedStaff.name}</h2>
              <button onClick={() => setShowCAModal(false)} className="p-2 hover:bg-orange-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={caForm.amount}
                  onChange={e => setCAForm({ ...caForm, amount: parseFloat(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Reason</label>
                <textarea
                  value={caForm.reason}
                  onChange={e => setCAForm({ ...caForm, reason: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                  placeholder="Reason for advance..."
                />
              </div>
              <button
                onClick={handleIssueCA}
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-orange-700"
              >
                <DollarSign size={18} />
                Issue Advance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deduction Modal */}
      {showDeductionModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-blue-50">
              <h2 className="font-bold text-lg">Apply Deduction - {selectedStaff.name}</h2>
              <button onClick={() => setShowDeductionModal(false)} className="p-2 hover:bg-blue-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Deduction Type</label>
                <select
                  value={deductionForm.type}
                  onChange={e => setDeductionForm({ ...deductionForm, type: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Uniform">Uniform</option>
                  <option value="Damage">Damage</option>
                  <option value="Loan Repayment">Loan Repayment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deductionForm.amount}
                  onChange={e => setDeductionForm({ ...deductionForm, amount: parseFloat(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleApplyDeduction}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <Wallet size={18} />
                Apply Deduction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementModule;
