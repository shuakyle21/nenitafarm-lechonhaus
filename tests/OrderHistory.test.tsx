import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderHistoryModal from '../components/OrderHistoryModal';
import { Order, CartItem } from '../types';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
    X: () => <div data-testid="icon-x" />,
    Search: () => <div data-testid="icon-search" />,
    FileText: () => <div data-testid="icon-file-text" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Clock: () => <div data-testid="icon-clock" />,
    Utensils: () => <div data-testid="icon-utensils" />,
    ShoppingBag: () => <div data-testid="icon-shopping-bag" />,
    Printer: () => <div data-testid="icon-printer" />,
}));

describe('OrderHistoryModal', () => {
    const mockOrders: Order[] = [
        {
            id: 'order-80',
            orderNumber: 80,
            date: '2025-12-02T10:00:00Z',
            items: [
                { id: '1', name: 'Lechon (1 kilo)', price: 700, quantity: 1, finalPrice: 350, category: 'Lechon & Grills', image: '', cartId: 'c1', weight: 0.5, isWeighted: true },
                { id: '2', name: 'Bulalo', price: 150, quantity: 1, finalPrice: 150, category: 'Soup', image: '', cartId: 'c2' },
                { id: '3', name: 'Native Tinola Manok (Solo)', price: 70, quantity: 2, finalPrice: 140, category: 'Soup', image: '', cartId: 'c3' },
                { id: '4', name: 'Plain Rice', price: 15, quantity: 6, finalPrice: 90, category: 'Extras', image: '', cartId: 'c4' },
            ],
            subtotal: 730,
            total: 730,
            cash: 1000,
            change: 270,
            orderType: 'DINE_IN',
        }
    ];

    it('renders Order #80 correctly with weighted item', () => {
        render(
            <OrderHistoryModal
                isOpen={true}
                onClose={() => { }}
                orders={mockOrders}
            />
        );

        // Check Order ID
        expect(screen.getByText('#80')).toBeInTheDocument();

        // Check Total Price
        expect(screen.getByTestId('order-total-order-80')).toHaveTextContent('₱730.00');

        // Check Receipt Button
        expect(screen.getByTestId('icon-printer')).toBeInTheDocument();

        // Check Order Type
        expect(screen.getByText(/Dine-in/i)).toBeInTheDocument();

        // Check Weighted Item Formatting
        // The component formats it as "1x Lechon (500g)" or similar. 
        // Based on current logic: 0.5 * 1000 = 500g.
        // Name "Lechon (1 kilo)" might be cleaned to "Lechon".
        // Let's check for the presence of "500g" or "0.5kg"
        const lechonItem = screen.getByText(/Lechon/);
        expect(lechonItem).toBeInTheDocument();
        expect(lechonItem.textContent).toMatch(/500g|0.5kg/);
    });
});
