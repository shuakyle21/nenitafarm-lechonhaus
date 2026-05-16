# Plan: Add Expense Import to Paper POS Import Modal

## Problem
The Paper POS Import modal only imports **sales/order records**. Expenses recorded on paper (e.g., supplies, gas on 2/04/2026) have no way to be imported and therefore don't appear in the database or financial reports.

## Approach: Add a "Record Type" toggle per record card

Each record card in the import modal gets a **Sale / Expense** toggle at the top. Based on the selection, different fields are shown:

- **Sale (existing):** Date, Items, Total Amount, Payment Method, Order Type, Notes
- **Expense (new):** Date, Amount, Reason, Requested By, Notes

Users can mix sales and expenses in a single import batch (e.g., 3 sales + 2 expenses for the same date).

## Changes

### 1. `src/components/PaperPosImportModal.tsx`
- Add `record_type: 'SALE' | 'EXPENSE'` to `FormRecord` interface
- Add expense fields: `reason`, `requested_by` to `FormRecord`
- Add a segmented toggle (Sale / Expense) at the top of each expanded record card
- Conditionally render sale fields vs expense fields
- Update validation: expenses need date + amount > 0 + reason
- Update `handleImport` to separate records by type and call both `onImport` (sales) and `onImportExpenses` (expenses)
- Update record summary in the collapsed header to show "Expense" indicator

### 2. `src/components/PaperPosImportModal.tsx` (props)
- Add `onImportExpenses` callback prop: `(expenses: { date: string; amount: number; reason: string; requested_by: string }[]) => Promise<void>`

### 3. `src/services/paperPosImportService.ts`
- Add `importExpenses()` method that batch-inserts into the `expenses` table with a specific date

### 4. `src/hooks/usePaperPosImport.ts`
- Add `importExpenses()` function that calls the new service method

### 5. `src/components/FinancialModule.tsx`
- Pass the new `onImportExpenses` prop to `PaperPosImportModal`, wired to the service
- Call `onRefresh()` after expense import so reports update

### 6. `src/components/DashboardModule.tsx`
- Same wiring if the modal is also rendered there

## What stays the same
- Existing sales import flow is untouched
- Expense table schema (id, amount, reason, requested_by, date) — no migration needed
- Financial reports already read from `expenses` table, so imported expenses will automatically appear in dashboards and reports
