# Paper POS Import Feature

## Overview

The Paper POS Import feature allows you to import sales data that was recorded on paper (e.g., during system downtime or offline periods) into the digital POS system. This ensures that all sales data is accurately captured and synced to your database.

## Features

- **Manual Entry**: Enter paper-recorded sales one by one through an intuitive form
- **CSV Import**: Bulk import multiple records using CSV format
- **Item Parsing**: Automatically parse item descriptions in a simple text format
- **Sync to Database**: Convert imported records into proper order entries
- **Import History**: Track all imported records with status (synced/pending)
- **Bulk Operations**: Sync all pending records at once

## How to Use

### Accessing the Feature

1. Log in to the system as an Admin user
2. Navigate to the **Finance** page
3. Look for the **Import Paper POS** button in the Quick Actions section

### Manual Entry

1. Click **Import Paper POS** button
2. Fill in the record details:
   - **Date**: The date when the sale occurred
   - **Total Amount**: The total sale amount
   - **Payment Method**: Cash, GCash, or Maya
   - **Order Type**: Dine In, Takeout, or Delivery
   - **Items**: Enter items in the format described below
   - **Notes**: Optional notes about the transaction

3. Click **Add Another Record** to enter multiple records at once
4. Click **Import** to save the records

### CSV Import

1. Click **Import Paper POS** button
2. Click the **CSV Import** toggle
3. Enter or paste CSV data in the following format:

```csv
date,items,total_amount,payment_method,order_type,notes
2024-01-01,Lechon Baboy x 2 @ 150,300,CASH,DINE_IN,Customer paid in cash
2024-01-01,Pork BBQ x 3 @ 50,150,GCASH,TAKEOUT,GCash payment
```

4. Click **Parse CSV** to convert the CSV data into records
5. Review the parsed records and click **Import**

### Item Format

Items should be entered in the following format:

```
Item Name x Quantity @ Price
```

**Examples:**
- `Lechon Baboy x 2 @ 150` - 2 servings of Lechon Baboy at 150 each
- `Pork BBQ x 3 @ 50` - 3 sticks of Pork BBQ at 50 each
- `Chicken Inasal x 1.5 @ 75.50` - 1.5 servings at 75.50 each

**Multiple Items:**
Separate multiple items with commas:
```
Lechon Baboy x 2 @ 150, Pork BBQ x 3 @ 50, Rice x 2 @ 25
```

**JSON Format:**
For complex items, you can also use JSON format:
```json
[
  {
    "id": "item-1",
    "name": "Lechon Baboy",
    "price": 150,
    "quantity": 2,
    "finalPrice": 300
  }
]
```

### Viewing Imported Records

1. After importing, click **View Paper Records** button in Quick Actions
2. You'll see a list of all imported records with their status
3. Expand a record to see detailed information

### Syncing Records to Database

**Individual Sync:**
- Click the **Sync** button next to any pending record
- The record will be converted to a proper order in the database

**Bulk Sync:**
- Click the **Sync All** button at the top of the records list
- All pending records will be synced at once
- You'll see a summary of successful and failed syncs

### Managing Records

**Delete a Record:**
- Click the trash icon next to any record
- Confirm the deletion (this action cannot be undone)

**Note**: Once a record is synced, it cannot be deleted from the paper imports list (but the linked order can be managed separately).

## Database Schema

The feature creates a new table called `paper_pos_imports`:

```sql
CREATE TABLE paper_pos_imports (
  id UUID PRIMARY KEY,
  date TEXT NOT NULL,
  items TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'CASH',
  order_type TEXT DEFAULT 'DINE_IN',
  notes TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  imported_by TEXT,
  synced BOOLEAN DEFAULT false,
  synced_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Migration

To enable this feature in your database:

1. Run the migration file: `supabase/migrations/20260105_add_paper_pos_imports.sql`
2. The migration will:
   - Create the `paper_pos_imports` table
   - Enable Row Level Security
   - Create necessary policies
   - Add indexes for better performance

## Best Practices

1. **Regular Syncing**: Sync imported records as soon as possible to keep your database up-to-date
2. **Data Validation**: Double-check amounts and items before importing
3. **Consistent Format**: Use the same item name format for easier reporting
4. **Add Notes**: Include helpful notes about the source of paper records
5. **Backup**: Keep physical paper records as backup even after importing

## Troubleshooting

### Parse Errors
- **Issue**: Items not parsing correctly
- **Solution**: Ensure you're using the correct format with "x" for quantity and "@" for price

### Sync Failures
- **Issue**: Records fail to sync
- **Solution**: Check that item names, amounts, and formats are valid. View the error in the console logs.

### Missing Items
- **Issue**: Items don't appear in the order
- **Solution**: Ensure the items string is correctly formatted with proper spacing and punctuation

## Technical Details

### Service Layer
- `src/services/paperPosImportService.ts` - Handles all database operations
- `src/hooks/usePaperPosImport.ts` - React hook for state management

### Components
- `src/components/PaperPosImportModal.tsx` - Import form and CSV parser
- `src/components/PaperPosRecordsList.tsx` - Display and manage imported records

### Types
- `PaperPosRecord` - Individual import record
- `PaperPosImport` - Batch import metadata

## Future Enhancements

Potential improvements for future versions:
- Excel file import support
- Advanced item parsing (handle commas in names)
- Image attachment for paper receipts
- Automatic item matching with menu items
- Import from other POS systems
- Scheduled syncing
- Import templates
