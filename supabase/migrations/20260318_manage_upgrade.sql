-- ============================================================
-- CONTENT ASSIGNMENT & NEW TYPES MIGRATION
-- Date: 2026-03-18
-- ============================================================

-- 1. Add 'assigned_to' column to core content tables
ALTER TABLE articles ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE sequels ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE friday_messages ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Create Banner Videos Table
CREATE TABLE IF NOT EXISTS banner_videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  video_url     text NOT NULL,
  thumbnail_url text,
  is_active     boolean NOT NULL DEFAULT true,
  is_deleted    boolean NOT NULL DEFAULT false,
  author_id     uuid REFERENCES profiles(id),
  assigned_to   uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Create Podcasts Table
CREATE TABLE IF NOT EXISTS podcasts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  audio_url     text NOT NULL,
  cover_image   text,
  category_id   uuid REFERENCES categories(id),
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_deleted    boolean NOT NULL DEFAULT false,
  deleted_at    timestamptz,
  author_id     uuid REFERENCES profiles(id),
  assigned_to   uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 4. Indices for performance
CREATE INDEX IF NOT EXISTS idx_articles_assigned    ON articles (assigned_to);
CREATE INDEX IF NOT EXISTS idx_sequels_assigned     ON sequels (assigned_to);
CREATE INDEX IF NOT EXISTS idx_banner_videos_active ON banner_videos (is_active);
CREATE INDEX IF NOT EXISTS idx_podcasts_status      ON podcasts (status);

-- ============================================================
-- DONE
-- ============================================================
