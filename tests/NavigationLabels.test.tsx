import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';
import MainSidebar from '@/components/MainSidebar';

describe('MobileBottomNav - Navigation Labels & Accessibility', () => {
  const defaultProps = {
    activeModule: 'POS' as const,
    onModuleChange: vi.fn(),
    userRole: 'ADMIN' as const,
    onLogout: vi.fn(),
  };

  it('renders text labels for all primary nav items', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByText('Dash')).toBeInTheDocument();
    expect(screen.getByText('POS')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('renders text label for More button', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders text label for Logout button', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByText('OFF')).toBeInTheDocument();
  });

  it('has aria-label on each primary nav button', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /point of sale/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /financial analysis/i })).toBeInTheDocument();
  });

  it('has aria-label on the More button', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
  });

  it('has aria-label on the logout button', () => {
    render(<MobileBottomNav {...defaultProps} />);
    expect(screen.getByRole('button', { name: /log\s?out/i })).toBeInTheDocument();
  });

  it('shows only POS and Booking for CASHIER role', () => {
    render(<MobileBottomNav {...defaultProps} userRole="CASHIER" />);
    expect(screen.getByText('POS')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.queryByText('Dash')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
  });
});

describe('MainSidebar - Navigation Labels & Accessibility', () => {
  const defaultProps = {
    activeModule: 'POS' as const,
    onModuleChange: vi.fn(),
    userRole: 'ADMIN' as const,
    onLogout: vi.fn(),
    isOnline: true,
    pendingOrdersCount: 0,
  };

  it('renders text labels for all sidebar nav buttons', () => {
    render(<MainSidebar {...defaultProps} />);
    expect(screen.getByText('Dash')).toBeInTheDocument();
    expect(screen.getByText('POS')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Audit')).toBeInTheDocument();
  });

  it('has aria-label on each sidebar nav button', () => {
    render(<MainSidebar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /point of sale/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /booking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /staff/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /financ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audit/i })).toBeInTheDocument();
  });

  it('has aria-label on the logout button', () => {
    render(<MainSidebar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /log\s?out/i })).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<MainSidebar {...defaultProps} isOnline={true} />);
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
  });

  it('shows offline status indicator', () => {
    render(<MainSidebar {...defaultProps} isOnline={false} />);
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });
});
