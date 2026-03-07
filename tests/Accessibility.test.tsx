import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PaperPosImportModal from '@/components/PaperPosImportModal';

describe('PaperPosImportModal - Accessibility', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn().mockResolvedValue(undefined),
    importedBy: 'Admin',
  };

  it('Sale/Expense toggle has role="radiogroup"', () => {
    render(<PaperPosImportModal {...defaultProps} />);
    const radiogroup = screen.getByRole('radiogroup', { name: /record type/i });
    expect(radiogroup).toBeInTheDocument();
  });

  it('Sale button has role="radio" and aria-checked="true" by default', () => {
    render(<PaperPosImportModal {...defaultProps} />);
    const saleRadio = screen.getByRole('radio', { name: /sale/i });
    expect(saleRadio).toBeInTheDocument();
    expect(saleRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('Expense button has role="radio" and aria-checked="false" by default', () => {
    render(<PaperPosImportModal {...defaultProps} />);
    const expenseRadio = screen.getByRole('radio', { name: /expense/i });
    expect(expenseRadio).toBeInTheDocument();
    expect(expenseRadio).toHaveAttribute('aria-checked', 'false');
  });

  it('toggling to Expense updates aria-checked on both buttons', async () => {
    render(<PaperPosImportModal {...defaultProps} />);
    const expenseRadio = screen.getByRole('radio', { name: /expense/i });
    fireEvent.click(expenseRadio);

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /expense/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /sale/i })).toHaveAttribute('aria-checked', 'false');
    });
  });
});
