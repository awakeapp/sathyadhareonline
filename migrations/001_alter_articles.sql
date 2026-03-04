-- ============================================================
-- Migration: articles table updates
-- ============================================================

-- 1) Add author_name column
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS author_name text;

-- 2) Make content NOT NULL
--    (backfill nulls first to avoid constraint violation)
UPDATE articles SET content = '' WHERE content IS NULL;
ALTER TABLE articles
  ALTER COLUMN content SET NOT NULL;

-- 3) CHECK constraint: published articles must have published_at set
ALTER TABLE articles
  ADD CONSTRAINT chk_articles_published_at
  CHECK (
    status <> 'published' OR published_at IS NOT NULL
  );

-- 4) Index on published_at DESC for sorted queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc
  ON articles (published_at DESC);
