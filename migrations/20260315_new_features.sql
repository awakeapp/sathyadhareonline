-- ============================================================
-- Migration: New Features for Sathyadhare (Idempotent)
-- Date: 2026-03-15
-- Safe to re-run: all CREATE POLICY calls are guarded
-- ============================================================

-- 1. Article Reactions (Likes)
CREATE TABLE IF NOT EXISTS article_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'like' CHECK (type IN ('like', 'love', 'wow')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_article_reactions_article_id ON article_reactions (article_id);
CREATE INDEX IF NOT EXISTS idx_article_reactions_user_id    ON article_reactions (user_id);

ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'article_reactions' AND policyname = 'Anyone can view reactions') THEN
    CREATE POLICY "Anyone can view reactions"
      ON article_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'article_reactions' AND policyname = 'Authenticated users can react') THEN
    CREATE POLICY "Authenticated users can react"
      ON article_reactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'article_reactions' AND policyname = 'Users can remove their own reactions') THEN
    CREATE POLICY "Users can remove their own reactions"
      ON article_reactions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Add AI Summary column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_summary text;

-- 3. Add reading streak and bio to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reading_streak int NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_read_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 4. Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth_key    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Users can manage their own push subscriptions') THEN
    CREATE POLICY "Users can manage their own push subscriptions"
      ON push_subscriptions FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Newsletter subscribers (skip if already exists)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  name         text,
  confirmed    boolean NOT NULL DEFAULT false,
  unsubscribed boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Add new columns if the old version of the table exists
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmed    boolean NOT NULL DEFAULT false;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers (email);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscribers' AND policyname = 'Admins can view all subscribers') THEN
    CREATE POLICY "Admins can view all subscribers"
      ON newsletter_subscribers FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscribers' AND policyname = 'Anyone can insert a subscription') THEN
    CREATE POLICY "Anyone can insert a subscription"
      ON newsletter_subscribers FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
