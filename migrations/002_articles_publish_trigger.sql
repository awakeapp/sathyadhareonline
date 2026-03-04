-- ============================================================
-- Migration: publish integrity trigger for articles
-- ============================================================

CREATE OR REPLACE FUNCTION handle_article_publish()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  -- Rule 1: draft → published with no published_at → auto-set it
  IF NEW.status = 'published'
     AND OLD.status = 'draft'
     AND NEW.published_at IS NULL
  THEN
    NEW.published_at = now();
    RETURN NEW;
  END IF;

  -- Rule 2: already published with no published_at → hard block
  IF NEW.status = 'published'
     AND NEW.published_at IS NULL
  THEN
    RAISE EXCEPTION
      'Cannot publish article (id: %): published_at must not be NULL.',
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger (BEFORE UPDATE so we can mutate NEW before the row is written)
DROP TRIGGER IF EXISTS trg_article_publish_integrity ON articles;

CREATE TRIGGER trg_article_publish_integrity
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION handle_article_publish();
