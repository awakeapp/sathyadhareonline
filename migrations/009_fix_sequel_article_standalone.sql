-- ============================================================
-- Migration 009: Fix is_standalone for articles in sequels
-- Created: 2026-03-17
-- 
-- Problem: Articles added to sequels via the admin panel were
-- not having is_standalone set to false, causing them to appear
-- on the home/articles pages erroneously.
--
-- This migration retroactively fixes all existing articles
-- that belong to a sequel by setting is_standalone = false.
-- ============================================================

-- Set is_standalone = false for any article that is currently 
-- linked to at least one sequel (via sequel_articles table)
UPDATE articles
SET is_standalone = false
WHERE id IN (
  SELECT DISTINCT article_id
  FROM sequel_articles
);

-- Verify the fix (optional: run this as a SELECT to check before applying)
-- SELECT a.id, a.title, a.is_standalone, COUNT(sa.sequel_id) as sequel_count
-- FROM articles a
-- LEFT JOIN sequel_articles sa ON sa.article_id = a.id
-- GROUP BY a.id, a.title, a.is_standalone
-- HAVING COUNT(sa.sequel_id) > 0
-- ORDER BY a.title;
