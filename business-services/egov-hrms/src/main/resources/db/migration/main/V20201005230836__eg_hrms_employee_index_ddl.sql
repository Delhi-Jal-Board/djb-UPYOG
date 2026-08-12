DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'eg_hrms_employee'
          AND column_name = 'reactivateemployee'
    ) THEN
        ALTER TABLE eg_hrms_employee
        ADD COLUMN reactivateemployee BOOLEAN;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_eg_hrms_employee_tenantid
ON eg_hrms_employee USING btree (tenantid);