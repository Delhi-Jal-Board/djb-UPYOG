-- Alter table eg_ws_due_verification to add isactive column
ALTER TABLE eg_ws_due_verification ADD COLUMN IF NOT EXISTS isactive boolean DEFAULT true;

