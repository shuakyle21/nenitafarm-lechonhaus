import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ExpenseCard from '@/components/ExpenseCard';

describe('ExpenseCard', () => {
  const defaultProps = {
    reason: 'Gas for delivery',
    amount: 500,
    person: 'Juan',
    date: '2026-03-07T10:00:00Z',
    type: 'EXPENSE' as const,
    onDelete: vi.fn(),
  };

  it('renders the expense reason', () => {
    render(<ExpenseCard {...defaultProps} />);
    expect(screen.getByText('Gas for delivery')).toBeInTheDocument();
  });

  it('renders the formatted amount with minus sign for expenses', () => {
    render(<ExpenseCard {...defaultProps} />);
    expect(screen.getByText(/-.*500/)).toBeInTheDocument();
  });

  it('renders the person name', () => {
    render(<ExpenseCard {...defaultProps} />);
    expect(screen.getByText('Juan')).toBeInTheDocument();
  });

  it('renders a delete button that is always visible (not opacity-0)', () => {
    render(<ExpenseCard {...defaultProps} />);
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn).toBeInTheDocument();
    // Must NOT have opacity-0 (should be visible on mobile without hover)
    expect(deleteBtn.className).not.toMatch(/opacity-0/);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<ExpenseCard {...defaultProps} />);
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    deleteBtn.click();
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders a CASH_DROP type with cash drop label', () => {
    render(<ExpenseCard {...defaultProps} type="CASH_DROP" reason="Cash Drop" />);
    expect(screen.getByText('DROP')).toBeInTheDocument();
  });

  it('renders green color for SALES type', () => {
    render(<ExpenseCard {...defaultProps} type="SALES" amount={1000} reason="Manual Sale" />);
    // Should show + sign for sales
    expect(screen.getByText(/\+/)).toBeInTheDocument();
  });
});
