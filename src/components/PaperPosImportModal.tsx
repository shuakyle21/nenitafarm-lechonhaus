import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Keyboard,
  Package,
  Calendar,
  Wallet,
  ShoppingBag,
  StickyNote,
  ChevronDown,
  ChevronUp,
  DollarSign,
  User,
  ReceiptText,
} from 'lucide-react';
import { PaperPosRecord, OrderType } from '@/types';

interface PaperPosImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: Omit<PaperPosRecord, 'id' | 'imported_at'>[]) => Promise<void>;
  onImportExpenses?: (expenses: { date: string; amount: number; reason: string; requested_by: string }[]) => Promise<void>;
  importedBy: string;
}

export type RecordType = 'SALE' | 'EXPENSE';

export interface FormRecord {
  record_type: RecordType;
  date: string;
  items: string;
  total_amount: string;
  payment_method: string;
  order_type: OrderType;
  notes: string;
  reason: string;
  requested_by: string;
}

interface ParsedItem {
  name: string;
  qty: number;
  price: number;
}

function parseItemsPreview(itemsStr: string): ParsedItem[] {
  if (!itemsStr.trim()) return [];
  const items: ParsedItem[] = [];
  const parts = itemsStr.split(',');
  for (const part of parts) {
    const match = part
      .trim()
      .match(/^(.+?)\s*x\s*(\d+(?:\.\d+)?)\s*@\s*(\d+(?:\.\d+)?)$/i);
    if (match) {
      items.push({
        name: match[1].trim(),
        qty: parseFloat(match[2]),
        price: parseFloat(match[3]),
      });
    }
  }
  return items;
}

const createEmptyRecord = (): FormRecord => ({
  record_type: 'SALE',
  date: new Date().toISOString().split('T')[0],
  items: '',
  total_amount: '',
  payment_method: 'CASH',
  order_type: 'DINE_IN',
  notes: '',
  reason: '',
  requested_by: '',
});

/**
 * Validate a single field based on the record type.
 * Returns an error message string, or null if valid.
 */
export function validateField(
  recordType: RecordType,
  field: string,
  value: string
): string | null {
  if (field === 'date') {
    return !value ? 'Required' : null;
  }

  if (field === 'total_amount') {
    return !value || parseFloat(value) <= 0 ? 'Must be greater than 0' : null;
  }

  if (recordType === 'SALE') {
    if (field === 'items') {
      return !value.trim() ? 'Required' : null;
    }
  }

  if (recordType === 'EXPENSE') {
    if (field === 'reason') {
      return !value.trim() ? 'Required' : null;
    }
  }

  return null;
}

/**
 * Validate all fields of a single record.
 * Returns an object of errors keyed by `${index}.${field}`.
 */
export function validateRecord(
  record: FormRecord,
  index: number
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fieldsToValidate = record.record_type === 'SALE'
    ? ['date', 'items', 'total_amount'] as const
    : ['date', 'total_amount', 'reason'] as const;

  for (const field of fieldsToValidate) {
    const error = validateField(record.record_type, field, record[field]);
    if (error) {
      errors[`${index}.${field}`] = error;
    }
  }

  return errors;
}

