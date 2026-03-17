-- Migration: Add category types and link sequels to categories
-- Description: Supports distinguishing between article categories and sequel categories.

-- 1. Add type to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'article'
CHECK (type IN ('article', 'sequel'));

-- 2. Add category_id to sequels
ALTER TABLE sequels
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- 3. Update indexes
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_sequels_category_id ON sequels(category_id);
