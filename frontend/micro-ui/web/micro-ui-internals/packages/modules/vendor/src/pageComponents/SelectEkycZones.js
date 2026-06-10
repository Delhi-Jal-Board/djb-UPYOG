import React, { useState, useEffect } from "react";
import { CardLabel, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

const SelectEkycZones = ({ config, onSelect, t, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [zones, setZones] = useState([]);
  const [selectedZones, setSelectedZones] = useState(Array.isArray(formData?.zoneIds) ? formData.zoneIds : []);

  const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  useEffect(() => {
    const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];
    const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];
    if (Array.isArray(boundaries?.children) && boundaries?.children.length > 0) {
      const zonesList = boundaries?.children.map((b) => ({
        code: b.code,
        name: b.name,
      }));
      setZones(zonesList);
    } else if (!isLoading) {
      // Extended static fallback for testing
      setZones([
        { code: "ZONE-01", name: "ZONE-01" },
        { code: "ZONE-02", name: "ZONE-02" },
        { code: "ZONE-03", name: "ZONE-03" },
        { code: "ZONE-04", name: "ZONE-04" },
        { code: "ZONE-05", name: "ZONE-05" },
      ]);
    }
  }, [boundaryData, isLoading]);

  const handleSelect = (value) => {
    setSelectedZones(value);
    onSelect(config.key, value);
  };

  if (isLoading) return <Loader />;

  return (
    <LabelFieldPair>
      <CardLabel>{t(config.label) + (config.isMandatory ? " *" : "")}</CardLabel>
      <div className="field">
        <MultiSelectDropdown options={zones} selected={selectedZones} onSelect={handleSelect} optionsKey="name" t={t} />
      </div>
    </LabelFieldPair>
  );
};

export default SelectEkycZones;
