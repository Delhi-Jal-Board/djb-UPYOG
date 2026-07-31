// import React, { useState, useEffect } from "react";
// import { CardLabel, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

// const SelectEkycZones = ({ config, onSelect, t, formData, isMultiSelect = true }) => {
//   const tenantId = Digit.ULBService.getCurrentTenantId();

//   const [zones, setZones] = useState([]);

//   const [selectedZones, setSelectedZones] = useState([]);

//   const { data: boundaryData, isLoading } = Digit.Hooks.useCommonMDMS(tenantId, "egov-location", ["TenantBoundary"]);

//   useEffect(() => {
//     if (!zones.length) return;

//     if (isMultiSelect) {
//       setSelectedZones(Array.isArray(formData?.zoneIds) ? zones.filter((ele) => formData.zoneIds.includes(ele.code)) : []);
//     } else {
//       const selected = zones.find((ele) => {
//         return ele.code === formData?.zoneIds;
//       });

//       setSelectedZones(selected ? [selected] : []);
//     }
//   }, [zones, formData?.zoneIds, isMultiSelect]);

//   useEffect(() => {
//     const tenantBoundary = boundaryData?.["egov-location"]?.TenantBoundary?.[0] || boundaryData?.MdmsRes?.["egov-location"]?.TenantBoundary?.[0];

//     const boundaries = tenantBoundary?.boundary || tenantBoundary?.children || [];

//     if (Array.isArray(boundaries?.children) && boundaries?.children.length > 0) {
//       const allZones = boundaries.children.flatMap((assembly) =>
//         (assembly?.children || []).map((zone) => ({
//           code: zone.code,
//           name: zone.name,
//         }))
//       );

//       const zonesList = [...new Map(allZones.map((zone) => [zone.code, zone])).values()];

//       setZones(zonesList);
//     }
//   }, [boundaryData]);

//   const handleSelect = (value) => {
//     if (isMultiSelect) {
//       const extractedValue = Array.isArray(value) ? value.map((v) => (Array.isArray(v) ? v[1] : v)).filter(Boolean) : [];
//       console.log("PPPPPPPPPPPP", extractedValue);
//       onSelect(config.key, extractedValue);
//     } else {
//       const selectedZone = Array.isArray(value) ? (Array.isArray(value[0]) ? value[0][1] : value[0]) : value;

//       setSelectedZones(selectedZone ? [selectedZone] : []);

//       onSelect(config.key, selectedZone?.code || "");
//     }
//   };

//   useEffect(() => {
//     console.log(selectedZones);
//     setSelectedZones(zones.filter((ele) => formData?.zoneIds?.includes(ele.name)));
//   }, [formData]);
//   console.log("<><><><><><><><><><><>", selectedZones);

//   useEffect(() => {
//     if (!zones.length || !Array.isArray(formData?.zoneIds)) return;

//     // Already converted
//     if (formData.zoneIds.length && typeof formData.zoneIds[0] === "object") {
//       setSelectedZones(formData.zoneIds);
//       return;
//     }

//     const selected = zones.filter((zone) => formData.zoneIds.includes(zone.name));

//     setSelectedZones(selected);

//     // Update FormComposer's formData
//     onSelect(config.key, selected);
//   }, [zones]);

//   if (isLoading) return <Loader />;

//   return (
//     <LabelFieldPair>
//       <CardLabel>{t(config.label) + (config.isMandatory ? " *" : "")}</CardLabel>

//       <div className="field" style={{ position: "relative", zIndex: 10 }}>
//         <MultiSelectDropdown
//           options={zones}
//           selected={selectedZones}
//           onSelect={handleSelect}
//           optionsKey="name"
//           t={t}
//           multiple={isMultiSelect}
//           ServerStyle={{ backgroundColor: "#fff" }}
//           isMultiSelect={isMultiSelect}
//           showSelectedLabels={!isMultiSelect}
//           defaultLabel={isMultiSelect ? (formData?.zoneIds?.length || 0) + " Selected" : ""}
//         />
//       </div>
//       {isMultiSelect && Array.isArray(formData?.zoneIds) && formData.zoneIds.length > 0 && (
//         <div className="selected-zones">
//           {formData.zoneIds.map((zone) => (
//             <span key={zone.code} className="selected-zone-chip">
//               {zone.name}
//             </span>
//           ))}
//         </div>
//       )}
//     </LabelFieldPair>
//   );
// };

