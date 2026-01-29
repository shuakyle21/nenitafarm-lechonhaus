import React, { useState, useEffect, useMemo } from 'react';
import { Staff, StaffTransaction } from '@/types';
import { Save, Trash2, Calendar } from 'lucide-react';

interface StaffDetailedManagementProps {
  staff: Staff;
  transactions: StaffTransaction[];
  onSave: (updates: Partial<Staff>) => Promise<void>;
  onDelete: () => void;
  currentTime: Date;
}

const StaffDetailedManagement: React.FC<StaffDetailedManagementProps> = ({
  staff,
  transactions,
  onSave,
  onDelete,
  currentTime,
}) => {
  // Form state
  const [form, setForm] = useState({
    name: staff.name || '',
    email: staff.email || '',
    phone: staff.phone || '',
    address: staff.address || '',
    role: staff.role || 'Server',
    hire_date: staff.hire_date || '',
    daily_wage: staff.daily_wage || 0,
    hourly_rate: staff.hourly_rate || 0,
    bonuses: staff.bonuses || 0,
  });

  const [saving, setSaving] = useState(false);

  // Update form when staff changes
  useEffect(() => {
    setForm({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      address: staff.address || '',
      role: staff.role || 'Server',
      hire_date: staff.hire_date || '',
      daily_wage: staff.daily_wage || 0,
      hourly_rate: staff.hourly_rate || 0,
      bonuses: staff.bonuses || 0,
    });
  }, [staff]);

  // Get payroll history (salary payouts)
  const payrollHistory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'SALARY_PAYOUT')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        role: form.role as Staff['role'],
        hire_date: form.hire_date || undefined,
        daily_wage: form.daily_wage,
        hourly_rate: form.hourly_rate,
        bonuses: form.bonuses,
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      PAID: 'text-emerald-600',
      PENDING: 'text-amber-600',
      ACTIVE: 'text-blue-600',
    };
    return styles[status || 'PENDING'] || 'text-stone-600';
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <section className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-base font-semibold text-stone-800 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="Full Name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Home Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="123 Street, City"
            />
          </div>
        </div>
      </section>

      {/* Employment Details Section */}
      <section className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-base font-semibold text-stone-800 mb-4">Employment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              <option value="Server">Server</option>
              <option value="Cashier">Cashier</option>
              <option value="Kitchen">Kitchen Staff</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Hire Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.hire_date}
                onChange={e => setForm({ ...form, hire_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Salary Management */}
        <h3 className="text-sm font-semibold text-stone-800 mt-6 mb-3">Salary Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Daily Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">P</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.daily_wage}
                onChange={e => setForm({ ...form, daily_wage: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Hourly Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">P</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.hourly_rate}
                onChange={e => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Bonuses</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">P</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.bonuses}
                onChange={e => setForm({ ...form, bonuses: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payroll History Section */}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-base font-semibold text-stone-800">Payroll History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-y border-stone-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase">Pay Period</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase">Gross Pay</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase">Deductions</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase">Net Pay</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payrollHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-400 text-sm">
                    No payroll history found
                  </td>
                </tr>
              ) : (
                payrollHistory.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-stone-600">
                      {new Date(tx.date).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-600">
                      {tx.pay_period_start && tx.pay_period_end 
                        ? `${new Date(tx.pay_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(tx.pay_period_end).toLocaleDateString('en-US', { day: 'numeric' })}`
                        : tx.description || '-'
                      }
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-800">
                      P {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-600">
                      P 0.00
                    </td>
                    <td className="px-6 py-3 text-sm text-stone-800">
                      P {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-medium ${getStatusBadge(tx.status)}`}>
                        {tx.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onDelete}
          className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-red-700 transition-colors"
        >
          <Trash2 size={18} />
          Delete Staff
        </button>
      </div>
    </div>
  );
};

export default StaffDetailedManagement;
