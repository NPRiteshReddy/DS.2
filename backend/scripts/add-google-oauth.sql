-- Add Google OAuth support to users table
-- Run this in Supabase SQL Editor

-- Add google_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Make password nullable (for Google OAuth users who don't have a password)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Create index for faster google_id lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add comment
COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID for social login';
