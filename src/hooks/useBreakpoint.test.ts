import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint, breakpoints } from './useBreakpoint';

describe('useBreakpoint', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original window width
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
  });

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  describe('breakpoint detection', () => {
    it('returns "xs" for very small screens (< 640px)', () => {
      setWindowWidth(400);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.current).toBe('xs');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('returns "sm" for small screens (640-767px)', () => {
      setWindowWidth(640);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.current).toBe('sm');
      expect(result.current.isMobile).toBe(true);
    });

    it('returns "md" for tablet screens (768-1023px)', () => {
      setWindowWidth(768);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.current).toBe('md');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('returns "lg" for laptop screens (1024-1279px)', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.current).toBe('lg');
      expect(result.current.isDesktop).toBe(true);
    });

    it('returns "xl" for desktop screens (1280-1535px)', () => {
      setWindowWidth(1280);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.current).toBe('xl');
      expect(result.current.isDesktop).toBe(true);
    });

    it('returns "2xl" for large desktop screens (>= 1536px)', () => {
      setWindowWidth(1536);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.current).toBe('2xl');
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('isAtLeast helper', () => {
    it('returns true when viewport is at or above the given breakpoint', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.isAtLeast('sm')).toBe(true);
      expect(result.current.isAtLeast('md')).toBe(true);
      expect(result.current.isAtLeast('lg')).toBe(true);
      expect(result.current.isAtLeast('xl')).toBe(false);
    });
  });

  describe('isBelow helper', () => {
    it('returns true when viewport is below the given breakpoint', () => {
      setWindowWidth(600);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.isBelow('sm')).toBe(true);
      expect(result.current.isBelow('md')).toBe(true);
      expect(result.current.isBelow('lg')).toBe(true);
    });
  });

  describe('resize handling', () => {
    it('updates breakpoint on window resize', async () => {
      vi.useFakeTimers();
      setWindowWidth(400);
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current.isMobile).toBe(true);
      
      // Simulate resize to desktop
      act(() => {
        setWindowWidth(1280);
        // Fast-forward past debounce timeout
        vi.advanceTimersByTime(150);
      });
      
      expect(result.current.isDesktop).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('breakpoints constant', () => {
    it('exports correct breakpoint values', () => {
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(1024);
      expect(breakpoints.xl).toBe(1280);
      expect(breakpoints['2xl']).toBe(1536);
    });
  });
});
