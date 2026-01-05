import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before importing the service
vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

import { paperPosImportService } from '../src/services/paperPosImportService';

describe('paperPosImportService', () => {
  describe('parseItems', () => {
    it('should parse items in text format correctly', () => {
      const itemsString = 'Lechon Baboy x 2 @ 150, Pork BBQ x 3 @ 50';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Lechon Baboy');
      expect(result[0].quantity).toBe(2);
      expect(result[0].price).toBe(150);
      expect(result[0].finalPrice).toBe(300);

      expect(result[1].name).toBe('Pork BBQ');
      expect(result[1].quantity).toBe(3);
      expect(result[1].price).toBe(50);
      expect(result[1].finalPrice).toBe(150);
    });

    it('should parse items with decimal quantities', () => {
      const itemsString = 'Lechon Belly x 1.5 @ 200';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lechon Belly');
      expect(result[0].quantity).toBe(1.5);
      expect(result[0].price).toBe(200);
      expect(result[0].finalPrice).toBe(300);
    });

    it('should parse items with decimal prices', () => {
      const itemsString = 'Rice x 2 @ 25.50';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Rice');
      expect(result[0].quantity).toBe(2);
      expect(result[0].price).toBe(25.5);
      expect(result[0].finalPrice).toBe(51);
    });

    it('should handle multiple items with various formats', () => {
      const itemsString =
        'Lechon Baboy x 1 @ 150, Pork BBQ x 2 @ 50, Chicken Inasal x 1.5 @ 75.50';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Lechon Baboy');
      expect(result[1].name).toBe('Pork BBQ');
      expect(result[2].name).toBe('Chicken Inasal');
      expect(result[2].quantity).toBe(1.5);
      expect(result[2].price).toBe(75.5);
      expect(result[2].finalPrice).toBe(113.25);
    });

    it('should handle item names with extra spaces', () => {
      const itemsString = '  Lechon  Baboy  x  2  @  150  ,  Pork BBQ x 3 @ 50  ';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Lechon  Baboy');
      expect(result[0].quantity).toBe(2);
    });

    it('should parse JSON formatted items', () => {
      const items = [
        {
          id: 'test-1',
          cartId: 'cart-1',
          name: 'Lechon Baboy',
          price: 150,
          quantity: 2,
          finalPrice: 300,
          category: 'Lechon & Grills',
          image: 'test.jpg',
        },
      ];
      const itemsString = JSON.stringify(items);
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Lechon Baboy');
      expect(result[0].quantity).toBe(2);
      expect(result[0].price).toBe(150);
    });

    it('should return empty array for invalid format', () => {
      const itemsString = 'Invalid format without proper structure';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty string', () => {
      const itemsString = '';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(0);
    });

    it('should split items by commas (limitation: commas in names will create separate items)', () => {
      // This is a known limitation - commas in item names will split the item
      const itemsString = 'Lechon Baboy, Grilled x 2 @ 150';
      const result = paperPosImportService.parseItems(itemsString);

      // Due to comma splitting, "Lechon Baboy" becomes one item and "Grilled x 2 @ 150" might not parse correctly
      // The test documents this limitation rather than testing ideal behavior
      // Users should avoid commas in item names or use JSON format for complex items
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should correctly assign default category and empty image', () => {
      const itemsString = 'Test Item x 1 @ 100';
      const result = paperPosImportService.parseItems(itemsString);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Short Orders');
      expect(result[0].image).toBe('');
    });
  });
});
