
-- Index foreign-key and frequently-filtered columns.
--
-- Postgres does NOT automatically index foreign-key columns, so JOINs and
-- ON DELETE CASCADE operations against these tables currently fall back to
-- sequential scans. All statements are additive and idempotent.

-- order_items: joined per-order in orderService.getOrders() and cascaded on
-- order deletion. Both paths need order_id indexed; menu_items join needs
-- menu_item_id indexed.
CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_menu_item_id_idx
  ON order_items (menu_item_id);

-- audit_logs: append-only and unbounded. It is queried ordered by changed_at
-- (newest first) and filtered by table_name; changed_by is an unindexed FK.
CREATE INDEX IF NOT EXISTS audit_logs_changed_at_idx
  ON audit_logs (changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx
  ON audit_logs (table_name);
CREATE INDEX IF NOT EXISTS audit_logs_changed_by_idx
  ON audit_logs (changed_by);

-- paper_pos_imports: synced_order_id is an unindexed FK to orders.
CREATE INDEX IF NOT EXISTS paper_pos_imports_synced_order_id_idx
  ON paper_pos_imports (synced_order_id);
