import React, { useEffect, useState } from 'react';
import { auditService, AuditLog } from '@/services/auditService';
import { 
  ClipboardList, 
  History as HistoryIcon, 
  User, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Search,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { orderService } from '@/services/orderService';
import { financeService } from '@/services/financeService';
import { createDateMatcher, getDateRangeForFilter } from '@/utils/dateUtils';
import { menuService } from '@/services/menuService';
import { MenuItem } from '@/types';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import DailyReconciliationPDF from './DailyReconciliationPDF';

type DateFilterType = 'today' | 'yesterday' | 'last7days' | 'all';

const AuditModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LOGS' | 'RECONCILIATION'>('LOGS');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [actualCash, setActualCash] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [showFilters, setShowFilters] = useState(false);
  const [reconciliation, setReconciliation] = useState({
    openingFund: 0,
    cashSales: 0,
    expenses: 0,
    cashDrops: 0,
    expectedCash: 0
  });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchReconciliation();
    fetchMenuItems();
  }, [dateFilter]);

  const fetchMenuItems = async () => {
    try {
      const items = await menuService.getMenuItems();
      setMenuItems(items);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    }
  };

  const fetchReconciliation = async () => {
    try {
      const data = await auditService.getDailyReconciliation();
      setReconciliation(data);
    } catch (err) {
      console.error('Failed to fetch reconciliation data:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Get date range based on filter
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (dateFilter !== 'all') {
        const range = getDateRangeForFilter(dateFilter);
        startDate = range.startDate;
        endDate = range.endDate;
      }
      
      const data = await auditService.getLogs(startDate, endDate);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndLock = async () => {
    if (!actualCash) {
      alert('Please enter the actual cash in drawer before verifying.');
      return;
    }

    setIsVerifying(true);
    try {
      const actualAmount = parseFloat(actualCash) || 0;
      const discrepancy = reconciliation.expectedCash - actualAmount;
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      };
      const todayStr = new Date().toLocaleString("en-PH", dateOptions);

      const reportData = {
        ...reconciliation,
        actualCash: actualAmount,
        discrepancy
      };

      const blob = await pdf(
        <DailyReconciliationPDF 
          data={reportData} 
          date={todayStr} 
          auditor="System Auditor" 
        />
      ).toBlob();

      saveAs(blob, `Daily_Reconciliation_${new Date().toISOString().split('T')[0]}.pdf`);
      
      alert('Daily report verified and downloaded successfully.');
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate the daily report. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-green-600 bg-green-50 border-green-200';
      case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'DELETE': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getItemName(log).toLowerCase().includes(searchTerm.toLowerCase())
  );

  function getItemName(log: AuditLog) {
    const data = log.new_data || log.old_data || {};
    
    if (log.table_name === 'order_items') {
      const menuId = data.menu_item_id;
      const menuItem = menuItems.find(item => item.id === menuId);
      return menuItem ? menuItem.name : `Item #${menuId?.substring(0, 5)}`;
    }
    
    if (log.table_name === 'orders') {
      return `Order #${data.order_number || data.id?.substring(0, 8)}`;
    }

    if (log.table_name === 'expenses') {
      return data.description || 'Expense';
    }

    return 'N/A';
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 p-3 md:p-6 lg:p-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-stone-800 uppercase tracking-tighter flex items-center gap-2 md:gap-3">
            <ClipboardList className="text-red-800" size={24} />
            <span className="hidden sm:inline">System Audit Trail</span>
            <span className="sm:hidden">Audit Trail</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 font-medium mt-1 hidden sm:block">
            Historical record of all system mutations and staff actions.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-xl border font-bold transition-all ${activeTab === 'LOGS' ? 'bg-red-800 text-white border-red-800 shadow-lg shadow-red-900/20' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
          >
            Activity Logs
          </button>
          <button 
            onClick={() => setActiveTab('RECONCILIATION')}
            className={`px-4 py-2 rounded-xl border font-bold transition-all ${activeTab === 'RECONCILIATION' ? 'bg-red-800 text-white border-red-800 shadow-lg shadow-red-900/20' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
          >
            Cash Reconciliation
          </button>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50 transition-colors shadow-sm ml-4"
          >
            <HistoryIcon size={18} />
            Refresh
          </button>
        </div>
      </div>

      {activeTab === 'LOGS' ? (
        <>
          {/* Stats Bar - responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-4 md:mb-6">
        {[
          { label: 'Total Events', value: logs.length, color: 'border-stone-200' },
          { label: 'Inserts', value: logs.filter(l => l.action === 'INSERT').length, color: 'border-green-200' },
          { label: 'Updates', value: logs.filter(l => l.action === 'UPDATE').length, color: 'border-blue-200' },
          { label: 'Deletions', value: logs.filter(l => l.action === 'DELETE').length, color: 'border-red-200' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-4 rounded-2xl border-b-4 ${stat.color} shadow-sm`}>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-stone-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder="Search by table, action, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-800/20"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl text-stone-600 flex items-center gap-2 font-bold transition-colors ${showFilters ? 'bg-red-800 text-white border-red-800' : 'border-stone-200 hover:bg-stone-50'}`}
          >
            <Calendar size={18} />
            Date Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="pt-4 border-t border-stone-100">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Quick Select</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setDateFilter('today')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${dateFilter === 'today' ? 'bg-red-800 text-white shadow-lg' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setDateFilter('yesterday')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${dateFilter === 'yesterday' ? 'bg-red-800 text-white shadow-lg' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                Yesterday
              </button>
              <button 
                onClick={() => setDateFilter('last7days')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${dateFilter === 'last7days' ? 'bg-red-800 text-white shadow-lg' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setDateFilter('all')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${dateFilter === 'all' ? 'bg-red-800 text-white shadow-lg' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                All Time
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-3xl shadow-xl border border-stone-100">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Table</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Detail</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Record ID</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr 
                    className={`hover:bg-stone-50 transition-colors cursor-pointer ${expandedId === log.id ? 'bg-stone-50' : ''}`}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-6 py-4 font-medium text-stone-600">
                      {new Date(log.changed_at).toLocaleString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-800">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-stone-800">
                          {log.user?.username || 'System/Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-700 uppercase text-xs tracking-tight">
                      {log.table_name}
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-800">
                      {getItemName(log)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-400">
                      {log.record_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expandedId === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                  </tr>
                  
                  {expandedId === log.id && (
                    <tr className="bg-stone-50/50">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Previous State</h4>
                            <div className="bg-white p-4 rounded-2xl border border-stone-200 overflow-x-auto max-h-60">
                              <pre className="text-xs text-stone-600 whitespace-pre-wrap">
                                {log.old_data ? JSON.stringify(log.old_data, null, 2) : 'N/A'}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">New State</h4>
                            <div className="bg-white p-4 rounded-2xl border border-stone-200 overflow-x-auto max-h-60">
                              <pre className="text-xs text-stone-600 whitespace-pre-wrap">
                                {log.new_data ? JSON.stringify(log.new_data, null, 2) : 'N/A'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-medium">
                    No logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
      ) : (
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-stone-100 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-stone-800 uppercase mb-6 flex items-center gap-3">
              <HistoryIcon className="text-amber-600" />
              Daily Cash Reconciliation
            </h2>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Expected (System)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-stone-600 font-medium">Opening Fund</span>
                    <span className="font-bold text-stone-900">₱{reconciliation.openingFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-stone-600 font-medium">Cash Sales (Total)</span>
                    <span className="font-bold text-green-600">+₱{reconciliation.cashSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-stone-600 font-medium">Expenses & Drops</span>
                    <span className="font-bold text-red-600">-₱{(reconciliation.expenses + reconciliation.cashDrops).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-stone-800 text-white rounded-xl shadow-lg">
                    <span className="font-bold">Total Expected Cash</span>
                    <span className="font-black">₱{reconciliation.expectedCash.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Actual (Reported)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-stone-600 font-medium">Cash in Drawer</span>
                    <span className="font-bold text-stone-900 text-right">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="bg-transparent text-right w-24 border-b border-stone-300 focus:outline-none focus:border-red-800 font-bold"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                      />
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-stone-600 font-medium">Discrepancy</span>
                    <span className={`font-bold ${Math.abs(reconciliation.expectedCash - (parseFloat(actualCash) || 0)) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                      ₱{(reconciliation.expectedCash - (parseFloat(actualCash) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200">
                  <h4 className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                    <AlertCircle size={18} />
                    Auditor Note
                  </h4>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    A discrepancy of more than ₱50.00 should be investigated. Check the Activity Logs to see if any orders were deleted or modified after printing.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleVerifyAndLock}
              disabled={isVerifying || !actualCash}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Verify & Lock Daily Report
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 font-bold animate-in slide-in-from-bottom-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={fetchLogs} className="ml-auto underline">Try Again</button>
        </div>
      )}
    </div>
  );
};

export default AuditModule;
