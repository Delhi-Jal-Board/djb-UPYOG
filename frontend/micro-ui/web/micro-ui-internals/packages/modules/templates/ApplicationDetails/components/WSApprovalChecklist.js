import React from "react";
import { CardSubHeader, CheckBox, RadioButtons } from "@djb25/digit-ui-react-components";
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

export const isWSApprovalChecklistComplete = (applicationData, values = {}) =>
  getWSApprovalChecklistFields(applicationData)
    .filter((field) => field.isMandatory)
    .every((field) => values?.[field.name] === true) && values?.isFullySatisfied !== undefined;

const WSApprovalChecklist = ({ applicationData, showApprovalChecklist, values = {}, onChange }) => {
  const { t } = useTranslation();
  if (!showApprovalChecklist) return null;

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
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {getWSApprovalChecklistFields(applicationData).map((field) => (
            <CheckBox
              key={field.name}
              pageType="employee"
              label={`${t(field.label)}${field.isMandatory ? " *" : ""}`}
              checked={values?.[field.name] === true}
              onChange={(event) => onChange({ ...values, [field.name]: event.target.checked })}
            />
          ))}
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
