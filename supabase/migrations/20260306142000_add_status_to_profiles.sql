-- Migration: Add status column to profiles table and indices
-- Status options: active, suspended, banned

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
