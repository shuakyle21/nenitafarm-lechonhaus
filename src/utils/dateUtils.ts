/**
 * Safely parses a date string, handling common format issues (like Safari's strictness with spaces)
 */
export const safeParseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Replace space with T to make it ISO-8601 compliant for Safari/Firefox
  // "2026-01-13 12:00:00" -> "2026-01-13T12:00:00"
  const sanitized = dateStr.includes(' ') && !dateStr.includes('T') 
    ? dateStr.replace(' ', 'T') 
    : dateStr;
    
  const date = new Date(sanitized);
  
  // Fallback for truly invalid dates
  if (isNaN(date.getTime())) {
    return new Date();
  }
  
  return date;
};

export const checkDateMatch = (dateStr: string, targetDateStr: string) => {
  const d = safeParseDate(dateStr);
  const localDate =
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0');
  return localDate === targetDateStr;
};

// Helper to get local date string YYYY-MM-DD
export const getLocalDateString = (date: Date) => {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
};

/**
 * Creates optimized date matcher functions with memoized 'today' reference
 * Prevents repeated Date object creation and improves performance
 */
export const createDateMatcher = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  return {
    /**
     * Check if a date string represents today
     */
    isToday: (dateString: string): boolean => {
      const date = safeParseDate(dateString);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === todayTime;
    },

    /**
     * Check if a date string is within the last 7 days
     */
    isThisWeek: (dateString: string): boolean => {
      const date = safeParseDate(dateString);
      const diffTime = Math.abs(todayTime - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    },

    /**
     * Check if a date string is within the last 30 days
     */
    isThisMonth: (dateString: string): boolean => {
      const date = safeParseDate(dateString);
      const diffTime = Math.abs(todayTime - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    },

    /**
     * Check if a date string is in the same calendar month
     */
    isSameMonth: (dateString: string): boolean => {
      const date = safeParseDate(dateString);
      return (
        date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
      );
    },

    /**
     * Get the today reference (useful for comparisons)
     */
    getToday: () => new Date(todayTime),
  };
};
