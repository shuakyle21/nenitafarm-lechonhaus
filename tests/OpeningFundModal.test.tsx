import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import OpeningFundModal from '@/components/OpeningFundModal';

describe('OpeningFundModal', () => {
  it('renders correctly when open', () => {
    const mockSubmit = vi.fn();
    render(<OpeningFundModal isOpen={true} onSubmit={mockSubmit} isLoading={false} />);

    expect(screen.getByText('Start Shift')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const mockSubmit = vi.fn();
    render(<OpeningFundModal isOpen={false} onSubmit={mockSubmit} isLoading={false} />);

    expect(screen.queryByText('Start Shift')).not.toBeInTheDocument();
  });

  it('validates input and calls onSubmit', () => {
    const mockSubmit = vi.fn();
    render(<OpeningFundModal isOpen={true} onSubmit={mockSubmit} isLoading={false} />);

    const amountInput = screen.getByPlaceholderText('0.00');
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const submitButton = screen.getByRole('button', { name: /OPEN REGISTER/i });

    // Initial state: button disabled (implied by logic check, though we can check disabled attribute if we want)
    expect(submitButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '5000' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    expect(amountInput).toHaveValue(5000); // Input type number value is number? or string in JSDOM? usually string prop but match value.
    // wait, toHaveValue checks value attribute or property.

    expect(submitButton).toBeEnabled();

    const form = submitButton.closest('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);

    expect(mockSubmit).toHaveBeenCalledWith(5000, 'John Doe');
  });
});
