import React, { useState } from 'react';
import { X, Upload, FileText, Plus, Trash2, Check } from 'lucide-react';
import { PaperPosRecord, OrderType } from '@/types';

interface PaperPosImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: Omit<PaperPosRecord, 'id' | 'imported_at'>[]) => Promise<void>;
  importedBy: string;
}

interface FormRecord {
  date: string;
  items: string;
  total_amount: string;
  payment_method: string;
  order_type: OrderType;
  notes: string;
}

export default function PaperPosImportModal({
  isOpen,
  onClose,
  onImport,
  importedBy,
}: PaperPosImportModalProps) {
  const [records, setRecords] = useState<FormRecord[]>([
    {
      date: new Date().toISOString().split('T')[0],
      items: '',
      total_amount: '',
      payment_method: 'CASH',
      order_type: 'DINE_IN',
      notes: '',
    },
  ]);
  const [importing, setImporting] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);

  if (!isOpen) return null;

  const handleAddRecord = () => {
    setRecords([
      ...records,
      {
        date: new Date().toISOString().split('T')[0],
        items: '',
        total_amount: '',
        payment_method: 'CASH',
        order_type: 'DINE_IN',
        notes: '',
      },
    ]);
  };

  const handleRemoveRecord = (index: number) => {
    if (records.length > 1) {
      setRecords(records.filter((_, i) => i !== index));
    }
  };

  const handleRecordChange = (index: number, field: keyof FormRecord, value: string) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setRecords(newRecords);
  };

  const handleImport = async () => {
    try {
      setImporting(true);

      // Validate records
      const validRecords = records.filter(
        (r) => r.date && r.items && r.total_amount && parseFloat(r.total_amount) > 0
      );

      if (validRecords.length === 0) {
        alert('Please fill in at least one complete record with date, items, and total amount.');
        return;
      }

      // Convert to PaperPosRecord format
      const recordsToImport = validRecords.map((r) => ({
        date: r.date,
        items: r.items,
        total_amount: parseFloat(r.total_amount),
        payment_method: r.payment_method,
        order_type: r.order_type,
        notes: r.notes,
        imported_by: importedBy,
      }));

      await onImport(recordsToImport);

      // Reset form
      setRecords([
        {
          date: new Date().toISOString().split('T')[0],
          items: '',
          total_amount: '',
          payment_method: 'CASH',
          order_type: 'DINE_IN',
          notes: '',
        },
      ]);
      setCsvInput('');
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import records. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleCsvImport = () => {
    try {
      // Parse CSV format: date,items,total_amount,payment_method,order_type,notes
      const lines = csvInput.trim().split('\n');
      const parsedRecords: FormRecord[] = [];

      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (doesn't handle quoted commas)
        const parts = line.split(',').map((p) => p.trim());

        if (parts.length >= 3) {
          parsedRecords.push({
            date: parts[0] || new Date().toISOString().split('T')[0],
            items: parts[1] || '',
            total_amount: parts[2] || '',
            payment_method: parts[3] || 'CASH',
            order_type: (parts[4] as OrderType) || 'DINE_IN',
            notes: parts[5] || '',
          });
        }
      }

      if (parsedRecords.length > 0) {
        setRecords(parsedRecords);
        setShowCsvImport(false);
        setCsvInput('');
      } else {
        alert('No valid records found in CSV input.');
      }
    } catch (error) {
      console.error('CSV parsing error:', error);
      alert('Failed to parse CSV. Please check the format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-stone-800">Import Paper POS Records</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Format for items:</strong> Use format "Item Name x Qty @ Price" separated by
              commas.
              <br />
              Example: "Lechon Baboy x 2 @ 150, Pork BBQ x 3 @ 50"
            </p>
          </div>

          {/* CSV Import Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCsvImport(!showCsvImport)}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {showCsvImport ? 'Manual Entry' : 'CSV Import'}
            </button>
          </div>

          {/* CSV Import Section */}
          {showCsvImport && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-stone-700">
                CSV Data (Format: date,items,total_amount,payment_method,order_type,notes)
              </label>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="2024-01-01,Lechon Baboy x 2 @ 150,300,CASH,DINE_IN,Notes"
                className="w-full h-40 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
              />
              <button
                onClick={handleCsvImport}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Parse CSV
              </button>
            </div>
          )}

          {/* Manual Entry Records */}
          {!showCsvImport && (
            <div className="space-y-4">
              {records.map((record, index) => (
                <div key={index} className="border border-stone-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-stone-700">Record #{index + 1}</h3>
                    {records.length > 1 && (
                      <button
                        onClick={() => handleRemoveRecord(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={record.date}
                        onChange={(e) => handleRecordChange(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Total Amount *
                      </label>
                      <input
                        type="number"
                        value={record.total_amount}
                        onChange={(e) => handleRecordChange(index, 'total_amount', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={record.payment_method}
                        onChange={(e) => handleRecordChange(index, 'payment_method', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="CASH">Cash</option>
                        <option value="GCASH">GCash</option>
                        <option value="MAYA">Maya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Order Type
                      </label>
                      <select
                        value={record.order_type}
                        onChange={(e) =>
                          handleRecordChange(index, 'order_type', e.target.value as OrderType)
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="DINE_IN">Dine In</option>
                        <option value="TAKEOUT">Takeout</option>
                        <option value="DELIVERY">Delivery</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Items * (e.g., "Lechon Baboy x 2 @ 150, Pork BBQ x 3 @ 50")
                    </label>
                    <textarea
                      value={record.items}
                      onChange={(e) => handleRecordChange(index, 'items', e.target.value)}
                      placeholder="Item Name x Qty @ Price, Item Name x Qty @ Price"
                      rows={2}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={record.notes}
                      onChange={(e) => handleRecordChange(index, 'notes', e.target.value)}
                      placeholder="Optional notes"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddRecord}
                className="w-full py-3 border-2 border-dashed border-stone-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-stone-600 hover:text-orange-600"
              >
                <Plus className="w-5 h-5" />
                Add Another Record
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            {importing ? 'Importing...' : `Import ${records.length} Record(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
