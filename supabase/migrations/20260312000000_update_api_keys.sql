-- Update API Keys table to match latest requested schema
ALTER TABLE api_keys 
  ADD COLUMN IF NOT EXISTS prefix text,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;
