# Manual Database Management Guide

This guide explains how to manage your Supabase database schemas across Development, Staging, and Production environments manually.

## Prerequisites

1.  **2 Supabase Projects** (Free Tier Limit):
    - **Production**: Your existing project `Restaurant-Management-System`.
    - **Development**: Create ONE new project (e.g., `rms-dev`).
2.  **Supabase CLI** (Optional): Install via `npm install -g supabase`.

## Workflow

### 1. Make Changes in Development (Dev)

- Use the Supabase Dashboard for `nenita-pos-dev` to make table changes, adding columns, etc.
- OR use local SQL files and run them in the SQL Editor of the Dev project.

### 2. Capture Changes (Dump Schema)

Once you are happy with the changes in Dev:

**Option A: Using Supabase CLI (Best)**
Run this command in your terminal to dump the schema:

```bash
supabase gen types typescript --project-id <your-dev-project-id> > types.ts
```

To get the SQL diff is harder manually without linking, so we recommend:

**Option B: Manual Export from Dashboard**

1.  Go to `nenita-pos-dev` > Database > Schema Visualizer (or Table Editor).
2.  Note down the changes you made (e.g., "Added `phone_number` to `customers` table").
3.  Write the corresponding SQL:
    ```sql
    ALTER TABLE customers ADD COLUMN phone_number text;
    ```
4.  Save this SQL to a file in `supabase/migrations/YYYYMMDD_description.sql`.

### 3. Deploy to Production

1.  Once Development is verified.
2.  Open `Restaurant-Management-System` (Production) in Supabase Dashboard.
3.  Go to the **SQL Editor**.
4.  Paste the **same** SQL you tested in Dev.
5.  Run it.

_(Note: We skipped Staging because of the 2-project limit on the Free Tier)_

## Best Practices

- **Never edit Production directly.** Always test in Dev first.
- **Keep SQL files.** Even if you run them manually, save the `.sql` snippets in your repo (e.g. `supabase/migrations`) so you have a history of changes.
- **Data vs Schema.** These steps sync the _structure_ (tables, columns). Data (rows) usually doesn't need to be synced unless it's "reference data" (like a list of categories).
