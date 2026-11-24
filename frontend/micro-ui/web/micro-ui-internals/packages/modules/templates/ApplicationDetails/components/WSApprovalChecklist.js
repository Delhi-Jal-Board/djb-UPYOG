import React from "react";
import { CardSubHeader, RadioButtons, TextArea } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

export const parseBool = (val) => {
  if (typeof val === "boolean") return val;
  if (val === "true" || val === "TRUE" || val === "Yes" || val === "YES") return true;
  if (val === "false" || val === "FALSE" || val === "No" || val === "NO") return false;
  return undefined;
};

export const getWSCurrentState = (applicationData, workflowDetails) =>
  workflowDetails?.data?.processInstances?.[0]?.state?.state ||
  workflowDetails?.data?.ProcessInstances?.[0]?.state?.state ||
  workflowDetails?.data?.processInstances?.[0]?.state?.applicationStatus ||
  workflowDetails?.data?.ProcessInstances?.[0]?.state?.applicationStatus ||
  workflowDetails?.data?.actionState?.state ||
  workflowDetails?.data?.actionState?.applicationStatus ||
  workflowDetails?.data?.timeline?.[0]?.state ||
  workflowDetails?.data?.timeline?.[0]?.status ||
  applicationData?.applicationStatus ||
  applicationData?.status;

export const hasWSApprovalChecklistData = (applicationData, workflowDetails) => {
  const details = applicationData?.additionalDetails || {};
  const fields = [
    "waterPipelineFacility",
    "infrastructureChargesApplicable",
    "rainWaterHarvesting",
    "bulkConnectionVerification",
    "CompletelySatisfied",
    "isFullySatisfied",
  ];
  if (fields.some((key) => details[key] !== undefined)) {
    return true;
  }
  const timelineInstances = workflowDetails?.data?.timeline || [];
  const processInstances = workflowDetails?.data?.processInstances || workflowDetails?.data?.ProcessInstances || [];
  for (const inst of [...processInstances, ...timelineInstances]) {
    if (fields.some((key) => inst?.additionalDetails?.[key] !== undefined)) {
      return true;
    }
  }
  return false;
};

export const isWSApprovalChecklistEditableState = (applicationData, workflowDetails) => {
  const currentState = getWSCurrentState(applicationData, workflowDetails);
  const normState = typeof currentState === "string" ? currentState.trim().toUpperCase() : "";
  return normState === "PENDING_FOR_EE_APPROVAL";
};

export const isWSApprovalChecklistReadOnlyState = (applicationData, workflowDetails) => {
  const currentState = getWSCurrentState(applicationData, workflowDetails);
  const normState = typeof currentState === "string" ? currentState.trim().toUpperCase() : "";
  if (normState === "PENDING_FOR_EE_APPROVAL") return false;
  if (
    normState === "PENDING_FOR_JE_VERIFICATION" ||
    normState === "PENDING_FOR_DEALING_ASSISTENCE_VERIFICATION" ||
    normState === "PENDING_FOR_DEALING_ASSISTANT_VERIFICATION" ||
    normState === "PENDING_FOR_DA_VERIFICATION"
  ) {
    return true;
  }
  return hasWSApprovalChecklistData(applicationData, workflowDetails);
};

export const isWSApprovalChecklistState = (applicationData, workflowDetails) =>
  isWSApprovalChecklistEditableState(applicationData, workflowDetails) ||
  isWSApprovalChecklistReadOnlyState(applicationData, workflowDetails);

export const getWSApprovalChecklistFields = (applicationData) => {
  const plotArea = Number(
    applicationData?.additionalDetails?.plotArea ||
      applicationData?.additionalDetails?.plotSize ||
      applicationData?.property?.landArea ||
      applicationData?.property?.plotArea ||
      0
  );

  return [
    {
      name: "waterPipelineFacility",
      label: "I hereby confirm the availability of a water pipeline facility at the premises.",
      isMandatory: true,
    },
    {
      name: "infrastructureChargesApplicable",
      label: "I hereby confirm whether infrastructure charges are applicable to the premises.",
      isMandatory: plotArea > 200,
    },
    {
      name: "rainWaterHarvesting",
      label: "I hereby confirm the provision/status of a rainwater harvesting facility at the premises.",
      isMandatory: false,
    },
    {
      name: "bulkConnectionVerification",
      label: "I hereby confirm that the bulk water connection has been duly verified.",
      isMandatory: false,
    },
  ];
};

