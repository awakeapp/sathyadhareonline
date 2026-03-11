-- ──────────────────────────────────────────────────────────────────────────
-- Migration: Add sort_order and description to categories
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order  INTEGER NOT NULL DEFAULT 0;

-- Back-fill: assign initial sort_order based on creation order so the list
-- is deterministic from day 1.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST) AS rn
  FROM   categories
)
UPDATE categories
SET    sort_order = ranked.rn
FROM   ranked
WHERE  categories.id = ranked.id
  AND  categories.sort_order = 0;

-- Index for fast ordered fetches
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories (sort_order ASC);
