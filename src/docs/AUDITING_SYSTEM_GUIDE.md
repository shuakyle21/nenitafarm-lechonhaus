# Database Audit Trail

The Nenita Farm Lechon POS keeps an append-only audit trail at the **database layer**. Every change to a sensitive table is recorded automatically by PostgreSQL triggers, independent of the application — so a record is written even if the data is modified directly in the database.

> [!NOTE]
> The former in-app **Audit module** (Activity Logs UI, daily cash reconciliation, "Verify & Lock" report) has been removed. This guide now covers only the database-level audit infrastructure that remains in place. The `audit_logs` table and triggers are still active and can be queried directly.

---

## How it works

All auditing is powered by SQL in [`supabase/migrations/20260108_auditing_system.sql`](../../supabase/migrations/20260108_auditing_system.sql). The application does not generate audit records.

### `audit_logs` table

| Column        | Type          | Notes                                   |
| ------------- | ------------- | --------------------------------------- |
| `table_name`  | `TEXT`        | Source table that changed               |
| `record_id`   | —             | Primary key of the affected row         |
| `action`      | `TEXT`        | `INSERT`, `UPDATE`, or `DELETE`         |
| `old_data`    | `JSONB`       | Row snapshot before the change          |
| `new_data`    | `JSONB`       | Row snapshot after the change           |
| `changed_by`  | `UUID`        | References `users(id)`                  |
| `changed_at`  | `TIMESTAMPTZ` | Defaults to `now()`                     |

The log is **append-only** — the application contains no logic to update or delete `audit_logs` rows.

### Trigger function

`audit_trigger_func` captures the `OLD` and `NEW` states of each row as JSONB and inserts a corresponding `audit_logs` record:

- `INSERT` → stores `new_data`
- `UPDATE` → stores both `old_data` and `new_data`
- `DELETE` → stores `old_data`

`changed_by` is derived from the row's `created_by` / `updated_by` columns (added by the same migration).

### Audited tables

An `AFTER INSERT OR UPDATE OR DELETE` trigger is attached to each of:

- `orders`
- `order_items`
- `menu_items`
- `inventory_items` *(if present)*
- `inventory_transactions` *(if present)*
- `expenses` *(if present)*
- `sales_adjustments` *(if present)*
- `cash_transactions` *(if present)*

### Soft deletes for orders

The migration adds a `deleted_at` timestamp to `orders` so deletions are recoverable and the `DELETE` action is still captured in the audit trail.

---

## Querying the trail

There is no UI; query Supabase directly. For example, the most recent changes:

```sql
select changed_at, table_name, action, record_id, changed_by
from audit_logs
order by changed_at desc
limit 50;
```

To inspect what changed on a specific row, compare `old_data` and `new_data` for its `record_id`.
