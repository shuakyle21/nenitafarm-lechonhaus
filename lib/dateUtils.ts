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
