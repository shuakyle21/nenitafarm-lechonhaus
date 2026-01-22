import React, { useState } from 'react';
import { FileText, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PaperPosRecord } from '@/types';

interface PaperPosRecordsListProps {
  records: PaperPosRecord[];
  unsyncedCount: number;
  syncing: boolean;
  onSyncRecord: (recordId: string) => Promise<void>;
  onSyncAll: () => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
}

export default function PaperPosRecordsList({
  records,
  unsyncedCount,
  syncing,
  onSyncRecord,
  onSyncAll,
  onDeleteRecord,
}: PaperPosRecordsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`;
  };

  const handleSyncRecord = async (recordId: string) => {
    if (window.confirm('Sync this record to the orders database?')) {
      try {
        await onSyncRecord(recordId);
      } catch (error) {
        alert('Failed to sync record. Please check the console for details.');
      }
    }
  };

  const handleSyncAll = async () => {
    if (window.confirm(`Sync all ${unsyncedCount} unsynced records?`)) {
      try {
        await onSyncAll();
      } catch (error) {
        alert('Failed to sync all records. Please check the console for details.');
      }
    }
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm('Delete this record? This action cannot be undone.')) {
      try {
        await onDeleteRecord(recordId);
      } catch (error) {
        alert('Failed to delete record. Please check the console for details.');
      }
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No paper POS records imported yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sync All Button */}
      {unsyncedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-800">
              {unsyncedCount} record(s) pending sync
            </span>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="border border-stone-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div
              className="p-4 bg-white cursor-pointer"
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {record.synced ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-800">
                        {formatDate(record.date)}
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(record.total_amount)}
                      </span>
                      <span className="text-sm text-stone-500">
                        {record.order_type || 'DINE_IN'}
                      </span>
                      <span className="text-sm text-stone-500">
                        {record.payment_method || 'CASH'}
                      </span>
                    </div>
                    {record.notes && (
                      <p className="text-sm text-stone-500 mt-1">{record.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!record.synced && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSyncRecord(record.id);
                      }}
                      disabled={syncing}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(record.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === record.id && (
              <div className="px-4 pb-4 bg-stone-50 border-t border-stone-200">
                <div className="space-y-2 pt-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-700">Items:</p>
                    <p className="text-sm text-stone-600 whitespace-pre-wrap">{record.items}</p>
                  </div>
                  {record.imported_by && (
                    <div>
                      <p className="text-sm font-semibold text-stone-700">Imported By:</p>
                      <p className="text-sm text-stone-600">{record.imported_by}</p>
                    </div>
                  )}
                  {record.imported_at && (
                    <div>
                      <p className="text-sm font-semibold text-stone-700">Imported At:</p>
                      <p className="text-sm text-stone-600">
                        {new Date(record.imported_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {record.synced && record.synced_order_id && (
                    <div>
                      <p className="text-sm font-semibold text-stone-700">Synced Order ID:</p>
                      <p className="text-sm text-stone-600 font-mono">{record.synced_order_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
