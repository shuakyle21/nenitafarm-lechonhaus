import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderHistoryModal from '@/components/OrderHistoryModal';
import { Order } from '@/types';

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
  Download: () => <div data-testid="icon-download" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Banknote: () => <div data-testid="icon-banknote" />,
  CheckCircle: () => <div data-testid="icon-check-circle" />,
}));

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}));

describe('OrderHistoryModal', () => {
  const mockOrders: Order[] = [
    {
      id: 'order-80',
      orderNumber: 80,
      date: '2025-12-02T10:00:00Z',
      items: [
        {
          id: '1',
          name: 'Lechon',
          price: 175,
          quantity: 1,
          finalPrice: 175,
          category: 'Lechon & Grills',
          image: 'lechon.jpg',
          cartId: '1',
          weight: 0.25,
          isWeighted: true,
        },
        {
          id: '2',
          name: 'Bulalo',
          price: 150,
          quantity: 1,
          finalPrice: 150,
          category: 'Soup',
          image: '',
          cartId: 'c2',
        },
        {
          id: '4',
          name: 'Plain Rice',
          price: 15,
          quantity: 4,
          finalPrice: 60,
          category: 'Extras',
          image: '',
          cartId: 'c4',
        },
      ],
      subtotal: 385,
      total: 385,
      cash: 500,
      change: 115,
      orderType: 'DINE_IN',
      discount: null,
    },
  ];

  it('renders Order #80 correctly with weighted item', async () => {
    // Set system time to match the order date (2025-12-02)
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-12-02T12:00:00Z'));

    render(<OrderHistoryModal isOpen={true} onClose={() => {}} orders={mockOrders} />);

    // Check Date Format (MM/DD/YYYY)
    // 2025-12-02T10:00:00Z -> 12/02/2025 (depending on timezone, but let's check for the parts)
    // Since we use toLocaleDateString('en-US'), it should be MM/DD/YYYY
    // Check Date Format (MM/DD/YYYY)
    // Check Order Type
    screen.debug();
    expect(screen.getByText(/Dine-in/i)).toBeInTheDocument();

    // Check Weighted Item Formatting
    // The component formats it as "1x Lechon (500g)" or similar.
    const lechonItem = screen.getByText(/Lechon/);
    expect(lechonItem).toBeInTheDocument();
    expect(lechonItem.textContent).toMatch(/250g|0.25kg/);

    // Check Receipt Modal Opening
    const receiptBtn = screen.getByTestId('view-receipt-order-80');
    fireEvent.click(receiptBtn);

    // Check if Receipt Modal content appears
    await screen.findByText(/Nenita Farm Lechon Haus/i);
    expect(screen.getByText(/Order #: 000080/i)).toBeInTheDocument(); // Padded order number

    // Check that the item amount is 350.00 (using finalPrice)
    // The modal displays it as "350.00" (without
    await screen.findByText('175.00'); // Lechon price
    const totals = await screen.findAllByText(/385\.00/); // Subtotal and Total
    expect(totals.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/1x Lechon.*\(250g\)/)).toBeInTheDocument();
  });
});
