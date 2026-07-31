import React, { useState, useEffect, useRef } from "react";
import { CardLabel, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

const SelectEkycZones = ({ config, onSelect, t, formData, isMultiSelect = true, placeHolder }) => {
  const [zones, setZones] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);

  // Prevent converting initial values multiple times
  const initialized = useRef(false);

  // OLD: ZroOfficeList approach (commented out)
  // const rawTenantId = Digit.ULBService.getCurrentTenantId();
  // const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;
  // const { data: zroData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "common-masters", ["ZroOfficeList"]);

  // NEW: Fetch TenantBoundary from egov-location at state-level tenant "dl"
  const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS("dl", "egov-location", ["TenantBoundary"]);

  // OLD: ZroOfficeList useEffect (commented out)
  // useEffect(() => {
  //   const zroOfficeList = zroData?.["common-masters"]?.ZroOfficeList || zroData?.MdmsRes?.["common-masters"]?.ZroOfficeList || [];
  //   if (Array.isArray(zroOfficeList)) {
  //     const activeZros = zroOfficeList
  //       .filter((zro) => zro && zro.active)
  //       .map((zro) => ({
  //         code: zro.code,
  //         name: zro.code,
  //       }));
  //     setZones(activeZros);
  //   }
  // }, [zroData]);

  // NEW: TenantBoundary useEffect — walks tree and collects unique Zone-label nodes
  useEffect(() => {
    const tenantBoundaryList =
      boundaryData?.["egov-location"]?.TenantBoundary ||
      boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary ||
      [];

    // Walk the tree: City → Assembly Constituency → Zone → ...
    // Collect all nodes whose label === "Zone", deduplicated by code
    const zoneMap = {};
    tenantBoundaryList.forEach((tb) => {
      const walkBoundary = (node) => {
        if (!node) return;
        if (node.label === "Zone" && node.code && node.code !== "UNKNOWN") {
          if (!zoneMap[node.code]) {
            // Use the first encountered name for each code
            zoneMap[node.code] = { code: node.code, name: node.name || node.code };
          }
        }
        (node.children || []).forEach(walkBoundary);
      };
      walkBoundary(tb.boundary);
    });

    const uniqueZones = Object.values(zoneMap).sort((a, b) => a.name.localeCompare(b.name));
    setZones(uniqueZones);
  }, [boundaryData]);

  /**
   * Sync selected values from formData
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

      // Initial API values (array of names/codes) — case-insensitive match
      const selected = zones.filter(
        (zone) =>
          zone &&
          formData.zoneIds.some(
            (id) =>
              id &&
              (id.toString().toUpperCase() === zone.code?.toUpperCase() ||
                id.toString().toUpperCase() === zone.name?.toUpperCase())
          )
      );

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

      // Case-insensitive match
      const selected = zones.find(
        (zone) =>
          zone &&
          (zone.name?.toUpperCase() === selectedVal?.toString().toUpperCase() ||
            zone.code?.toUpperCase() === selectedVal?.toString().toUpperCase())
      );
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
      // Send array of names in payload
      onSelect(config.key, selected.map((z) => z.name));
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
          {selectedZones.filter((zone) => zone && zone.name).map((zone) => (
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
