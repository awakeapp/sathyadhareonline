-- ============================================================
-- Phase 1: Editorial Workflow & Permission System
-- Date: 2026-03-17
-- ============================================================

-- 1. Update Articles Status Constraint
-- We need to drop the old constraint and add a new one that includes 'in_review'
-- Statuses: 'draft', 'in_review', 'published', 'archived'
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;
ALTER TABLE articles ADD CONSTRAINT articles_status_check 
  CHECK (status IN ('draft', 'in_review', 'published', 'archived'));

-- 2. Add 'is_standalone' to Articles
-- Articles inside a Sequel should have is_standalone = false
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_standalone boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_articles_is_standalone ON articles (is_standalone);

-- 3. Update Sequels Status Constraint
-- Statuses: 'draft', 'in_review', 'published', 'archived'
ALTER TABLE sequels DROP CONSTRAINT IF EXISTS sequels_status_check;
ALTER TABLE sequels ADD CONSTRAINT sequels_status_check 
  CHECK (status IN ('draft', 'in_review', 'published', 'archived'));

-- 4. Create Books Table (if missing) and Update Status
-- Restructure: Cover -> Chapters (each chapter rendered like an article)
CREATE TABLE IF NOT EXISTS books (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  cover_image   text,
  author_name   text, -- Single author as per requirements
  author_id     uuid REFERENCES profiles(id),
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
  is_active     boolean NOT NULL DEFAULT true,
  is_deleted    boolean NOT NULL DEFAULT false,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Ensure all required columns exist if table was partially created
ALTER TABLE books ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES profiles(id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_books_slug ON books (slug);
CREATE INDEX IF NOT EXISTS idx_books_status ON books (status);

-- 5. Create Chapters Table for Books
CREATE TABLE IF NOT EXISTS chapters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title         text NOT NULL,
  slug          text NOT NULL,
  content       text,
  order_index   int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, slug),
  UNIQUE (book_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters (book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters (book_id, order_index);

-- 6. User Content Permissions Table
-- For per-admin content-type access toggles
CREATE TABLE IF NOT EXISTS user_content_permissions (
  user_id       uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_articles  boolean NOT NULL DEFAULT true,
  can_sequels   boolean NOT NULL DEFAULT false,
  can_library   boolean NOT NULL DEFAULT false,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Trigger to auto-create permissions for new profiles
CREATE OR REPLACE FUNCTION init_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_content_permissions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_init_user_permissions ON profiles;
CREATE TRIGGER trg_init_user_permissions
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION init_user_permissions();

-- Back-fill existing profiles
INSERT INTO user_content_permissions (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- 7. Audit Log for Permissions
-- (Already handled by application level logAuditEvent)

-- ============================================================
-- DONE
-- ============================================================
