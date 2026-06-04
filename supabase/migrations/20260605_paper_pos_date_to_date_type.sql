-- Convert paper_pos_imports.date from TEXT to a real DATE column.
--
-- The column is only ever written from an HTML <input type="date"> and from
-- `new Date().toISOString().split('T')[0]`, so every value is a "YYYY-MM-DD"
-- string and casts to DATE cleanly. Storing it as DATE enables real range
-- queries / sorting and removes the text-vs-date timezone ambiguity.
--
-- SAFETY: if any legacy row is NOT a valid date, the guard below aborts the
-- migration with a clear message BEFORE altering anything, so nothing is lost.
-- Run this first to inspect offenders, if any:
--   select id, date from paper_pos_imports
--   where date !~ '^\d{4}-\d{2}-\d{2}$' or date::date is null;

DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT count(*) INTO bad_count
  FROM paper_pos_imports
  WHERE date !~ '^\d{4}-\d{2}-\d{2}$';

  IF bad_count > 0 THEN
    RAISE EXCEPTION
      'Aborting: % paper_pos_imports row(s) have a non-YYYY-MM-DD date. Clean them up first.',
      bad_count;
  END IF;
END $$;

-- The existing idx_paper_pos_imports_date index on this column is rebuilt
-- automatically as part of the type change.
ALTER TABLE paper_pos_imports
  ALTER COLUMN date TYPE date USING date::date;
