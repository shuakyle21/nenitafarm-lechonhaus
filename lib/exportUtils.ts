import { saveAs } from 'file-saver';

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // specific flattening logic could go here or be handled by the caller.
    // simpler to handle generic object-to-csv here.
    
    // Get headers from first object keys
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Handle strings that might contain commas or newlines
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                // Handle dates or other types if needed, but usually toString is fine for numbers
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create Blob and save
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
};
