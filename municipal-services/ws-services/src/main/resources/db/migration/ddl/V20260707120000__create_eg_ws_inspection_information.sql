-- Table to store field inspection information for Water Connection applications.
-- Each application number can have only one inspection record.
CREATE TABLE IF NOT EXISTS eg_ws_inspection_information (
    applicationno VARCHAR(64) NOT NULL UNIQUE,
    inspection_type VARCHAR(128),
    inspection_date BIGINT,
    inspector_name VARCHAR(256),
    createdby VARCHAR(64),
    createdtime BIGINT,
    lastmodifiedby VARCHAR(64),
    lastmodifiedtime BIGINT
);

CREATE INDEX IF NOT EXISTS idx_ws_inspection_applicationno
ON eg_ws_inspection_information(applicationno);