import { describe, it, expect } from 'vitest';
import { validateField, validateRecord } from '../src/components/PaperPosImportModal';

describe('PaperPosImportModal - Inline Validation', () => {
  describe('validateField', () => {
    // --- SALE record type ---
    it('returns "Required" when sale date is empty', () => {
      expect(validateField('SALE', 'date', '')).toBe('Required');
    });

    it('returns null when sale date is valid', () => {
      expect(validateField('SALE', 'date', '2026-03-07')).toBeNull();
    });

    it('returns "Required" when sale items is empty', () => {
      expect(validateField('SALE', 'items', '')).toBe('Required');
    });

    it('returns "Required" when sale items is whitespace only', () => {
      expect(validateField('SALE', 'items', '   ')).toBe('Required');
    });

    it('returns null when sale items is filled', () => {
      expect(validateField('SALE', 'items', 'Lechon x 1 @ 150')).toBeNull();
    });

    it('returns "Must be greater than 0" when sale total_amount is 0', () => {
      expect(validateField('SALE', 'total_amount', '0')).toBe('Must be greater than 0');
    });

    it('returns "Must be greater than 0" when sale total_amount is empty', () => {
      expect(validateField('SALE', 'total_amount', '')).toBe('Must be greater than 0');
    });

    it('returns "Must be greater than 0" when sale total_amount is negative', () => {
      expect(validateField('SALE', 'total_amount', '-5')).toBe('Must be greater than 0');
    });

    it('returns null when sale total_amount is valid', () => {
      expect(validateField('SALE', 'total_amount', '150')).toBeNull();
    });

    it('returns null for non-validated sale fields like notes', () => {
      expect(validateField('SALE', 'notes', '')).toBeNull();
    });

    it('returns null for non-validated sale fields like payment_method', () => {
      expect(validateField('SALE', 'payment_method', 'CASH')).toBeNull();
    });

    // --- EXPENSE record type ---
    it('returns "Required" when expense date is empty', () => {
      expect(validateField('EXPENSE', 'date', '')).toBe('Required');
    });

    it('returns "Must be greater than 0" when expense total_amount is 0', () => {
      expect(validateField('EXPENSE', 'total_amount', '0')).toBe('Must be greater than 0');
    });

    it('returns null when expense total_amount is valid', () => {
      expect(validateField('EXPENSE', 'total_amount', '500')).toBeNull();
    });

    it('returns "Required" when expense reason is empty', () => {
      expect(validateField('EXPENSE', 'reason', '')).toBe('Required');
    });

    it('returns "Required" when expense reason is whitespace', () => {
      expect(validateField('EXPENSE', 'reason', '   ')).toBe('Required');
    });

    it('returns null when expense reason is filled', () => {
      expect(validateField('EXPENSE', 'reason', 'Gas')).toBeNull();
    });

    it('returns null for expense items field (not required for expenses)', () => {
      expect(validateField('EXPENSE', 'items', '')).toBeNull();
    });

    it('returns null for non-validated expense fields like requested_by', () => {
      expect(validateField('EXPENSE', 'requested_by', '')).toBeNull();
    });
  });

  describe('validateRecord', () => {
    it('returns all errors for an empty sale record', () => {
      const errors = validateRecord({
        record_type: 'SALE',
        date: '',
        items: '',
        total_amount: '',
        payment_method: 'CASH',
        order_type: 'DINE_IN',
        notes: '',
        reason: '',
        requested_by: '',
      }, 0);

      expect(errors).toEqual({
        '0.date': 'Required',
        '0.items': 'Required',
        '0.total_amount': 'Must be greater than 0',
      });
    });

    it('returns all errors for an empty expense record', () => {
      const errors = validateRecord({
        record_type: 'EXPENSE',
        date: '',
        items: '',
        total_amount: '',
        payment_method: 'CASH',
        order_type: 'DINE_IN',
        notes: '',
        reason: '',
        requested_by: '',
      }, 0);

      expect(errors).toEqual({
        '0.date': 'Required',
        '0.total_amount': 'Must be greater than 0',
        '0.reason': 'Required',
      });
    });

    it('returns empty object for a valid sale record', () => {
      const errors = validateRecord({
        record_type: 'SALE',
        date: '2026-03-07',
        items: 'Lechon x 1 @ 150',
        total_amount: '150',
        payment_method: 'CASH',
        order_type: 'DINE_IN',
        notes: '',
        reason: '',
        requested_by: '',
      }, 0);

      expect(errors).toEqual({});
    });

    it('returns empty object for a valid expense record', () => {
      const errors = validateRecord({
        record_type: 'EXPENSE',
        date: '2026-03-07',
        items: '',
        total_amount: '500',
        payment_method: 'CASH',
        order_type: 'DINE_IN',
        notes: '',
        reason: 'Gas',
        requested_by: 'Nenita',
      }, 0);

      expect(errors).toEqual({});
    });

    it('prefixes errors with the correct record index', () => {
      const errors = validateRecord({
        record_type: 'SALE',
        date: '',
        items: '',
        total_amount: '',
        payment_method: 'CASH',
        order_type: 'DINE_IN',
        notes: '',
        reason: '',
        requested_by: '',
      }, 3);

      expect(errors).toEqual({
        '3.date': 'Required',
        '3.items': 'Required',
        '3.total_amount': 'Must be greater than 0',
      });
    });
  });
});
