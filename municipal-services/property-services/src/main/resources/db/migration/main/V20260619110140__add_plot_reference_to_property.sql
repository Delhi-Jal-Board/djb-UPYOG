ALTER TABLE eg_pt_property
ADD COLUMN plotid CHARACTER VARYING (128);

ALTER TABLE eg_pt_property
ADD CONSTRAINT fk_eg_pt_property_plot
FOREIGN KEY (plotid)
REFERENCES eg_pt_plot (id);

CREATE INDEX IF NOT EXISTS index_eg_pt_property_plotid
ON eg_pt_property (plotid);