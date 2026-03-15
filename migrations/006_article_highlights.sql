-- Migration: Article Highlights
-- Save user-selected text highlights for persistence

CREATE TABLE IF NOT EXISTS article_highlights (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id  uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  content     text NOT NULL, -- The highlighted text
  color       text NOT NULL DEFAULT 'yellow', -- Optional color coding
  range_start int, -- Optional offset (less reliable with dynamic HTML but good for basic sync)
  range_end   int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_highlights_user_article ON article_highlights (user_id, article_id);

-- Enable RLS
ALTER TABLE article_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own highlights"
  ON article_highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own highlights"
  ON article_highlights FOR ALL
  USING (auth.uid() = user_id);
