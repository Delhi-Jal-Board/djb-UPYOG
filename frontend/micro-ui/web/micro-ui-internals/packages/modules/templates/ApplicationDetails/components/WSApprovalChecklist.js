import React from "react";
import { CardSubHeader, RadioButtons, TextArea } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";

export const getWSCurrentState = (applicationData, workflowDetails) =>
  workflowDetails?.data?.processInstances?.[0]?.state?.state ||
  workflowDetails?.data?.ProcessInstances?.[0]?.state?.state ||
  workflowDetails?.data?.actionState?.state ||
  applicationData?.applicationStatus ||
  applicationData?.status;

export const isWSApprovalChecklistState = (applicationData, workflowDetails) =>
  getWSCurrentState(applicationData, workflowDetails) === "PENDING_FOR_EE_APPROVAL";

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
  return values?.isFullySatisfied !== undefined;
};

const WSApprovalChecklist = ({ applicationData, showApprovalChecklist, values = {}, onChange }) => {
  const { t } = useTranslation();
  if (!showApprovalChecklist) return null;

  const yesNoOptions = [
    { label: t("CORE_COMMON_YES", "Yes"), code: true },
    { label: t("CORE_COMMON_NO", "No"), code: false },
  ];

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
        <div style={{ display: "fl                                                                 ex", flexDirection: "column", gap: "16px" }}>
          {getWSApprovalChecklistFields(applicationData).map((field) => {
            const isNoSelected = values?.[field.name] === false;
            const remarkValue = values?.[`${field.name}Remarks`] || "";

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
                  {field.isMandatory && <span style={{ color: "#D4351C", marginLeft: "4px" }}>*</span>}
                </div>

                <RadioButtons
                  name={`ws_checklist_${field.name}`}
                  style={{ display: "flex", gap: "2rem" }}
                  options={yesNoOptions}
                  optionsKey="label"
                  selectedOption={
                    values?.[field.name] !== undefined
                      ? yesNoOptions.find((opt) => opt.code === values[field.name]) || null
                      : null
                  }
                  onSelect={(option) => {
                    const updated = { ...values, [field.name]: option.code };
                    if (option.code === true) {
                      delete updated[`${field.name}Remarks`];
                    }
                    onChange(updated);
                  }}
                />

                {isNoSelected && (
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#0B0C0C" }}>
                      {t("Remarks")} <span style={{ color: "#D4351C" }}>*</span>
                    </div>
                    <TextArea
                      name={`${field.name}Remarks`}
                      value={remarkValue}
                      onChange={(event) =>
                        onChange({ ...values, [`${field.name}Remarks`]: event.target.value })
                      }
                      placeholder={t("Enter mandatory remarks for selecting No")}
                      style={{ width: "100%", minHeight: "60px" }}
                    />
                    {!remarkValue?.trim() && (
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
        <div style={{ marginBottom: "16px" }}>
          {t(
            "I am fully satisfied with the information and documents provided and confirm that they have been duly verified to the best of my knowledge and satisfaction."
          )}
        </div>
        <RadioButtons
          name="ws_checklist_isFullySatisfied"
          style={{ display: "flex", gap: "2rem" }}
          options={[
            { label: t("Yes — Completely Satisfied"), code: true },
            { label: t("No — Not Completely Satisfied"), code: false },
          ]}
          optionsKey="label"
          selectedOption={
            values?.isFullySatisfied !== undefined
              ? {
                  label: values.isFullySatisfied ? t("Yes — Completely Satisfied") : t("No — Not Completely Satisfied"),
                  code: values.isFullySatisfied,
                }
              : null
          }
          onSelect={(option) => onChange({ ...values, isFullySatisfied: option.code })}
        />
      </div>
    </React.Fragment>
  );
};

export default WSApprovalChecklist;
