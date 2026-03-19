-- Create sequel_pieces table for planning the contents of a Sequel issue
CREATE TABLE IF NOT EXISTS public.sequel_pieces (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequel_id    UUID NOT NULL REFERENCES public.sequels(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'essay'
                 CHECK (type IN ('editorial', 'poem', 'fiction', 'essay', 'other')),
  author_name  TEXT NOT NULL,
  assigned_to  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started', 'in_progress', 'submitted', 'approved')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequel_pieces_sequel_id ON public.sequel_pieces(sequel_id);
CREATE INDEX IF NOT EXISTS idx_sequel_pieces_assigned_to ON public.sequel_pieces(assigned_to);

-- Auto-update updated_at on change
CREATE TRIGGER trg_sequel_pieces_updated_at
  BEFORE UPDATE ON public.sequel_pieces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.sequel_pieces ENABLE ROW LEVEL SECURITY;
-- Service role has full access (bypasses RLS automatically)
-- No public read needed on this table
