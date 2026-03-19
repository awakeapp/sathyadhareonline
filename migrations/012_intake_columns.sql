-- Add assigned_to logic to articles table
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignment_notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: Create an index for quicker lookup for assigned articles
CREATE INDEX IF NOT EXISTS idx_articles_assigned_to ON public.articles (assigned_to);
