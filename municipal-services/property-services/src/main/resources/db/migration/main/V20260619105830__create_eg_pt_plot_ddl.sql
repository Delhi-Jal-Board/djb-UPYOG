
CREATE TABLE eg_pt_plot (

  id                CHARACTER VARYING (128) NOT NULL,
  plotid            CHARACTER VARYING (64) NOT NULL,
  tenantid          CHARACTER VARYING (256) NOT NULL,

  plotno            CHARACTER VARYING (256),
  doorno            CHARACTER VARYING (128),
  buildingname      CHARACTER VARYING (1024),
  street            CHARACTER VARYING (1024),
  locality          CHARACTER VARYING (128),
  sub_locality      CHARACTER VARYING (200),

  addresshash       CHARACTER VARYING (256) NOT NULL,

  additionaldetails JSONB,

  createdby         CHARACTER VARYING (128) NOT NULL,
  createdtime       BIGINT NOT NULL,
  lastmodifiedby    CHARACTER VARYING (128),
  lastmodifiedtime  BIGINT,

  CONSTRAINT pk_eg_pt_plot PRIMARY KEY (id),

  CONSTRAINT uk_eg_pt_plot_plotid
      UNIQUE (tenantid, plotid),

  CONSTRAINT uk_eg_pt_plot_hash
      UNIQUE (tenantid, addresshash)

);

CREATE INDEX IF NOT EXISTS index_eg_pt_plot_tenantid
ON eg_pt_plot (tenantid);

CREATE INDEX IF NOT EXISTS index_eg_pt_plot_locality
ON eg_pt_plot (locality);

CREATE INDEX IF NOT EXISTS index_eg_pt_plot_plotno
ON eg_pt_plot (plotno);

CREATE INDEX IF NOT EXISTS index_eg_pt_plot_buildingname
ON eg_pt_plot (buildingname);

CREATE INDEX IF NOT EXISTS index_eg_pt_plot_hash
ON eg_pt_plot (addresshash);

