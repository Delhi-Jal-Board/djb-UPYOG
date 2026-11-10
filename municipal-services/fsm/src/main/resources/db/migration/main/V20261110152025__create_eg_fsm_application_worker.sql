CREATE TABLE IF NOT EXISTS eg_fsm_application_worker (
    id                varchar(256) PRIMARY KEY,
    tenantid          varchar(64),
    application_id    varchar(256),
    individual_id     varchar(64),
    workertype        varchar(64),
    status            varchar(64),
    additionaldetails jsonb,
    createdby         varchar(100),
    lastmodifiedby    varchar(100),
    createdtime       bigint,
    lastmodifiedtime  bigint
    );