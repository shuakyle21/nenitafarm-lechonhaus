import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS v4 defaults
 */
export const breakpoints = {
  sm: 640,   // Mobile landscape
  md: 768,   // Tablet portrait
  lg: 1024,  // Tablet landscape / small laptop
  xl: 1280,  // Desktop
  '2xl': 1536 // Large desktop
} as const;

export type Breakpoint = keyof typeof breakpoints;

export interface BreakpointState {
  /** Current breakpoint name */
  current: Breakpoint | 'xs';
  /** Window width in pixels */
  width: number;
  /** True if viewport is mobile (< 768px) */
  isMobile: boolean;
  /** True if viewport is tablet (768-1023px) */
  isTablet: boolean;
  /** True if viewport is desktop (>= 1024px) */
  isDesktop: boolean;
  /** Check if current viewport is at least the given breakpoint */
  isAtLeast: (bp: Breakpoint) => boolean;
  /** Check if current viewport is below the given breakpoint */
  isBelow: (bp: Breakpoint) => boolean;
}

/**
 * Get the current breakpoint name based on window width
 */
function getBreakpoint(width: number): Breakpoint | 'xs' {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Custom hook to detect current viewport breakpoint
 * 
 * @example
 * const { isMobile, isDesktop, current } = useBreakpoint();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 */
export function useBreakpoint(): BreakpointState {
  const [width, setWidth] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    // Set initial width
    setWidth(window.innerWidth);

    // Debounced resize handler for performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  const current = getBreakpoint(width);

  const isAtLeast = useCallback((bp: Breakpoint): boolean => {
    return width >= breakpoints[bp];
  }, [width]);

  const isBelow = useCallback((bp: Breakpoint): boolean => {
    return width < breakpoints[bp];
  }, [width]);

  return {
    current,
    width,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isAtLeast,
    isBelow
  };
}

export default useBreakpoint;
