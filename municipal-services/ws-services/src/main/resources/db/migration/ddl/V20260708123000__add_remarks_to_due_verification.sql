-- Alter table eg_ws_due_verification to add remarks column
ALTER TABLE eg_ws_due_verification ADD COLUMN IF NOT EXISTS remarks character varying(1024);
