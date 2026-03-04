-- ============================================================
-- Migration: slug immutability trigger for published articles
-- ============================================================

CREATE OR REPLACE FUNCTION handle_article_slug_lock()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' AND NEW.slug <> OLD.slug THEN
    RAISE EXCEPTION
      'Cannot change slug of a published article (id: %). Slug is immutable once published.',
      OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_slug_lock ON articles;

CREATE TRIGGER trg_article_slug_lock
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION handle_article_slug_lock();
