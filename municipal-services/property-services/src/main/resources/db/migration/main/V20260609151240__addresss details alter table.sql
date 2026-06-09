ALTER TABLE eg_pt_address
ADD COLUMN IF NOT EXISTS actual_assembly VARCHAR(200);

ALTER TABLE eg_pt_address
ADD COLUMN IF NOT EXISTS actual_zone VARCHAR(500);

ALTER TABLE eg_pt_address
ADD COLUMN IF NOT EXISTS actual_ward VARCHAR(500);

ALTER TABLE eg_pt_address
DROP COLUMN IF EXISTS ward_remark;