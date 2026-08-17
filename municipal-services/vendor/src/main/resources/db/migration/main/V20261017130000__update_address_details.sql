ALTER TABLE public.eg_vendor_address
    ADD COLUMN IF NOT EXISTS latitude numeric(9, 6) NULL,
    ADD COLUMN IF NOT EXISTS longitude numeric(10, 7) NULL,
    ADD COLUMN IF NOT EXISTS sub_locality varchar(200) NULL,
    ADD COLUMN IF NOT EXISTS actual_assembly varchar(200) NULL,
    ADD COLUMN IF NOT EXISTS actual_zone varchar(500) NULL,
    ADD COLUMN IF NOT EXISTS actual_ward varchar(500) NULL,
    ADD COLUMN IF NOT EXISTS address_line_1 varchar(200) NULL,
    ADD COLUMN IF NOT EXISTS address_line_2 varchar(500) NULL,
    ADD COLUMN IF NOT EXISTS assembly varchar(200) NULL,
    ADD COLUMN IF NOT EXISTS block varchar(500) NULL,
    ADD COLUMN IF NOT EXISTS "zone" varchar(500) NULL;