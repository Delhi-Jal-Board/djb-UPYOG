import React, { useState, useEffect } from "react";
import { TextInput, Dropdown, DatePicker } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const InspectionInformation = ({ applicationData }) => {
  const { t } = useTranslation();
  const [inspectionType, setInspectionType] = useState(null);
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectorName, setInspectorName] = useState("");

  useEffect(() => {
    const savedData = sessionStorage.getItem("Digit.INSPECTION_INFORMATION_DATA");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setInspectionType(parsed.inspectionType || null);
        setInspectionDate(parsed.inspectionDate || "");
        setInspectorName(parsed.inspectorName || "");
      } catch (e) {
        console.error("Error parsing inspection information data", e);
      }
    } else if (applicationData?.inspectionInformation) {
      setInspectionType(applicationData.inspectionInformation.inspectionType || null);
      setInspectionDate(applicationData.inspectionInformation.inspectionDate || "");
      setInspectorName(applicationData.inspectionInformation.inspectorName || "");
      sessionStorage.setItem("Digit.INSPECTION_INFORMATION_DATA", JSON.stringify(applicationData.inspectionInformation));
    }
  }, [applicationData]);

  useEffect(() => {
    sessionStorage.setItem("Digit.INSPECTION_INFORMATION_DATA", JSON.stringify({
      inspectionType,
      inspectionDate,
      inspectorName
    }));
  }, [inspectionType, inspectionDate, inspectorName]);


  const inspectionTypeOptions = [
    { i18nKey: "ES_COMMON_SELECT", code: "" },
    { i18nKey: "New Connection Visit", code: "new_connection_visit" },
  ];
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>{t("Inspection Information")}</h2>
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: "1" }}>
          <span style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "8px", display: "inline-block" }}>
            {t("Inspection Type")} <span style={{ color: "red" }}>*</span>
          </span>
          <Dropdown
            option={inspectionTypeOptions}
            optionKey="i18nKey"
            id="inspectionType"
            selected={inspectionType}
            select={setInspectionType}
            t={t}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: "1" }}>
          <span style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "8px", display: "inline-block" }}>
            {t("Inspection Date")} <span style={{ color: "red" }}>*</span>
          </span>
          <DatePicker date={inspectionDate} onChange={setInspectionDate} style={{ width: "100%" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: "1" }}>
          <span style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "8px", display: "inline-block" }}>
            {t("Inspector Name")} <span style={{ color: "red" }}>*</span>
          </span>
          <TextInput value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} style={{ width: "50%", marginBottom: "0" }} />
        </div>
      </div>
    </div>
  );
};

export default InspectionInformation;
