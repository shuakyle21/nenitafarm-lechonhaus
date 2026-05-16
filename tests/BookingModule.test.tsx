import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingModule from '@/components/BookingModule';
import { MenuItem } from '@/types';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockFrom = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    then: (resolve) => resolve({ data: [], error: null }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(mockFrom),
    },
  };
});

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="icon-calendar" />,
  Clock: () => <div data-testid="icon-clock" />,
  Users: () => <div data-testid="icon-users" />,
  Phone: () => <div data-testid="icon-phone" />,
  User: () => <div data-testid="icon-user" />,
  FileText: () => <div data-testid="icon-file-text" />,
  CheckCircle: () => <div data-testid="icon-check-circle" />,
  XCircle: () => <div data-testid="icon-x-circle" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Pencil: () => <div data-testid="icon-pencil" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Plus: () => <div data-testid="icon-plus" />,
  Minus: () => <div data-testid="icon-minus" />,
  ShoppingBag: () => <div data-testid="icon-shopping-bag" />,
  CreditCard: () => <div data-testid="icon-credit-card" />,
  Printer: () => <div data-testid="icon-printer" />,
  Search: () => <div data-testid="icon-search" />,
  X: () => <div data-testid="icon-x" />,
}));

// Mock PDF renderer
vi.mock('@react-pdf/renderer', () => ({
  pdf: () => ({
    toBlob: () => Promise.resolve(new Blob()),
  }),
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (styles: any) => styles },
  Image: () => <div />,
}));

describe('BookingModule', () => {
  const mockItems: MenuItem[] = [
    {
      id: '1',
      name: 'Lechon Belly',
      price: 650,
      category: 'Lechon & Grills',
      image: '',
      isWeighted: false,
    },
    { id: '2', name: 'Bulalo', price: 350, category: 'Soup', image: '', isWeighted: false },
  ];

  it('renders correctly', () => {
    render(<BookingModule items={mockItems} />);
    expect(screen.getByText('Bookings & Reservations')).toBeInTheDocument();
  });

  it('allows selecting Pre-order type', () => {
    render(<BookingModule items={mockItems} />);
    const preOrderRadio = screen.getByLabelText('Pre-order');
    fireEvent.click(preOrderRadio);
    expect(screen.getByText('Order Details')).toBeInTheDocument();
  });

  it('calculates total correctly when adding items', () => {
    render(<BookingModule items={mockItems} />);

    // Select Pre-order
    fireEvent.click(screen.getByLabelText('Pre-order'));

    // Open Item Selector
    const openBtn = screen.getByTestId('open-item-selector');
    fireEvent.click(openBtn);

    // Find and add Lechon Belly
    const addBtn = screen.getByTestId('add-item-1');
    fireEvent.click(addBtn);

    // Confirm selection
    const confirmBtn = screen.getByTestId('confirm-add-items');
    fireEvent.click(confirmBtn);

    // Check Total
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByTestId('total-amount')).toHaveTextContent('₱650');
  });
});
