import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PaperPosImportModal from '@/components/PaperPosImportModal';

describe('PaperPosImportModal - Touch Targets', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn().mockResolvedValue(undefined),
    importedBy: 'Admin',
  };

  it('Add Another Record button has aria-label', () => {
    render(<PaperPosImportModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add another record/i })).toBeInTheDocument();
  });

  it('delete record button has sufficient touch target classes (min-h-[44px] min-w-[44px])', async () => {
    render(<PaperPosImportModal {...defaultProps} />);
    const addBtn = screen.getByRole('button', { name: /add another record/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /remove record/i });
      expect(deleteButtons.length).toBeGreaterThan(0);

      deleteButtons.forEach((btn) => {
        expect(btn.className).toMatch(/min-h-\[44px\]/);
        expect(btn.className).toMatch(/min-w-\[44px\]/);
      });
    });
  });

  it('record type toggle buttons have sufficient min-height for touch (py-2.5)', () => {
    render(<PaperPosImportModal {...defaultProps} />);
    const saleBtn = screen.getByRole('button', { name: /^sale$/i });
    const expenseBtn = screen.getByRole('button', { name: /^expense$/i });

    expect(saleBtn.className).toMatch(/py-2\.5/);
    expect(expenseBtn.className).toMatch(/py-2\.5/);
  });
});
