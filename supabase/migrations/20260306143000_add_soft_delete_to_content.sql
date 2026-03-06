-- Migration: Add soft delete columns to various tables
-- Columns: is_deleted (boolean), deleted_at (timestamptz)

-- Categories
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_deleted') THEN
        ALTER TABLE categories ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
        ALTER TABLE categories ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- Comments
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'is_deleted') THEN
        ALTER TABLE comments ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
        ALTER TABLE comments ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- Articles (ensure deleted_at exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'deleted_at') THEN
        ALTER TABLE articles ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- Sequels (ensure deleted_at exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sequels' AND column_name = 'deleted_at') THEN
        ALTER TABLE sequels ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- Friday Messages (optional, but good for consistency)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'friday_messages' AND column_name = 'is_deleted') THEN
        ALTER TABLE friday_messages ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
        ALTER TABLE friday_messages ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- Media
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media' AND column_name = 'is_deleted') THEN
        ALTER TABLE media ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
        ALTER TABLE media ADD COLUMN deleted_at timestamptz;
END IF;
END $$;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_categories_is_deleted ON categories (is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments (is_deleted);
CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles (deleted_at);
CREATE INDEX IF NOT EXISTS idx_sequels_deleted_at ON sequels (deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_is_deleted ON media (is_deleted);
