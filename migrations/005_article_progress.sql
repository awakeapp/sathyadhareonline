-- Migration: Article Reading Progress
-- Create table to track how far a user has read each article

CREATE TABLE IF NOT EXISTS article_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  percentage  int NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_article_progress_user_id ON article_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_article_progress_article_id ON article_progress (article_id);

-- Enable RLS
ALTER TABLE article_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON article_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON article_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own progress"
  ON article_progress FOR UPDATE
  USING (auth.uid() = user_id);
