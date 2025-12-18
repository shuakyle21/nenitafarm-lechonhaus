export const checkDateMatch = (dateStr: string, targetDateStr: string) => {
  const d = new Date(dateStr);
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
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === todayTime;
    },

    /**
     * Check if a date string is within the last 7 days
     */
    isThisWeek: (dateString: string): boolean => {
      const date = new Date(dateString);
      const diffTime = Math.abs(todayTime - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    },

    /**
     * Check if a date string is within the last 30 days
     */
    isThisMonth: (dateString: string): boolean => {
      const date = new Date(dateString);
      const diffTime = Math.abs(todayTime - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    },

    /**
     * Check if a date string is in the same calendar month
     */
    isSameMonth: (dateString: string): boolean => {
      const date = new Date(dateString);
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
