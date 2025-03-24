
-- Add view_preferences column to compass_user_profiles table
ALTER TABLE compass_user_profiles ADD COLUMN IF NOT EXISTS view_preferences JSONB;
