-- Migration: Add maintenance_mode columns to site_settings
-- Run in Supabase SQL Editor

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS maintenance_whitelist TEXT NOT NULL DEFAULT '';

-- Ensure the singleton row has these columns populated
UPDATE site_settings
SET
  maintenance_mode = FALSE,
  maintenance_whitelist = ''
WHERE id = 1;
