-- Create table to store due verification records linked to water connection applications.
-- kno (K-Number) is the unique consumer identifier and serves as the primary key.
-- applicationno is stored as a plain column (no FK) since eg_ws_connection has no
-- unique constraint on applicationno — relationship is maintained logically.
CREATE TABLE IF NOT EXISTS eg_ws_due_verification
(
    kno                character varying(64)   NOT NULL,
    applicationno      character varying(64)   NOT NULL,
    tenantid           character varying(64),
    fullname           character varying(256),
    fulladdress        character varying(512),
    dueamount          character varying(64),
    totalamount        character varying(64),
    createdby          character varying(64),
    lastmodifiedby     character varying(64),
    createdtime        bigint,
    lastmodifiedtime   bigint,
    CONSTRAINT pk_eg_ws_due_verification PRIMARY KEY (kno)
);

CREATE INDEX IF NOT EXISTS idx_ws_due_verification_appno
    ON eg_ws_due_verification (applicationno);

