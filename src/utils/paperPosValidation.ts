import { OrderType } from '@/types';

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
