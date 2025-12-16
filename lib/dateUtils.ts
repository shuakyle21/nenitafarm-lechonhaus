export const checkDateMatch = (dateStr: string, targetDateStr: string) => {
    const d = new Date(dateStr);
    const localDate = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    return localDate === targetDateStr;
};

// Helper to get local date string YYYY-MM-DD
export const getLocalDateString = (date: Date) => {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
};

/**
 * Normalize a date to start of day for efficient comparison
 * Cache-friendly by removing time component
 */
export const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

/**
 * Check if a date string matches today
 * Optimized with reusable today reference
 */
export const isToday = (dateString: string, todayRef?: Date): boolean => {
    const date = new Date(dateString);
    const today = todayRef || new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date string is within the last N days
 */
export const isWithinDays = (dateString: string, days: number, refDate?: Date): boolean => {
    const date = new Date(dateString);
    const reference = refDate || new Date();
    const diffTime = reference.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
};

/**
 * Check if a date matches specific date components
 * More efficient than creating strings
 */
export const dateMatches = (dateString: string, targetDate: Date): boolean => {
    const date = new Date(dateString);
    return date.getDate() === targetDate.getDate() &&
        date.getMonth() === targetDate.getMonth() &&
        date.getFullYear() === targetDate.getFullYear();
};
