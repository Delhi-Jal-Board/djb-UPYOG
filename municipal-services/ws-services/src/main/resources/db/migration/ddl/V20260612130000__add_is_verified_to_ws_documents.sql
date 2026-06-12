-- Add a boolean column to track document verification
ALTER TABLE eg_ws_applicationDocument
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;