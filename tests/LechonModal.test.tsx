import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LechonModal from '../src/components/LechonModal';
import { MenuItem } from '../src/types';

const mockItem: MenuItem = {
  id: '1',
  name: 'Lechon Belly',
  price: 700,
  category: 'Lechon & Grills',
  image: 'lechon.jpg',
  isWeighted: true
};

describe('LechonModal', () => {
  it('calculates weight correctly when a price preset is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <LechonModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={onConfirm} 
        item={mockItem} 
      />
    );

    // Click P175 preset
    const preset175 = screen.getByText('₱175');
    fireEvent.click(preset175);

    // Check if price is 175 and weight is 0.250kg (175/700)
    expect(screen.getByText(/175\.00/)).toBeInTheDocument();
    expect(screen.getByText(/0\.250 kg/)).toBeInTheDocument();
  });

  it('calculates weight correctly for P350 preset', () => {
    const onConfirm = vi.fn();
    render(
      <LechonModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={onConfirm} 
        item={mockItem} 
      />
    );

    const preset350 = screen.getByText(/₱350/);
    fireEvent.click(preset350);

    expect(screen.getByText(/350\.00/)).toBeInTheDocument();
    expect(screen.getByText(/0\.500 kg/)).toBeInTheDocument();
  });

  it('calculates weight correctly for P700 preset', () => {
    const onConfirm = vi.fn();
    render(
      <LechonModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={onConfirm} 
        item={mockItem} 
      />
    );

    const preset700 = screen.getByText(/₱700/);
    fireEvent.click(preset700);

    expect(screen.getByText(/700\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1\.000 kg/)).toBeInTheDocument();
  });

  it('calculates price correctly for P100 preset', () => {
    const onConfirm = vi.fn();
    render(
      <LechonModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={onConfirm} 
        item={mockItem} 
      />
    );

    const preset100 = screen.getByText(/₱100/);
    fireEvent.click(preset100);

    expect(screen.getByText(/100\.00/)).toBeInTheDocument();
    // 100 / 700 = 0.142857... -> 0.143
    expect(screen.getByText(/0\.143 kg/)).toBeInTheDocument();
  });

  it('switches to by-price mode when a preset is clicked', () => {
    render(
      <LechonModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        item={mockItem} 
      />
    );

    // Initially in weight mode
    const byWeightBtn = screen.getByText('By Weight').closest('button');
    expect(byWeightBtn).toHaveClass('border-red-600');

    // Click a preset
    fireEvent.click(screen.getByText('₱175'));

    // Should switch to price mode
    const byPriceBtn = screen.getByText('By Price').closest('button');
    expect(byPriceBtn).toHaveClass('border-green-600');
  });
});
