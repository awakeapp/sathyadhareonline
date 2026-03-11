-- Adding statuses if it doesn't already exist from a previous schema commit
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'status'
    ) THEN
        ALTER TABLE comments ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Essential indexes for moderation dashboard optimizations 
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_is_spam ON comments(is_spam);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
