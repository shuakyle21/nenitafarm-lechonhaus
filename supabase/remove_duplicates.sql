-- Remove duplicate menu items, keeping the most recently created one
DELETE FROM menu_items
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rnum
    FROM menu_items
  ) t
  WHERE t.rnum > 1
);
