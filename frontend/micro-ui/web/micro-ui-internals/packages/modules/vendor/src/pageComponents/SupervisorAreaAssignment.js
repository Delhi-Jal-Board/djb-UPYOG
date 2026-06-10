import React, { useState, useEffect } from "react";
import { CardLabel, Dropdown, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

const SupervisorAreaAssignment = ({ config, onSelect, t, userType, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [selectedZone, setSelectedZone] = useState(formData?.areaAssignment?.zone || null);
  const [selectedCluster, setSelectedCluster] = useState(formData?.areaAssignment?.cluster || null);
  const [selectedWard, setSelectedWard] = useState(formData?.areaAssignment?.ward || null);
  const [selectedAreas, setSelectedAreas] = useState(formData?.areaAssignment?.areas || []);

  const [zones, setZones] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [wards, setWards] = useState([]);
  const [areas, setAreas] = useState([]);

  // Fetching Hierarchy Data from MDMS
  const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

  useEffect(() => {
    console.log("Boundary Data State:", { boundaryData, isLoading });
    if (boundaryData) {
      const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];
      const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];
      if (Array.isArray(boundaries) && boundaries.length > 0) {
        setZones(boundaries);
      } else if (!isLoading) {
        setZones([
          { code: "ZONE-01", name: "ZONE-01", children: [
            { code: "CLUSTER-01", name: "CLUSTER-01", children: [
              { code: "WARD-01", name: "WARD-01", children: [
                { code: "AREA-01", name: "AREA-01" },
                { code: "AREA-02", name: "AREA-02" }
              ]}
            ]}
          ]},
          { code: "ZONE-02", name: "ZONE-02" }
        ]);
      }
    } else if (!isLoading) {
        // Fallback for testing when API fails entirely
        setZones([
          { code: "ZONE-01", name: "ZONE-01", children: [
            { code: "CLUSTER-01", name: "CLUSTER-01", children: [
              { code: "WARD-01", name: "WARD-01", children: [
                { code: "AREA-01", name: "AREA-01" },
                { code: "AREA-02", name: "AREA-02" }
              ]}
            ]}
          ]},
          { code: "ZONE-02", name: "ZONE-02" }
        ]);
    }
  }, [boundaryData, isLoading]);

  useEffect(() => {
    if (selectedZone) {
      const children = selectedZone.children || selectedZone.boundary || [];
      setClusters(children.length > 0 ? children : [
        { code: "CLUSTER-01", name: "CLUSTER-01", children: [
          { code: "WARD-01", name: "WARD-01", children: [
            { code: "AREA-01", name: "AREA-01" },
            { code: "AREA-02", name: "AREA-02" }
          ]}
        ]}
      ]);
      // If zone changed, reset children
      if (selectedZone.code !== formData?.areaAssignment?.zone?.code) {
          setSelectedCluster(null);
          setSelectedWard(null);
          setSelectedAreas([]);
      }
    } else {
      setClusters([]);
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedCluster) {
      const children = selectedCluster.children || selectedCluster.boundary || [];
      setWards(children.length > 0 ? children : [
        { code: "WARD-01", name: "WARD-01", children: [
          { code: "AREA-01", name: "AREA-01" },
          { code: "AREA-02", name: "AREA-02" }
        ]}
      ]);
      if (selectedCluster.code !== formData?.areaAssignment?.cluster?.code) {
          setSelectedWard(null);
          setSelectedAreas([]);
      }
    } else {
      setWards([]);
    }
  }, [selectedCluster]);

  useEffect(() => {
    if (selectedWard) {
      const children = selectedWard.children || selectedWard.localities || selectedWard.boundary || [];
      setAreas(children.length > 0 ? children : [
        { code: "AREA-01", name: "AREA-01" },
        { code: "AREA-02", name: "AREA-02" }
      ]);
      if (selectedWard.code !== formData?.areaAssignment?.ward?.code) {
          setSelectedAreas([]);
      }
    } else {
      setAreas([]);
    }
  }, [selectedWard]);

  const handleSelect = (key, value) => {
    const updatedData = {
      ...formData?.areaAssignment,
      [key]: value,
    };
    
    // Clear dependent fields if parent changes
    if (key === "zone") {
        updatedData.cluster = null;
        updatedData.ward = null;
        updatedData.areas = [];
    } else if (key === "cluster") {
        updatedData.ward = null;
        updatedData.areas = [];
    } else if (key === "ward") {
        updatedData.areas = [];
    }

    onSelect(config.key, updatedData);
  };

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <LabelFieldPair>
        <CardLabel>{t("ES_VENDOR_SUPERVISOR_ZONE") + " *"}</CardLabel>
        <Dropdown
          selected={selectedZone}
          option={zones}
          select={(val) => {
            setSelectedZone(val);
            handleSelect("zone", val);
          }}
          optionKey="name"
          t={t}
        />
      </LabelFieldPair>

      <LabelFieldPair>
        <CardLabel>{t("ES_VENDOR_SUPERVISOR_CLUSTER") + " *"}</CardLabel>
        <Dropdown
          selected={selectedCluster}
          option={clusters}
          select={(val) => {
            setSelectedCluster(val);
            handleSelect("cluster", val);
          }}
          optionKey="name"
          t={t}
          disable={!selectedZone}
        />
      </LabelFieldPair>

      <LabelFieldPair>
        <CardLabel>{t("ES_VENDOR_SUPERVISOR_WARD") + " *"}</CardLabel>
        <Dropdown
          selected={selectedWard}
          option={wards}
          select={(val) => {
            setSelectedWard(val);
            handleSelect("ward", val);
          }}
          optionKey="name"
          t={t}
          disable={!selectedCluster}
        />
      </LabelFieldPair>

      <LabelFieldPair>
        <CardLabel>{t("ES_VENDOR_SUPERVISOR_AREA") + " *"}</CardLabel>
        <MultiSelectDropdown
          options={areas}
          selected={selectedAreas}
          onSelect={(val) => {
            setSelectedAreas(val);
            handleSelect("areas", val);
          }}
          optionsKey="name"
          t={t}
          disable={!selectedWard}
          ServerStyle={{ backgroundColor: "#fff" }}
        />
      </LabelFieldPair>
    </React.Fragment>
  );
};

export default SupervisorAreaAssignment;
