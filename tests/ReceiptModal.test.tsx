import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReceiptModal from '../components/ReceiptModal';
import { CartItem } from '../types';

// Mock html-to-image to prevent errors
vi.mock('html-to-image', () => ({
    toPng: vi.fn(),
}));

describe('ReceiptModal', () => {
    const mockSave = vi.fn();
    const mockClose = vi.fn();
    const mockCart: CartItem[] = [
        { id: '1', name: 'Lechon', price: 500, quantity: 1, finalPrice: 500, category: 'Lechon', cartId: 'abc' }
    ];

    it('handles CASH payment correctly', () => {
        render(
            <ReceiptModal 
                isOpen={true} 
                onClose={mockClose} 
                onSaveOrder={mockSave} 
                cart={mockCart} 
                total={500}
                orderCount={1}
            />
        );

        // Default should be CASH
        expect(screen.getByText('Cash Tendered')).toBeInTheDocument();

        // Enter exact amount
        const input = screen.getByPlaceholderText('Enter Amount');
        fireEvent.change(input, { target: { value: '500' } });

        // Confirm
        const confirmBtn = screen.getByText('CONFIRM & SAVE ORDER');
        fireEvent.click(confirmBtn);

        expect(mockSave).toHaveBeenCalled();
        const savedOrder = mockSave.mock.calls[0][0];
        expect(savedOrder.paymentMethod).toBe('CASH');
        expect(savedOrder.cash).toBe(500);
    });

    it('handles GCASH payment correctly', () => {
        render(
            <ReceiptModal 
                isOpen={true} 
                onClose={mockClose} 
                onSaveOrder={mockSave} 
                cart={mockCart} 
                total={500}
                orderCount={1}
            />
        );

        // Select GCASH
        fireEvent.click(screen.getByText('GCASH'));

        // Should show Reference Number input
        expect(screen.getByText('Reference Number')).toBeInTheDocument();
        const refInput = screen.getByPlaceholderText('Enter Ref #');

        // Enter reference
        fireEvent.change(refInput, { target: { value: 'REF12345' } });

        // Confirm
        const confirmBtn = screen.getByText('CONFIRM & SAVE ORDER');
        fireEvent.click(confirmBtn);

        expect(mockSave).toHaveBeenCalled();
        const savedOrder = mockSave.mock.calls[1][0]; // 2nd call
        expect(savedOrder.paymentMethod).toBe('GCASH');
        expect(savedOrder.paymentReference).toBe('REF12345');
    });
});
