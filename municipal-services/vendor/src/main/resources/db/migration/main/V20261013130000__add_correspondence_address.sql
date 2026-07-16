-- Local correspondence_address on eg_supervisor / eg_surveyor.


ALTER TABLE eg_supervisor
    ADD COLUMN IF NOT EXISTS correspondence_address CHARACTER VARYING(500);

ALTER TABLE eg_surveyor
    ADD COLUMN IF NOT EXISTS correspondence_address CHARACTER VARYING(500);