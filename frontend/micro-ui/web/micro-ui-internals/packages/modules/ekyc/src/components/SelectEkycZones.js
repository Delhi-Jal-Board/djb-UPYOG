import React, { useState, useEffect, useRef } from "react";
import { CardLabel, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

const SelectEkycZones = ({ config, onSelect, t, formData, isMultiSelect = true, placeHolder }) => {
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [zones, setZones] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);

  // Prevent converting initial values multiple times
  const initialized = useRef(false);

  const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  useEffect(() => {
    const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];

    const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];

    if (Array.isArray(boundaries?.children)) {
      const allZones = boundaries.children.flatMap((assembly) =>
        (assembly.children || []).map((zone) => ({
          code: zone.code,
          name: zone.name,
        }))
      );

      const zonesList = [...new Map(allZones.map((z) => [z.code, z])).values()];

      setZones(zonesList);
    }
  }, [boundaryData]);

  /**
   * Sync selected values
   */
  useEffect(() => {
    if (!zones.length || !formData?.zoneIds) return;

    if (isMultiSelect) {
      if (!Array.isArray(formData.zoneIds)) return;
      // Already objects
      if (formData.zoneIds.length && typeof formData.zoneIds[0] === "object" && formData.zoneIds[0] !== null) {
        setSelectedZones(formData.zoneIds.filter(Boolean));
        return;
      }

      // Initial API values (array of names/codes)
      const selected = zones.filter((zone) => zone && (formData.zoneIds.includes(zone.name) || formData.zoneIds.includes(zone.code)));

      setSelectedZones(selected);

      // Convert only once
      if (!initialized.current) {
        initialized.current = true;
        onSelect(config.key, selected);
      }
    } else {
      // Single select
      let selectedVal = formData.zoneIds;
      if (Array.isArray(selectedVal)) {
        selectedVal = selectedVal[0]?.name || selectedVal[0]?.code || selectedVal[0] || "";
      }
      if (selectedVal && typeof selectedVal === "object") {
        selectedVal = selectedVal.name || selectedVal.code || "";
      }

      const selected = zones.find((zone) => zone && (zone.name === selectedVal || zone.code === selectedVal));
      setSelectedZones(selected ? [selected] : []);

      if (!initialized.current && selected) {
        initialized.current = true;
        onSelect(config.key, selected.name || "");
      }
    }
  }, [zones, formData?.zoneIds, config.key, onSelect, isMultiSelect]);

  const handleSelect = (value) => {
    if (isMultiSelect) {
      const selected = Array.isArray(value) ? value.map((v) => (Array.isArray(v) ? v[1] : v)).filter(Boolean) : [];

      setSelectedZones(selected);
      onSelect(config.key, selected);
    } else {
      const selectedZone = Array.isArray(value) ? (Array.isArray(value[0]) ? value[0][1] : value[0]) : value;

      setSelectedZones(selectedZone ? [selectedZone] : []);
      onSelect(config.key, selectedZone?.name || "");
    }
  };

  if (isLoading) return <Loader />;

  return (
    <LabelFieldPair>
      <CardLabel>
        {t(config.label)}
        {config.isMandatory ? <span className="check-page-link-button"> * </span> : ""}
      </CardLabel>

      <div className="field" style={{ position: "relative", zIndex: 10 }}>
        <MultiSelectDropdown
          options={zones}
          selected={selectedZones}
          onSelect={handleSelect}
          optionsKey="name"
          t={t}
          multiple={isMultiSelect}
          isMultiSelect={isMultiSelect}
          showSelectedLabels={!isMultiSelect}
          ServerStyle={{ backgroundColor: "#fff" }}
          defaultLabel={isMultiSelect ? `${selectedZones.length} Selected` : ""}
          placeHolder={placeHolder}
        />
      </div>

      {isMultiSelect && selectedZones.length > 0 && (
        <div className="selected-zones">
          {selectedZones.filter(zone => zone && zone.code).map((zone) => (
            <span key={zone.code} className="selected-zone-chip">
              {zone.name}
            </span>
          ))}
        </div>
      )}
    </LabelFieldPair>
  );
};

export default SelectEkycZones;