export const isWSApprovalChecklistComplete = (applicationData, values = {}) => {
  const fields = getWSApprovalChecklistFields(applicationData);

  // Mandatory fields must have an answer selected (true for Yes or false for No)
  const mandatoryFieldsAnswered = fields
    .filter((field) => field.isMandatory)
    .every((field) => values?.[field.name] === true || values?.[field.name] === false);

  if (!mandatoryFieldsAnswered) return false;

  // Whenever 'No' (false) is selected on any field, the remark is mandatory
  const remarksValid = fields.every((field) => {
    if (values?.[field.name] === false) {
      const remark = values?.[`${field.name}Remarks`];
      return typeof remark === "string" && remark.trim().length > 0;
    }
    return true;
  });

  if (!remarksValid) return false;

  // Satisfaction confirmation must be selected
  if (values?.isFullySatisfied === undefined) return false;

  // When 'No — Not Completely Satisfied' is selected, remark is mandatory
  if (values?.isFullySatisfied === false) {
    const satisfactionRemark = values?.notCompletelySatisfiedRemarks || values?.completelySatisfiedRemarks;
    return typeof satisfactionRemark === "string" && satisfactionRemark.trim().length > 0;
  }

  return true;
};

const WSApprovalChecklist = ({ applicationData, workflowDetails, showApprovalChecklist, values = {}, onChange, isReadOnly = false }) => {
  const { t } = useTranslation();
  if (!showApprovalChecklist) return null;

  const isEffectivelyReadOnly = isReadOnly || !isWSApprovalChecklistEditableState(applicationData, workflowDetails);
  const addDetails = applicationData?.additionalDetails || {};

  const yesNoOptions = [
    { label: t("CORE_COMMON_YES", "Yes"), code: true },
    { label: t("CORE_COMMON_NO", "No"), code: false },
  ];

  const satisfactionOptions = [
    { label: t("Yes — Completely Satisfied"), code: true },
    { label: t("No — Not Completely Satisfied"), code: false },
  ];

  const rawSatisfied =
    values?.isFullySatisfied !== undefined
      ? values.isFullySatisfied
      : addDetails.CompletelySatisfied !== undefined
      ? addDetails.CompletelySatisfied
      : addDetails.isFullySatisfied;
  const satisfiedBool = parseBool(rawSatisfied);
  const isSatisfiedNoSelected = satisfiedBool === false;
  const satisfactionRemarkValue =
    values?.notCompletelySatisfiedRemarks ||
    values?.completelySatisfiedRemarks ||
    addDetails.notCompletelySatisfiedRemarks ||
    addDetails.completelySatisfiedRemarks ||
    "";

  return (
    <React.Fragment>
      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          border: "1px solid #D6D5D4",
          borderRadius: "4px",
          background: "#FAFAFA",
        }}
      >
        <CardSubHeader style={{ margin: "0 0 16px", color: "#0B0C0C", fontSize: "20px" }}>{t("Approval Checklist")}</CardSubHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {getWSApprovalChecklistFields(applicationData).map((field) => {
            const rawFieldValue = values?.[field.name] !== undefined ? values[field.name] : addDetails[field.name];
            const fieldBool = parseBool(rawFieldValue);
            const isNoSelected = fieldBool === false;
            const remarkValue =
              values?.[`${field.name}Remarks`] !== undefined
                ? values[`${field.name}Remarks`]
                : addDetails[`${field.name}Remarks`] || "";

            return (
              <div
                key={field.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid #EAEAEA",
                }}
              >
                <div style={{ fontSize: "16px", color: "#0B0C0C", fontWeight: "500", lineHeight: "1.4" }}>
                  {t(field.label)}
                  {!isEffectivelyReadOnly && field.isMandatory && <span style={{ color: "#D4351C", marginLeft: "4px" }}>*</span>}
                </div>

                <RadioButtons
                  name={`ws_checklist_${field.name}`}
                  style={{
                    display: "flex",
                    gap: "2rem",
                    cursor: isEffectivelyReadOnly ? "default" : "pointer",
                  }}
                  innerStyles={{
                    ...(isEffectivelyReadOnly ? { pointerEvents: "none", cursor: "default" } : {}),
                  }}
                  inputStyle={{
                    ...(isEffectivelyReadOnly ? { cursor: "default" } : {}),
                  }}
                  options={yesNoOptions}
                  optionsKey="label"
                  selectedOption={
                    fieldBool !== undefined
                      ? yesNoOptions.find((opt) => opt.code === fieldBool) || null
                      : null
                  }
                  disabled={isEffectivelyReadOnly}
                  onSelect={(option) => {
                    if (isEffectivelyReadOnly) return;
                    const updated = { ...values, [field.name]: option.code };
                    if (option.code === true) {
                      delete updated[`${field.name}Remarks`];
                    }
                    onChange && onChange(updated);
                  }}
                />

                {isNoSelected && (
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#0B0C0C" }}>
                      {t("Remarks")} {!isEffectivelyReadOnly && field.isMandatory && <span style={{ color: "#D4351C" }}>*</span>}
                    </div>
                    <TextArea
                      name={`${field.name}Remarks`}
                      value={remarkValue}
                      disabled={isEffectivelyReadOnly}
                      onChange={(event) =>
                        !isEffectivelyReadOnly &&
                        onChange &&
                        onChange({ ...values, [`${field.name}Remarks`]: event.target.value })
                      }
                      placeholder={isEffectivelyReadOnly ? "" : t("Enter mandatory remarks for selecting No")}
                      style={{
                        width: "100%",
                        minHeight: "60px",
                        backgroundColor: isEffectivelyReadOnly ? "#F3F3F3" : "#FFFFFF",
                        color: "#0B0C0C",
                        cursor: isEffectivelyReadOnly ? "default" : "text",
                      }}
                    />
                    {!isEffectivelyReadOnly && !remarkValue?.trim() && (
                      <span className="card-label-error" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
                        {t("CS_REMARK_IS_MANDATORY", "Remarks are mandatory when selecting No")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          border: "1px solid #D6D5D4",
          borderRadius: "4px",
          background: "#FAFAFA",
        }}
      >
        <div style={{ marginBottom: "16px", fontSize: "16px", color: "#0B0C0C", fontWeight: "500", lineHeight: "1.4" }}>
          {t(
            "I am fully satisfied with the information and documents provided and confirm that they have been duly verified to the best of my knowledge and satisfaction."
          )}
          {!isEffectivelyReadOnly && <span style={{ color: "#D4351C", marginLeft: "4px" }}>*</span>}
        </div>
        <RadioButtons
          name="ws_checklist_isFullySatisfied"
          style={{
            display: "flex",
            gap: "2rem",
            cursor: isEffectivelyReadOnly ? "default" : "pointer",
          }}
          innerStyles={{
            ...(isEffectivelyReadOnly ? { pointerEvents: "none", cursor: "default" } : {}),
          }}
          inputStyle={{
            ...(isEffectivelyReadOnly ? { cursor: "default" } : {}),
          }}
          options={satisfactionOptions}
          optionsKey="label"
          selectedOption={
            satisfiedBool !== undefined
              ? satisfactionOptions.find((opt) => opt.code === satisfiedBool) || null
              : null
          }
          disabled={isEffectivelyReadOnly}
          onSelect={(option) => {
            if (isEffectivelyReadOnly) return;
            const updated = { ...values, isFullySatisfied: option.code };
            if (option.code === true) {
              delete updated.notCompletelySatisfiedRemarks;
              delete updated.completelySatisfiedRemarks;
            }
            onChange && onChange(updated);
          }}
        />

        {isSatisfiedNoSelected && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#0B0C0C" }}>
              {t("Remarks")} {!isEffectivelyReadOnly && <span style={{ color: "#D4351C" }}>*</span>}
            </div>
            <TextArea
              name="notCompletelySatisfiedRemarks"
              value={satisfactionRemarkValue}
              disabled={isEffectivelyReadOnly}
              onChange={(event) => {
                if (!isEffectivelyReadOnly && onChange) {
                  const val = event.target.value;
                  onChange({
                    ...values,
                    notCompletelySatisfiedRemarks: val,
                    completelySatisfiedRemarks: val,
                  });
                }
              }}
              placeholder={isEffectivelyReadOnly ? "" : t("Enter mandatory remarks for selecting No")}
              style={{
                width: "100%",
                minHeight: "60px",
                backgroundColor: isEffectivelyReadOnly ? "#F3F3F3" : "#FFFFFF",
                color: "#0B0C0C",
                cursor: isEffectivelyReadOnly ? "default" : "text",
              }}
            />
            {!isEffectivelyReadOnly && !satisfactionRemarkValue?.trim() && (
              <span className="card-label-error" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
                {t("CS_REMARK_IS_MANDATORY", "Remarks are mandatory when selecting No")}
              </span>
            )}
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default WSApprovalChecklist;
