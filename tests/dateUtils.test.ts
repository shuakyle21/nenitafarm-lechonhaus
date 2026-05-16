import { describe, it, expect } from 'vitest';
import { getDateRangeForFilter, getPhilippineStartOfDay, getPhilippineEndOfDay } from '../src/utils/dateUtils';

describe('Date Utils - Philippine Timezone', () => {
  describe('getPhilippineStartOfDay', () => {
    it('should return ISO string for start of day', () => {
      const date = new Date('2026-01-22T12:00:00Z');
      const result = getPhilippineStartOfDay(date);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('getPhilippineEndOfDay', () => {
    it('should return ISO string for end of day', () => {
      const date = new Date('2026-01-22T12:00:00Z');
      const result = getPhilippineEndOfDay(date);
      
      expect(result).toBeTruthy();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('getDateRangeForFilter', () => {
    it('should return correct range for today', () => {
      const result = getDateRangeForFilter('today');
      
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeTruthy();
      expect(result.endDate).toBeTruthy();
      
      // Verify startDate is before endDate
      expect(new Date(result.startDate).getTime()).toBeLessThan(new Date(result.endDate).getTime());
    });

    it('should return correct range for yesterday', () => {
      const result = getDateRangeForFilter('yesterday');
      
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeTruthy();
      expect(result.endDate).toBeTruthy();
      
      // Verify startDate is before endDate
      expect(new Date(result.startDate).getTime()).toBeLessThan(new Date(result.endDate).getTime());
    });

    it('should return correct range for last 7 days', () => {
      const result = getDateRangeForFilter('last7days');
      
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeTruthy();
      expect(result.endDate).toBeTruthy();
      
      // Verify startDate is before endDate
      const startTime = new Date(result.startDate).getTime();
      const endTime = new Date(result.endDate).getTime();
      expect(startTime).toBeLessThan(endTime);
      
      // Verify the range is approximately 7 days (with timezone considerations)
      const diffInDays = (endTime - startTime) / (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeGreaterThanOrEqual(5);
      expect(diffInDays).toBeLessThanOrEqual(8);
    });
  });
});
