-- Add theme column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS theme TEXT CHECK (theme IN ('light', 'dark')) DEFAULT 'light';

-- Add comment to explain the column
COMMENT ON COLUMN user_preferences.theme IS 'User''s preferred theme (light or dark)'; 