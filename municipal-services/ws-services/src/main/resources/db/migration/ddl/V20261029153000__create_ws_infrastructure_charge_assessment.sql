-- Stores a trusted, server-side snapshot of the inputs and amount used for the
-- last water-connection infrastructure-charge assessment.
CREATE TABLE IF NOT EXISTS eg_ws_infrastructure_charge_assessment (
    tenantid VARCHAR(250) NOT NULL,
    applicationno VARCHAR(64) NOT NULL,
    propertyid VARCHAR(64),
    input_fingerprint VARCHAR(64) NOT NULL,
    input_snapshot TEXT NOT NULL,
    assessed_ifc_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
    last_estimated_ifc_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
    pending_additional_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
    status VARCHAR(64) NOT NULL DEFAULT 'ASSESSED',
    assessment_version INTEGER NOT NULL DEFAULT 1,
    createdby VARCHAR(64),
    createdtime BIGINT NOT NULL,
    lastmodifiedby VARCHAR(64),
    lastmodifiedtime BIGINT NOT NULL,
    CONSTRAINT pk_eg_ws_infrastructure_charge_assessment PRIMARY KEY (tenantid, applicationno)
);

CREATE INDEX IF NOT EXISTS idx_ws_infra_assessment_property
    ON eg_ws_infrastructure_charge_assessment(propertyid);
