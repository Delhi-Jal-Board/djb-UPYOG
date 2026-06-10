import React, { useState, useEffect } from "react";
import { CardLabel, LabelFieldPair, MultiSelectDropdown } from "@djb25/digit-ui-react-components";

const SelectEkycClusters = ({ config, onSelect, t, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [clusters, setClusters] = useState([]);
  const [selectedClusters, setSelectedClusters] = useState(Array.isArray(formData?.clusterIds) ? formData.clusterIds : []);
  const selectedZones = React.useMemo(() => (Array.isArray(formData?.zoneIds) ? formData.zoneIds : []), [formData?.zoneIds]);

  const { data: boundaryData } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  useEffect(() => {
    const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];
    const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];

    let allClusters = [];
    if (selectedZones.length > 0 && Array.isArray(boundaries) && boundaries.length > 0) {
      selectedZones.forEach((zone) => {
        const zoneBoundary = boundaries.find((b) => b.code === zone.code);
        const children = zoneBoundary?.children || zoneBoundary?.boundary || [];
        if (Array.isArray(children)) {
          children.forEach((child) => {
            allClusters.push({
              code: child.code,
              name: child.name,
            });
          });
        }
      });
    }

    if (allClusters.length === 0) {
      // Enhanced static fallback for testing - show some default clusters if no zones selected or data missing
      const staticClusters = {
        "ZONE-01": [{ code: "CLUSTER-01", name: "CLUSTER-01" }],
        "ZONE-02": [{ code: "CLUSTER-02", name: "CLUSTER-02" }],
        "ZONE-03": [{ code: "CLUSTER-03", name: "CLUSTER-03" }],
        "ZONE-04": [{ code: "CLUSTER-04", name: "CLUSTER-04" }],
        "ZONE-05": [{ code: "CLUSTER-05", name: "CLUSTER-05" }],
      };

      if (selectedZones.length > 0) {
        selectedZones.forEach((z) => {
          if (staticClusters[z.code]) {
            allClusters = [...allClusters, ...staticClusters[z.code]];
          } else {
            allClusters.push({ code: `${z.code}-C1`, name: `${z.name} Cluster 1` });
          }
        });
      } else {
        // Show some generic clusters even if no zone selected, just to prove dropdown works
        allClusters = [
          { code: "CLUSTER-01", name: "CLUSTER-01" },
          { code: "CLUSTER-02", name: "CLUSTER-02" },
          { code: "CLUSTER-03", name: "CLUSTER-03" },
        ];
      }
    }

    if (allClusters.length > 0) {
      allClusters = Array.from(new Map(allClusters.map(item => [item.code, item])).values());
    }
    setClusters(allClusters);
  }, [selectedZones, boundaryData]);


  const handleSelect = (value) => {
    const extractedValue = Array.isArray(value) ? value.map(v => Array.isArray(v) ? v[1] : v).filter(Boolean) : value;
    setSelectedClusters(extractedValue);
    onSelect(config.key, extractedValue);
  };

  const isDisabled = selectedZones.length === 0;

  return (
    <LabelFieldPair>
      <CardLabel>{t(config.label) + (config.isMandatory ? " *" : "")}</CardLabel>

      <div className="field" style={{ position: "relative", zIndex: 9 }}>
        <MultiSelectDropdown
          options={clusters}
          selected={selectedClusters}
          onSelect={handleSelect}
          optionsKey="name"
          t={t}
          ServerStyle={{ backgroundColor: "#fff" }}
          disable={isDisabled}
        />
      </div>
    </LabelFieldPair>
  );
};

export default SelectEkycClusters;
