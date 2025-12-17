import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DashboardModule from '@/components/DashboardModule';
import { MenuItem, Order } from '@/types';

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Recharts to avoid complex rendering
vi.mock('recharts', async () => {
  const Actual = await vi.importActual('recharts');
  return {
    ...Actual,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 800 }}>{children}</div>
    ),
    LineChart: () => <div>LineChart</div>,
  };
});

describe('DashboardModule', () => {
  const mockItems: MenuItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    category: 'Test Category',
    price: 100,
    image: 'test.jpg',
    description: 'desc',
    available: true,
    attributes: [], // Satisfy type
    variants: [],
  }));

  // Create orders where Item 0 sold 10, Item 1 sold 9, ..., Item 9 sold 1
  // We need to make sure the date is TODAY so it shows up in default view
  const mockOrders: Order[] = [];
  const today = new Date();

  mockItems.forEach((item, index) => {
    const quantity = 10 - index;
    // Create an order for this item
    mockOrders.push({
      id: `order-${index}`,
      date: today.toISOString(), // Today
      total: item.price * quantity,
      items: [
        {
          ...item,
          quantity: quantity,
          finalPrice: item.price * quantity,
          cartId: `cart-${index}`,
        },
      ],
      orderType: 'DINE_IN',
      status: 'COMPLETED',
      customerName: 'Test',
    } as any);
  });

  it('displays all items (more than 5) correctly sorted by count', () => {
    render(
      <DashboardModule items={mockItems} orders={mockOrders} salesAdjustments={[]} expenses={[]} />
    );

    // Check if "Top Menu Items" header is present
    expect(screen.getByText('Top Menu Items')).toBeInTheDocument();

    // Check if all 10 items are displayed (Change from limit 5)
    mockItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });

    // Verify Item 0 (10 sold) is present
    expect(screen.getByText('10 sold')).toBeInTheDocument();
    // Verify Item 9 (1 sold) is present
    expect(screen.getByText('1 sold')).toBeInTheDocument();

    // Verify sorting by checking the order of elements
    // The items are rendered in a list. We can grab all "sold" texts.
    const soldElements = screen.getAllByText(/sold$/);

    // Extract numbers: "10 sold" -> 10
    const counts = soldElements.map((el) => parseInt(el.textContent?.split(' ')[0] || '0'));

    // Assert descending order
    for (let i = 0; i < counts.length - 1; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
    }

    // Assert we have at least 10 items shown
    expect(counts.length).toBeGreaterThanOrEqual(10);
  });
});