// export default SelectEkycZones;

import React, { useState, useEffect, useRef } from "react";
import { CardLabel, LabelFieldPair, MultiSelectDropdown, Loader } from "@djb25/digit-ui-react-components";

const SelectEkycZones = ({ config, onSelect, t, formData, isMultiSelect = true, disable = false }) => {
  const rawTenantId = Digit.ULBService.getCurrentTenantId();
  const tenantId = rawTenantId?.includes(".") ? rawTenantId : `${rawTenantId}.djb`;

  const [zones, setZones] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);

  // Prevent converting initial values multiple times
  const initialized = useRef(false);

  const isVendorPage = window.location.pathname.includes("/new-vendor") || window.location.pathname.includes("/modify-vendor") || window.location.href.includes("/new-vendor") || window.location.href.includes("/modify-vendor");

  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const roles = loggedInUser?.roles?.map((r) => r.code) || [];
  const isEkycVendor = roles.includes("EKYC_VENDOR");
  const isEkycSupervisor = roles.includes("EKYC_SUPERVISOR");

  const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: isEkycVendor && !isVendorPage }
  );

  const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: isEkycSupervisor }
  );

  const matchedVendor = React.useMemo(() => {
    if (!vendorSearchResponse) return null;
    const userUuid = loggedInUser?.uuid;
    const userMobile = loggedInUser?.mobileNumber;
    return vendorSearchResponse.find((v) => {
      const actualVendor = v.dsoDetails || v;
      const ownerUuid = actualVendor.owner?.uuid || actualVendor.owner?.id;
      const ownerMobile = actualVendor.owner?.mobileNumber || actualVendor.mobileNumber;
      return (userUuid && ownerUuid === userUuid) || (userMobile && ownerMobile === userMobile);
    })?.dsoDetails || vendorSearchResponse[0]?.dsoDetails || vendorSearchResponse[0];
  }, [vendorSearchResponse, loggedInUser]);

  const matchedSupervisor = React.useMemo(() => {
    if (!supervisorSearchResponse?.supervisors) return null;
    return supervisorSearchResponse.supervisors.find(
      (s) =>
        s.id?.toLowerCase() === loggedInUser?.uuid?.toLowerCase() ||
        s.owner?.uuid?.toLowerCase() === loggedInUser?.uuid?.toLowerCase() ||
        s.owner?.mobileNumber === loggedInUser?.mobileNumber ||
        s.mobileNo === loggedInUser?.mobileNumber
    );
  }, [supervisorSearchResponse, loggedInUser]);

  const { data: zroData, isLoading } = Digit.Hooks.useCommonMDMS("dl", "common-masters", ["ZroOfficeList"]);

  useEffect(() => {
    const zroOfficeList = zroData?.["common-masters"]?.ZroOfficeList || zroData?.MdmsRes?.["common-masters"]?.ZroOfficeList || [];

    if (Array.isArray(zroOfficeList)) {
      const activeZros = zroOfficeList
        .filter((zro) => zro && zro.active)
        .map((zro) => ({
          code: zro.code,
          name: zro.code,
        }));

      setZones(activeZros);
    }
  }, [zroData]);

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

  useEffect(() => {
    if (isEkycSupervisor && zones.length > 0 && !formData?.zoneIds && !initialized.current) {
      initialized.current = true;
      setSelectedZones([zones[0]]);
      onSelect(config.key, zones[0].name || "");
    }
  }, [isEkycSupervisor, zones, formData?.zoneIds, config.key, onSelect]);

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

  if (isLoading || (isEkycVendor && !isVendorPage && isVendorSearchLoading) || (isEkycSupervisor && isSupervisorSearchLoading)) return <Loader />;

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
          disable={disable || isEkycSupervisor || config.props?.disable || config.disable}
        />
      </div>

      {isMultiSelect && selectedZones.length > 0 && (
        <div className="selected-zones">
          {selectedZones.filter(zone => zone && zone.code).map((zone) => (
            <span key={zone.code} className="selected-zone-chip">
              {t(zone.code)}
            </span>
          ))}
        </div>
      )}
    </LabelFieldPair>
  );
};

export default SelectEkycZones;
