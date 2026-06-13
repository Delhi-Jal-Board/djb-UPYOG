import React, { useState, useEffect } from "react";
import { CardLabel, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

const SelectEkycZones = ({ config, onSelect, t, formData, isMultiSelect = true, placeHolder }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [zones, setZones] = useState([]);

  const [selectedZones, setSelectedZones] = useState(Array.isArray(formData?.zoneIds) ? formData.zoneIds : []);

  const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  useEffect(() => {
    const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];

    const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];

    if (Array.isArray(boundaries?.children) && boundaries?.children.length > 0) {
      const allZones = boundaries.children.flatMap((assembly) =>
        (assembly?.children || []).map((zone) => ({
          code: zone.code,
          name: zone.name,
        }))
      );

      const zonesList = [...new Map(allZones.map((zone) => [zone.code, zone])).values()];

      setZones(zonesList);
    }
  }, [boundaryData]);

  const handleSelect = (value) => {
    if (isMultiSelect) {
      const extractedValue = Array.isArray(value) ? value.map((v) => (Array.isArray(v) ? v[1] : v)).filter(Boolean) : [];

      setSelectedZones(extractedValue);
      onSelect(config.key, extractedValue);
    } else {
      const selectedZone = Array.isArray(value) ? (Array.isArray(value[0]) ? value[0][1] : value[0]) : value;

      setSelectedZones(selectedZone ? [selectedZone] : []);

      onSelect(config.key, selectedZone?.code || "");
    }
  };

  if (isLoading) return <Loader />;

  return (
    <LabelFieldPair>
      <CardLabel>{t(config.label) + (config.isMandatory ? " *" : "")}</CardLabel>

      <div className="field" style={{ position: "relative", zIndex: 10 }}>
        <MultiSelectDropdown
          options={zones}
          selected={selectedZones}
          onSelect={handleSelect}
          optionsKey="name"
          t={t}
          multiple={isMultiSelect}
          ServerStyle={{ backgroundColor: "#fff" }}
          isMultiSelect={isMultiSelect}
          placeHolder={placeHolder}
          showSelectedLabels={true}
        />
      </div>
    </LabelFieldPair>
  );
};

export default SelectEkycZones;
