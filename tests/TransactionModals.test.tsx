import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import ExpenseModal from '../components/ExpenseModal';
import SalesAdjustmentModal from '../components/SalesAdjustmentModal';

// Helper to wrap component with state for testing controlled inputs
const ExpenseModalWrapper = (props: any) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [person, setPerson] = useState('');
    return <ExpenseModal {...props} amount={amount} setAmount={setAmount} reason={reason} setReason={setReason} person={person} setPerson={setPerson} />;
};

const SalesAdjustmentModalWrapper = (props: any) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [person, setPerson] = useState('');
    return <SalesAdjustmentModal {...props} amount={amount} setAmount={setAmount} reason={reason} setReason={setReason} person={person} setPerson={setPerson} />;
};

describe('Transaction Modals', () => {
    describe('ExpenseModal', () => {
        it('updates inputs and submits', () => {
            const mockSubmit = vi.fn((e) => e.preventDefault());
            const mockClose = vi.fn();
            
            render(<ExpenseModalWrapper isOpen={true} onSubmit={mockSubmit} onClose={mockClose} isLoading={false} />);

            // Correct placeholders
            const amountInput = screen.getByPlaceholderText('0.00');
            const reasonInput = screen.getByPlaceholderText('e.g. Supplies, Gas');
            const nameInput = screen.getByPlaceholderText('Name');

            fireEvent.change(amountInput, { target: { value: '500' } });
            fireEvent.change(reasonInput, { target: { value: 'Gas' } });
            fireEvent.change(nameInput, { target: { value: 'Staff A' } });

            // Verify inputs updated
            expect(amountInput).toHaveValue(500); 
            expect(reasonInput).toHaveValue('Gas');
            expect(nameInput).toHaveValue('Staff A');

            fireEvent.click(screen.getByText('CONFIRM EXPENSE'));

            expect(mockSubmit).toHaveBeenCalled();
        });
    });

    describe('SalesAdjustmentModal', () => {
        it('updates inputs and submits', () => {
            const mockSubmit = vi.fn((e) => e.preventDefault());
            const mockClose = vi.fn();
            
            render(<SalesAdjustmentModalWrapper isOpen={true} onSubmit={mockSubmit} onClose={mockClose} isLoading={false} />);

            // Correct placeholders
            const amountInput = screen.getByPlaceholderText('0.00');
            const reasonInput = screen.getByPlaceholderText('e.g. Late Entry, Correction');
            const nameInput = screen.getByPlaceholderText('Name');

            fireEvent.change(amountInput, { target: { value: '200' } });
            fireEvent.change(reasonInput, { target: { value: 'Deposit' } });
            fireEvent.change(nameInput, { target: { value: 'Admin B' } });

            expect(amountInput).toHaveValue(200);
            expect(reasonInput).toHaveValue('Deposit');
            expect(nameInput).toHaveValue('Admin B');

            fireEvent.click(screen.getByText('CONFIRM ADDITION'));

            expect(mockSubmit).toHaveBeenCalled();
        });
    });
});
