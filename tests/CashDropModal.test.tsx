import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CashDropModal from '../components/CashDropModal';

describe('CashDropModal', () => {
    it('renders correctly when open', () => {
        const mockSubmit = vi.fn();
        const mockClose = vi.fn();
        render(<CashDropModal isOpen={true} onSubmit={mockSubmit} onClose={mockClose} isLoading={false} />);
        
        expect(screen.getByText('Cash Drop')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    it('validates input and calls onSubmit', () => {
        const mockSubmit = vi.fn();
        const mockClose = vi.fn();
        render(<CashDropModal isOpen={true} onSubmit={mockSubmit} onClose={mockClose} isLoading={false} />);
        
        const amountInput = screen.getByPlaceholderText('0.00');
        const reasonInput = screen.getByPlaceholderText('e.g. Bank Deposit, Safe Keeping');
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const submitButton = screen.getByRole('button', { name: /CONFIRM DROP/i });

        expect(submitButton).toBeDisabled();

        fireEvent.change(amountInput, { target: { value: '1000' } });
        fireEvent.change(reasonInput, { target: { value: 'Bank Deposit' } });
        fireEvent.change(nameInput, { target: { value: 'Admin' } });

        expect(submitButton).toBeEnabled();

        const form = submitButton.closest('form');
        expect(form).toBeInTheDocument();
        fireEvent.submit(form!);

        expect(mockSubmit).toHaveBeenCalledWith(1000, 'Bank Deposit', 'Admin');
    });
});
