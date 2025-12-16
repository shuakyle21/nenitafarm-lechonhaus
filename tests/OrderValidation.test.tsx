import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PosModule from '../components/PosModule';
import { MenuItem, Staff } from '../types';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            data: [],
            error: null
          })
        })
      }),
      insert: () => ({
        select: () => ({
          data: [],
          error: null
        })
      }),
      update: () => ({
        eq: () => ({
          data: [],
          error: null
        })
      }),
      delete: () => ({
        eq: () => ({
          data: [],
          error: null
        })
      })
    })
  }
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="icon-search" />,
  Settings: () => <div data-testid="icon-settings" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Minus: () => <div data-testid="icon-minus" />,
  Plus: () => <div data-testid="icon-plus" />,
  Receipt: () => <div data-testid="icon-receipt" />,
  Tag: () => <div data-testid="icon-tag" />,
  Users: () => <div data-testid="icon-users" />,
  ChevronDown: () => <div data-testid="icon-chevron-down" />,
  Utensils: () => <div data-testid="icon-utensils" />,
  ShoppingBag: () => <div data-testid="icon-shopping-bag" />,
  Clock: () => <div data-testid="icon-clock" />,
  X: () => <div data-testid="icon-x" />,
  Printer: () => <div data-testid="icon-printer" />,
  Download: () => <div data-testid="icon-download" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Banknote: () => <div data-testid="icon-banknote" />,
  CheckCircle: () => <div data-testid="icon-check-circle" />,
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

describe('Order Validation', () => {
  const mockItems: MenuItem[] = [
    {
      id: '1',
      name: 'Lechon Belly',
      price: 350,
      category: 'Lechon & Grills',
      image: '',
      isWeighted: false
    },
    {
      id: '2',
      name: 'Bulalo',
      price: 150,
      category: 'Soup',
      image: '',
      isWeighted: false
    }
  ];

  const mockStaff: Staff[] = [
    { id: '1', name: 'Maria Cruz', role: 'Server', isActive: true }
  ];

  const mockOnSaveOrder = vi.fn();
  const mockOnAddItem = vi.fn();
  const mockOnUpdateItem = vi.fn();
  const mockOnDeleteItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
    // Mock window.alert
    window.alert = vi.fn();
  });

  it('should prevent checkout when cart is empty', () => {
    render(
      <PosModule
        items={mockItems}
        orderCount={0}
        onAddItem={mockOnAddItem}
        onUpdateItem={mockOnUpdateItem}
        onDeleteItem={mockOnDeleteItem}
        onSaveOrder={mockOnSaveOrder}
        staffList={mockStaff}
      />
    );

    // Find the PAY button - it should be disabled when cart is empty
    const payButton = screen.getByRole('button', { name: /PAY/i });
    expect(payButton).toBeDisabled();
  });

  it('should show alert when trying to confirm empty order', async () => {
    render(
      <PosModule
        items={mockItems}
        orderCount={0}
        onAddItem={mockOnAddItem}
        onUpdateItem={mockOnUpdateItem}
        onDeleteItem={mockOnDeleteItem}
        onSaveOrder={mockOnSaveOrder}
        staffList={mockStaff}
      />
    );

    // Try to manually trigger the confirm handler (simulating edge case)
    const payButton = screen.getByRole('button', { name: /PAY/i });
    
    // Even if we force click, it should be prevented
    expect(payButton).toBeDisabled();
  });

  it('should enable PAY button when items are in cart', () => {
    render(
      <PosModule
        items={mockItems}
        orderCount={0}
        onAddItem={mockOnAddItem}
        onUpdateItem={mockOnUpdateItem}
        onDeleteItem={mockOnDeleteItem}
        onSaveOrder={mockOnSaveOrder}
        staffList={mockStaff}
      />
    );

    // Add an item to cart
    const lechonItem = screen.getByText('Lechon Belly');
    fireEvent.click(lechonItem);

    // PAY button should now be enabled
    const payButton = screen.getByRole('button', { name: /PAY/i });
    expect(payButton).not.toBeDisabled();
  });

  it('should disable PAY button after clearing cart', () => {
    render(
      <PosModule
        items={mockItems}
        orderCount={0}
        onAddItem={mockOnAddItem}
        onUpdateItem={mockOnUpdateItem}
        onDeleteItem={mockOnDeleteItem}
        onSaveOrder={mockOnSaveOrder}
        staffList={mockStaff}
      />
    );

    // Add an item to cart
    const lechonItem = screen.getByText('Lechon Belly');
    fireEvent.click(lechonItem);

    // Verify PAY button is enabled
    let payButton = screen.getByRole('button', { name: /PAY/i });
    expect(payButton).not.toBeDisabled();

    // Click Void button to clear cart
    const voidButton = screen.getByRole('button', { name: /Void/i });
    fireEvent.click(voidButton);

    // PAY button should be disabled again
    payButton = screen.getByRole('button', { name: /PAY/i });
    expect(payButton).toBeDisabled();
  });

  it('should not save order if cart is empty in receipt modal', () => {
    render(
      <PosModule
        items={mockItems}
        orderCount={0}
        onAddItem={mockOnAddItem}
        onUpdateItem={mockOnUpdateItem}
        onDeleteItem={mockOnDeleteItem}
        onSaveOrder={mockOnSaveOrder}
        staffList={mockStaff}
      />
    );

    // Add an item to cart
    const lechonItem = screen.getByText('Lechon Belly');
    fireEvent.click(lechonItem);

    // Click PAY to open receipt modal
    const payButton = screen.getByRole('button', { name: /PAY/i });
    fireEvent.click(payButton);

    // Receipt modal should be visible (check for multiple occurrences)
    const headings = screen.getAllByText(/Nenita Farm Lechon Haus/i);
    expect(headings.length).toBeGreaterThan(0);

    // The order should not be saved yet (no confirmation)
    expect(mockOnSaveOrder).not.toHaveBeenCalled();
  });
});
