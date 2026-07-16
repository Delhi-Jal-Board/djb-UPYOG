import React, { useState, useEffect } from "react";
import { TextInput, Dropdown, DatePicker } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const InspectionInformation = ({ applicationData }) => {
  const { t } = useTranslation();

  const [inspectionType, setInspectionType] = useState(null);
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectorName, setInspectorName] = useState("");

  useEffect(() => {
    if (applicationData?.inspectionInformation) {
      const apiInspectionType = applicationData.inspectionInformation.inspectionType;
      let matchedType = null;
      
      const inspectionCode = typeof apiInspectionType === "object" && apiInspectionType !== null 
        ? apiInspectionType.code 
        : apiInspectionType;

      if (inspectionCode) {
        matchedType = [
          { i18nKey: "ES_COMMON_SELECT", code: "" },
          { i18nKey: "New Connection Visit", code: "new_connection_visit" }
        ].find(opt => opt.code === inspectionCode || opt.i18nKey === inspectionCode);
      }
      
      setInspectionType(matchedType || null);
      
      let dateValue = applicationData.inspectionInformation.inspectionDate || "";
      if (dateValue && typeof dateValue === 'number') {
        const d = new Date(dateValue);
        dateValue = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (dateValue && typeof dateValue === 'string' && dateValue.includes('-')) {
        // already in YYYY-MM-DD
      } else if (dateValue) {
        // Handle string timestamp if applicable
        const num = Number(dateValue);
        if (!isNaN(num)) {
          const d = new Date(num);
          dateValue = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      
      setInspectionDate(dateValue);
      setInspectorName(applicationData.inspectionInformation.inspectorName || "");
    }
  }, [applicationData]);

  const inspectionTypeOptions = [
    {
      i18nKey: "ES_COMMON_SELECT",
      code: "",
    },
    {
      i18nKey: "New Connection Visit",
      code: "new_connection_visit",
    },
  ];

  const handleInspectionTypeChange = (selected) => {
    setInspectionType(selected);
    if (!applicationData.inspectionInformation) applicationData.inspectionInformation = {};
    applicationData.inspectionInformation.inspectionType = selected;
  };

  const handleInspectionDateChange = (date) => {
    setInspectionDate(date);
    if (!applicationData.inspectionInformation) applicationData.inspectionInformation = {};
    applicationData.inspectionInformation.inspectionDate = date ? new Date(date).getTime() : null;
  };

  const handleInspectorNameChange = (e) => {
    const val = e.target.value;
    setInspectorName(val);
    if (!applicationData.inspectionInformation) applicationData.inspectionInformation = {};
    applicationData.inspectionInformation.inspectorName = val;
  };

  const readOnly =
    applicationData?.applicationStatus ===
    "PENDING_FOR_CONNECTION_ACTIVATION";

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "16px",
        }}
      >
        {t("Inspection Information")}
      </h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "16px",
              marginBottom: "8px",
              display: "inline-block",
            }}
          >
            {t("Inspection Type")}
          </span>

          <Dropdown
            option={inspectionTypeOptions}
            optionKey="i18nKey"
            selected={inspectionType}
            select={handleInspectionTypeChange}
            t={t}
            disable={readOnly}
          />
        </div>

        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "16px",
              marginBottom: "8px",
              display: "inline-block",
            }}
          >
            {t("Inspection Date")}
          </span>

          <DatePicker
            date={inspectionDate}
            onChange={handleInspectionDateChange}
            disabled={readOnly}
          />
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "16px",
              marginBottom: "8px",
              display: "inline-block",
            }}
          >
            {t("Inspector Name")}
          </span>

          <TextInput
            value={inspectorName}
            onChange={handleInspectorNameChange}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default InspectionInformation;