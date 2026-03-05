-- ============================================================
-- Supabase PostgreSQL Schema
-- Generated: 2026-03-03
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILITY: auto-update updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  role        text NOT NULL DEFAULT 'reader'
                CHECK (role IN ('super_admin', 'editor', 'admin', 'moderator', 'reader')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  icon_name   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: articles
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  slug                text NOT NULL UNIQUE,
  excerpt             text,
  content             text,
  cover_image         text,
  external_audio_url  text,
  category_id         uuid REFERENCES categories(id),
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  is_featured         boolean NOT NULL DEFAULT false,
  is_trending         boolean NOT NULL DEFAULT false,
  is_deleted          boolean NOT NULL DEFAULT false,
  author_id           uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  published_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_articles_slug        ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id   ON articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status      ON articles (status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_articles_is_deleted  ON articles (is_deleted);

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: sequels
-- ============================================================
CREATE TABLE IF NOT EXISTS sequels (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  banner_image  text,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published')),
  is_deleted    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sequels_slug       ON sequels (slug);
CREATE INDEX IF NOT EXISTS idx_sequels_is_deleted ON sequels (is_deleted);

CREATE TRIGGER trg_sequels_updated_at
  BEFORE UPDATE ON sequels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: sequel_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS sequel_articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequel_id    uuid NOT NULL REFERENCES sequels(id) ON DELETE CASCADE,
  article_id   uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  order_index  int,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequel_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_sequel_articles_sequel_id  ON sequel_articles (sequel_id);
CREATE INDEX IF NOT EXISTS idx_sequel_articles_article_id ON sequel_articles (article_id);

CREATE TRIGGER trg_sequel_articles_updated_at
  BEFORE UPDATE ON sequel_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: friday_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS friday_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text,
  image_url     text,
  message_text  text,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_friday_messages_updated_at
  BEFORE UPDATE ON friday_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: guest_submissions
-- ============================================================
CREATE TABLE IF NOT EXISTS guest_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
  email       text,
  title       text,
  content     text,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'converted', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_submissions_status ON guest_submissions (status);

-- ============================================================
-- TABLE: comments
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id),
  guest_name  text,
  content     text,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments (article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id    ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status     ON comments (status);

-- ============================================================
-- TABLE: bookmarks
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id    ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON bookmarks (article_id);

-- ============================================================
-- TABLE: article_views
-- ============================================================
CREATE TABLE IF NOT EXISTS article_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES profiles(id),
  session_id  text,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views (article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id    ON article_views (user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_session_id ON article_views (session_id);