export default function PaperPosImportModal({
  isOpen,
  onClose,
  onImport,
  onImportExpenses,
  importedBy,
}: PaperPosImportModalProps) {
  const [records, setRecords] = useState<FormRecord[]>([createEmptyRecord()]);
  const [importing, setImporting] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set([0]));

  if (!isOpen) return null;

  const toggleRecord = (index: number) => {
    setExpandedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleAddRecord = () => {
    const newIndex = records.length;
    setRecords([...records, createEmptyRecord()]);
    setExpandedRecords((prev) => new Set([...prev, newIndex]));
  };

  const handleRemoveRecord = (index: number) => {
    if (records.length > 1) {
      setRecords(records.filter((_, i) => i !== index));
      setExpandedRecords((prev) => {
        const next = new Set<number>();
        prev.forEach((i) => {
          if (i < index) next.add(i);
          else if (i > index) next.add(i - 1);
        });
        return next;
      });
      // Clear errors for this record
      setErrors((prev) => {
        const next: Record<string, string> = {};
        Object.entries(prev).forEach(([key, val]) => {
          if (!key.startsWith(`${index}.`)) {
            next[key] = val;
          }
        });
        return next;
      });
    }
  };

  const handleRecordChange = (index: number, field: keyof FormRecord, value: string) => {
    const newRecords = [...records];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setRecords(newRecords);

    // Inline validation: validate the field on change
    const recordType = field === 'record_type' ? (value as RecordType) : newRecords[index].record_type;
    const error = validateField(recordType, field, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [`${index}.${field}`]: error }));
    } else {
      clearError(`${index}.${field}`);
    }
  };

  const getRecordPreview = (record: FormRecord) => {
    return parseItemsPreview(record.items);
  };

  const getCalculatedTotal = (record: FormRecord): number => {
    const items = parseItemsPreview(record.items);
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  const handleAutoFillTotal = (index: number) => {
    const total = getCalculatedTotal(records[index]);
    if (total > 0) {
      handleRecordChange(index, 'total_amount', total.toFixed(2));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    records.forEach((r, i) => {
      const recordErrors = validateRecord(r, i);
      Object.assign(newErrors, recordErrors);
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorRecord = parseInt(Object.keys(newErrors)[0].split('.')[0]);
      setExpandedRecords((prev) => new Set([...prev, firstErrorRecord]));
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleImport = async () => {
    if (!validate()) return;

    try {
      setImporting(true);

      // Partition records by type
      const saleRecords = records.filter(
        (r) => r.record_type === 'SALE' && r.date && r.items.trim() && r.total_amount && parseFloat(r.total_amount) > 0
      );
      const expenseRecords = records.filter(
        (r) => r.record_type === 'EXPENSE' && r.date && r.total_amount && parseFloat(r.total_amount) > 0 && r.reason.trim()
      );

      // Import sales
      if (saleRecords.length > 0) {
        const recordsToImport = saleRecords.map((r) => ({
          date: r.date,
          items: r.items,
          total_amount: parseFloat(r.total_amount),
          payment_method: r.payment_method,
          order_type: r.order_type,
          notes: r.notes,
          imported_by: importedBy,
        }));
        await onImport(recordsToImport);
      }

      // Import expenses
      if (expenseRecords.length > 0 && onImportExpenses) {
        const expensesToImport = expenseRecords.map((r) => ({
          date: r.date,
          amount: parseFloat(r.total_amount),
          reason: r.reason,
          requested_by: r.requested_by || importedBy,
        }));
        await onImportExpenses(expensesToImport);
      }

      // Reset form
      setRecords([createEmptyRecord()]);
      setExpandedRecords(new Set([0]));
      setCsvInput('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      setErrors({ _global: 'Failed to import records. Please try again.' });
    } finally {
      setImporting(false);
    }
  };

  const handleCsvImport = () => {
    try {
      const lines = csvInput.trim().split('\n');
      const parsedRecords: FormRecord[] = [];

      const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

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
        setExpandedRecords(new Set([0]));
        setMode('manual');
        setCsvInput('');
        setErrors({});
      } else {
        setErrors({ _csv: 'No valid records found. Check your CSV format.' });
      }
    } catch (error) {
      console.error('CSV parsing error:', error);
      setErrors({ _csv: 'Failed to parse CSV. Please check the format.' });
    }
  };

  const inputBase =
    'w-full px-4 py-3 font-medium text-stone-800 bg-stone-100 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-xl transition-all outline-none text-sm';
  const inputError = 'border-red-400 bg-red-50 focus:border-red-500';
  const labelBase = 'block text-xs font-bold uppercase text-stone-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-orange-600 text-white p-6 text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-orange-700/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="mx-auto bg-orange-700 w-12 h-12 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-brand font-black uppercase tracking-wide">
            Import Records
          </h2>
          <p className="text-orange-100 text-xs mt-1">Add paper POS transactions to the system</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-stone-200 shrink-0">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
              mode === 'manual'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Keyboard size={14} />
            Manual Entry
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
              mode === 'csv'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Upload size={14} />
            CSV Import
          </button>
        </div>

        {/* Global Error */}
        {errors._global && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {errors._global}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mode === 'csv' ? (
            /* CSV Import Mode */
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-500 space-y-1">
                <p className="font-bold text-stone-700">CSV Format:</p>
                <p className="font-mono">date, items, total_amount, payment_method, order_type, notes</p>
                <p className="font-mono text-stone-400">
                  2024-01-01, Lechon Baboy x 2 @ 150, 300, CASH, DINE_IN, Notes
                </p>
              </div>

              <div>
                <label className={labelBase}>Paste CSV Data</label>
                <textarea
                  value={csvInput}
                  onChange={(e) => {
                    setCsvInput(e.target.value);
                    clearError('_csv');
                  }}
                  placeholder="Paste your CSV rows here..."
                  rows={8}
                  className={`${inputBase} font-mono text-base h-48 resize-none ${errors._csv ? inputError : ''}`}
                />
                {errors._csv && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors._csv}
                  </p>
                )}
              </div>

              <button
                onClick={handleCsvImport}
                disabled={!csvInput.trim()}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18} />
                PARSE & LOAD RECORDS
              </button>
            </div>
          ) : (
            /* Manual Entry Mode */
            <div className="space-y-3">
              {records.map((record, index) => {
                const isExpanded = expandedRecords.has(index);
                const parsedItems = getRecordPreview(record);
                const calculatedTotal = parsedItems.reduce(
                  (sum, item) => sum + item.qty * item.price,
                  0
                );
                const hasErrors = Object.keys(errors).some((k) => k.startsWith(`${index}.`));
                const isExpense = record.record_type === 'EXPENSE';
                const recordSummary = isExpense
                  ? record.total_amount
                    ? `₱${parseFloat(record.total_amount).toLocaleString()}`
                    : 'Empty expense'
                  : record.items.trim() && parsedItems.length > 0
                    ? `${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''} · ₱${calculatedTotal.toLocaleString()}`
                    : record.total_amount
                      ? `₱${parseFloat(record.total_amount).toLocaleString()}`
                      : 'Empty record';

                return (
                  <div
                    key={index}
                    className={`border-2 rounded-xl overflow-hidden transition-all ${
                      hasErrors
                        ? 'border-red-300 bg-red-50/30'
                        : isExpanded
                          ? 'border-orange-200 bg-orange-50/20'
                          : 'border-stone-200'
                    }`}
                  >
                    {/* Record Header (collapsible) */}
                    <button
                      type="button"
                      onClick={() => toggleRecord(index)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            hasErrors
                              ? 'bg-red-100 text-red-600'
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-stone-700">
                            {record.date
                              ? new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'No date'}
                          </span>
                          <span className="text-xs text-stone-400 ml-2">{recordSummary}</span>
                          {isExpense && (
                            <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                              Expense
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {records.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRecord(index);
                            }}
                            className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={`Remove record ${index + 1}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-stone-400" />
                        ) : (
                          <ChevronDown size={16} className="text-stone-400" />
                        )}
                      </div>
                    </button>

                    {/* Record Form (expanded) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-stone-100">
                        {/* Record Type Toggle */}
                        <div className="pt-3 flex items-center gap-1 bg-stone-100 rounded-lg p-1" role="radiogroup" aria-label="Record type">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={record.record_type === 'SALE'}
                            onClick={() => handleRecordChange(index, 'record_type', 'SALE')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                              record.record_type === 'SALE'
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            <ShoppingBag size={13} />
                            Sale
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={record.record_type === 'EXPENSE'}
                            onClick={() => handleRecordChange(index, 'record_type', 'EXPENSE')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                              record.record_type === 'EXPENSE'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            <ReceiptText size={13} />
                            Expense
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Date */}
                          <div>
                            <label className={labelBase}>
                              <Calendar size={10} className="inline mr-1 mb-0.5" />
                              Date *
                            </label>
                            <input
                              type="date"
                              value={record.date}
                              onChange={(e) => handleRecordChange(index, 'date', e.target.value)}
                              className={`${inputBase} ${errors[`${index}.date`] ? inputError : ''}`}
                            />
                            {errors[`${index}.date`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`${index}.date`]}</p>
                            )}
                          </div>

                          {/* Total Amount */}
                          <div>
                            <label className={labelBase}>
                              <Wallet size={10} className="inline mr-1 mb-0.5" />
                              Total Amount *
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-sm">
                                ₱
                              </span>
                              <input
                                type="number"
                                value={record.total_amount}
                                onChange={(e) =>
                                  handleRecordChange(index, 'total_amount', e.target.value)
                                }
                                placeholder="0.00"
                                step="0.01"
                                className={`${inputBase} pl-9 font-bold ${errors[`${index}.total_amount`] ? inputError : ''}`}
                              />
                            </div>
                            {errors[`${index}.total_amount`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`${index}.total_amount`]}
                              </p>
                            )}
                            {calculatedTotal > 0 &&
                              record.total_amount !== calculatedTotal.toFixed(2) && (
                                <button
                                  type="button"
                                  onClick={() => handleAutoFillTotal(index)}
                                  className="text-orange-600 text-xs mt-1 hover:underline"
                                >
                                  Use calculated: ₱{calculatedTotal.toLocaleString()}
                                </button>
                              )}
                          </div>

                          {/* Sale-only fields */}
                          {record.record_type === 'SALE' && (
                            <>
                              {/* Payment Method */}
                              <div>
                                <label className={labelBase}>Payment Method</label>
                                <select
                                  value={record.payment_method}
                                  onChange={(e) =>
                                    handleRecordChange(index, 'payment_method', e.target.value)
                                  }
                                  className={inputBase}
                                >
                                  <option value="CASH">Cash</option>
                                  <option value="GCASH">GCash</option>
                                  <option value="MAYA">Maya</option>
                                </select>
                              </div>

                              {/* Order Type */}
                              <div>
                                <label className={labelBase}>
                                  <ShoppingBag size={10} className="inline mr-1 mb-0.5" />
                                  Order Type
                                </label>
                                <select
                                  value={record.order_type}
                                  onChange={(e) =>
                                    handleRecordChange(
                                      index,
                                      'order_type',
                                      e.target.value as OrderType
                                    )
                                  }
                                  className={inputBase}
                                >
                                  <option value="DINE_IN">Dine In</option>
                                  <option value="TAKEOUT">Takeout</option>
                                  <option value="DELIVERY">Delivery</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Expense-only fields */}
                          {record.record_type === 'EXPENSE' && (
                            <>
                              {/* Reason */}
                              <div>
                                <label className={labelBase}>
                                  <ReceiptText size={10} className="inline mr-1 mb-0.5" />
                                  Reason *
                                </label>
                                <input
                                  type="text"
                                  value={record.reason}
                                  onChange={(e) => handleRecordChange(index, 'reason', e.target.value)}
                                  placeholder="e.g. Supplies, Gas, Groceries"
                                  className={`${inputBase} ${errors[`${index}.reason`] ? inputError : ''}`}
                                />
                                {errors[`${index}.reason`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`${index}.reason`]}</p>
                                )}
                              </div>

                              {/* Requested By */}
                              <div>
                                <label className={labelBase}>
                                  <User size={10} className="inline mr-1 mb-0.5" />
                                  Requested By
                                </label>
                                <input
                                  type="text"
                                  value={record.requested_by}
                                  onChange={(e) => handleRecordChange(index, 'requested_by', e.target.value)}
                                  placeholder={importedBy}
                                  className={inputBase}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Sale-specific: Items */}
                        {record.record_type === 'SALE' && (
                          <div>
                            <label className={labelBase}>
                              <Package size={10} className="inline mr-1 mb-0.5" />
                              Items *
                            </label>
                            <textarea
                              value={record.items}
                              onChange={(e) => handleRecordChange(index, 'items', e.target.value)}
                              placeholder='e.g. Lechon Baboy x 2 @ 150, Pork BBQ x 3 @ 50'
                              rows={2}
                              className={`${inputBase} resize-none ${errors[`${index}.items`] ? inputError : ''}`}
                            />
                            {errors[`${index}.items`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`${index}.items`]}
                              </p>
                            )}

                            {/* Live Parse Preview */}
                            {parsedItems.length > 0 && (
                              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-xs font-bold uppercase text-green-700 mb-2 flex items-center gap-1">
                                  <Check size={12} />
                                  Parsed {parsedItems.length} item
                                  {parsedItems.length > 1 ? 's' : ''}
                                </p>
                                <div className="space-y-1">
                                  {parsedItems.map((item, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-xs text-green-800"
                                    >
                                      <span>
                                        {item.name}{' '}
                                        <span className="text-green-600">
                                          x{item.qty} @ ₱{item.price}
                                        </span>
                                      </span>
                                      <span className="font-semibold">
                                        ₱{(item.qty * item.price).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t border-green-200 pt-1 mt-1 flex justify-between text-xs font-bold text-green-800">
                                    <span>Subtotal</span>
                                    <span>₱{calculatedTotal.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Hint when items field has text but nothing parsed */}
                            {record.items.trim() && parsedItems.length === 0 && (
                              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                  Could not parse items. Use format:{' '}
                                  <span className="font-mono font-semibold">
                                    Item Name x Qty @ Price
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label className={labelBase}>
                            <StickyNote size={10} className="inline mr-1 mb-0.5" />
                            Notes
                          </label>
                          <input
                            type="text"
                            value={record.notes}
                            onChange={(e) => handleRecordChange(index, 'notes', e.target.value)}
                            placeholder="Optional notes"
                            className={inputBase}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Record Button */}
              <button
                type="button"
                onClick={handleAddRecord}
                className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 text-stone-500 hover:text-orange-600 text-sm font-semibold"
              >
                <Plus size={16} />
                Add Another Record
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-stone-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold py-3 rounded-xl transition-all text-sm"
            disabled={importing}
          >
            CANCEL
          </button>
          {mode === 'manual' && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                'IMPORTING...'
              ) : (
                <>
                  <Check size={18} />
                  IMPORT {records.length} RECORD{records.length > 1 ? 'S' : ''}
                  {records.some((r) => r.record_type === 'EXPENSE') && records.some((r) => r.record_type === 'SALE')
                    ? ` (${records.filter((r) => r.record_type === 'SALE').length} Sale, ${records.filter((r) => r.record_type === 'EXPENSE').length} Expense)`
                    : records.every((r) => r.record_type === 'EXPENSE')
                      ? ' (Expenses)'
                      : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
