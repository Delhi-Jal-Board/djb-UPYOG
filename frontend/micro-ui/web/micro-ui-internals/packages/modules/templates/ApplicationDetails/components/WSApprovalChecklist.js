import React from "react";
import { CardSubHeader, CheckBox } from "@djb25/digit-ui-react-components";

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
      label: "Water Pipeline Facility",
      isMandatory: true,
    },
    {
      name: "infrastructureChargesApplicable",
      label: "Infrastructure Charges Applicable",
      isMandatory: plotArea > 200,
    },
    {
      name: "rainWaterHarvesting",
      label: "Rainwater Harvesting",
      isMandatory: false,
    },
    {
      name: "bulkConnectionVerification",
      label: "Bulk Connection Verification",
      isMandatory: false,
    },
  ];
};

export const isWSApprovalChecklistComplete = (applicationData, values = {}) =>
  getWSApprovalChecklistFields(applicationData)
    .filter((field) => field.isMandatory)
    .every((field) => values?.[field.name] === true);

const WSApprovalChecklist = ({ applicationData, showApprovalChecklist, values = {}, onChange }) => {
  if (!showApprovalChecklist) return null;

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "16px",
        border: "1px solid #D6D5D4",
        borderRadius: "4px",
        background: "#FAFAFA",
      }}
    >
      <CardSubHeader style={{ margin: "0 0 16px", color: "#0B0C0C", fontSize: "20px" }}>
        Approval Checklist
      </CardSubHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {getWSApprovalChecklistFields(applicationData).map((field) => (
          <CheckBox
            key={field.name}
            pageType="employee"
            label={`${field.label}${field.isMandatory ? " *" : ""}`}
            checked={values?.[field.name] === true}
            onChange={(event) => onChange({ ...values, [field.name]: event.target.checked })}
          />
        ))}
      </div>
    </div>
  );
};

export default WSApprovalChecklist;
