ALTER TABLE eg_hrms_departmentaltests ADD COLUMN IF NOT EXISTS  isActive BOOLEAN;
ALTER TABLE eg_hrms_educationaldetails ADD COLUMN IF NOT EXISTS  isActive BOOLEAN;
ALTER TABLE eg_hrms_jurisdiction ADD COLUMN IF NOT EXISTS  isActive BOOLEAN;
ALTER TABLE eg_hrms_assignment ADD COLUMN IF NOT EXISTS  isActive BOOLEAN;
ALTER TABLE eg_hrms_deactivationdetails ADD COLUMN IF NOT EXISTS  isActive BOOLEAN;
ALTER TABLE eg_hrms_servicehistory ADD COLUMN IF NOT EXISTS  isActive BOOLEAN;