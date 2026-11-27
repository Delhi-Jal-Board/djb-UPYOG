import React from "react";
import { CardSubHeader, RadioButtons, TextArea, InfoBannerIcon } from "@djb25/digit-ui-react-components";
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

export const isWSNewConnection = (applicationData, workflowDetails, businessService) => {
  const bService =
    businessService ||
    workflowDetails?.data?.processInstances?.[0]?.businessService ||
    workflowDetails?.data?.ProcessInstances?.[0]?.businessService ||
    applicationData?.processInstancesDetails?.[0]?.businessService ||
    applicationData?.businessService ||
    "";
  const bServiceUpper = typeof bService === "string" ? bService.trim().toUpperCase() : "";

  const appType = applicationData?.applicationType || "";
  const appTypeUpper = typeof appType === "string" ? appType.trim().toUpperCase() : "";

  const appStatus =
    applicationData?.applicationStatus ||
    workflowDetails?.data?.timeline?.[0]?.state ||
    workflowDetails?.data?.timeline?.[0]?.status ||
    workflowDetails?.data?.processInstances?.[0]?.state?.state ||
    workflowDetails?.data?.processInstances?.[0]?.state?.applicationStatus ||
    "";
  const appStatusUpper = typeof appStatus === "string" ? appStatus.trim().toUpperCase() : "";

  const isMutation =
    appTypeUpper.includes("MUTATION") ||
    bServiceUpper.includes("MUTATION") ||
    appStatusUpper.includes("MUTATION") ||
    Boolean(applicationData?.additionalDetails?.reasonForNameChange) ||
    Boolean(applicationData?.additionalDetails?.relationshipWithExistingConsumer);

  if (
    isMutation ||
    appTypeUpper.includes("DISCONNECT") ||
    appTypeUpper.includes("RECONNECT") ||
    bServiceUpper.includes("DISCONNECT") ||
    bServiceUpper.includes("RECONNECT") ||
    bServiceUpper.includes("AMENDMENT")
  ) {
    return false;
  }

  if (bServiceUpper === "NEWWS1" || bServiceUpper === "NEWSW1") return true;
  if (appTypeUpper.includes("NEW_") || appTypeUpper.includes("NEWWS")) return true;

  const appNo = applicationData?.applicationNo || applicationData?.applicationNumber || "";
  if (appNo.includes("WS_AP") || appNo.includes("SW_AP")) return true;

  return true;
};

export const hasJEVerifiedInWorkflow = (applicationData, workflowDetails) => {
  const processInstances = [
    ...(workflowDetails?.data?.processInstances || []),
    ...(workflowDetails?.data?.ProcessInstances || []),
    ...(workflowDetails?.ProcessInstances || []),
    ...(applicationData?.processInstancesDetails || []),
  ];
  const timeline = workflowDetails?.data?.timeline || [];

  const checkItem = (item) => {
    const action = (item?.action || item?.performedAction || "").trim().toUpperCase();
    const state = (
      item?.state?.state ||
      item?.state?.applicationStatus ||
      item?.state ||
      item?.status ||
      ""
    ).trim().toUpperCase();

    if (action === "FORWARD_TO_EE") return true;
    if (state === "PENDING_FOR_JE_VERIFICATION" && action && action !== "") return true;
    return false;
  };

  if (processInstances.some(checkItem) || timeline.some(checkItem)) {
    return true;
  }

  const details = applicationData?.additionalDetails || {};
  if (
    details.waterPipelineFacility !== undefined ||
    details.waterPipelineFacilityRemarks !== undefined ||
    details.infrastructureChargesApplicable !== undefined ||
    details.rainWaterHarvesting !== undefined ||
    details.bulkConnectionVerification !== undefined
  ) {
    return true;
  }

  return false;
};

export const hasDAVerifiedInWorkflow = (applicationData, workflowDetails) => {
  const processInstances = [
    ...(workflowDetails?.data?.processInstances || []),
    ...(workflowDetails?.data?.ProcessInstances || []),
    ...(workflowDetails?.ProcessInstances || []),
    ...(applicationData?.processInstancesDetails || []),
  ];
  const timeline = workflowDetails?.data?.timeline || [];

  const isDAStateName = (st) => {
    if (!st || typeof st !== "string") return false;
    const upper = st.trim().toUpperCase();
    return (
      upper.includes("DEALING_ASSIST") ||
      upper.includes("DEALING_ASSISTENCE") ||
      upper.includes("DEALING_ASSISTANT") ||
      upper.includes("DA_VERIF")
    );
  };

  const checkItem = (item) => {
    const action = (item?.action || item?.performedAction || "").trim().toUpperCase();
    const state = (
      item?.state?.state ||
      item?.state?.applicationStatus ||
      item?.state ||
      item?.status ||
      ""
    ).trim().toUpperCase();

    if (isDAStateName(state)) {
      return true;
    }
    if (action.includes("FORWARD_TO_ZRO") || action.includes("VERIFY_AND_FORWARD_TO_ZRO")) {
      if (isDAStateName(state)) return true;
    }
    return false;
  };

  if (processInstances.some(checkItem)) {
    return true;
  }

  for (let i = 0; i < timeline.length; i++) {
    const cp = timeline[i];
    const stateName = cp?.state || cp?.status || cp?.applicationStatus || "";
    if (isDAStateName(stateName)) {
      return true;
    }
  }

  const details = applicationData?.additionalDetails || {};
  if (
    (applicationData?.dueVerification && Array.isArray(applicationData.dueVerification) && applicationData.dueVerification.length > 0) ||
    (details?.dueVerification && Array.isArray(details.dueVerification) && details.dueVerification.length > 0) ||
    details?.hasDueVerification === true
  ) {
    return true;
  }

  return false;
};

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

export const checkCameFromCitizenAction = (applicationData, workflowDetails) => {
  const allInstances = [
    ...(workflowDetails?.data?.timeline || []),
    ...(workflowDetails?.data?.processInstances || []),
    ...(workflowDetails?.data?.ProcessInstances || []),
    ...(workflowDetails?.ProcessInstances || []),
    ...(applicationData?.processInstancesDetails || []),
  ];

  return allInstances.some((item) => {
    const action = (item?.action || item?.performedAction || "").trim().toUpperCase();
    const state = (
      item?.state?.state ||
      item?.state?.applicationStatus ||
      item?.state ||
      item?.status ||
      ""
    ).trim().toUpperCase();

    return (
      action.includes("CITIZEN") ||
      action.includes("SEND_BACK_TO_CITIZEN") ||
      action.includes("RESUBMIT") ||
      action.includes("RE-SUBMIT") ||
      state.includes("CITIZEN_ACTION") ||
      state.includes("PENDING_FOR_CITIZEN_ACTION")
    );
  });
};

export const isWSApprovalChecklistEditableState = (applicationData, workflowDetails) => {
  if (!isWSNewConnection(applicationData, workflowDetails)) return false;

  const currentState = getWSCurrentState(applicationData, workflowDetails);
  const normState = typeof currentState === "string" ? currentState.trim().toUpperCase() : "";

  // In PENDING_FOR_JE_VERIFICATION, checklist is editable for JE (Yes / No selection)
  if (normState === "PENDING_FOR_JE_VERIFICATION") {
    return true;
  }

  // In PENDING_FOR_EE_APPROVAL, checklist is editable ONLY after JE has verified (EE fills satisfaction declaration)
  if (normState === "PENDING_FOR_EE_APPROVAL") {
    return hasJEVerifiedInWorkflow(applicationData, workflowDetails);
  }

  // In PENDING_FOR_ZRO_APPROVAL (including after citizen action), checklist satisfaction is editable
  if (normState === "PENDING_FOR_ZRO_APPROVAL") {
    return true;
  }

  return false;
};

export const isWSApprovalChecklistReadOnlyState = (applicationData, workflowDetails) => {
  if (!isWSNewConnection(applicationData, workflowDetails)) return false;

  const currentState = getWSCurrentState(applicationData, workflowDetails);
  const normState = typeof currentState === "string" ? currentState.trim().toUpperCase() : "";

  // First time at PENDING_FOR_EE_APPROVAL (before JE verification):
  // Checklist questions are in read-only / readable form for EE
  if (normState === "PENDING_FOR_EE_APPROVAL") {
    const jeVerified = hasJEVerifiedInWorkflow(applicationData, workflowDetails);
    return !jeVerified;
  }

  // At PENDING_FOR_JE_VERIFICATION: it is editable for JE, not read-only
  if (normState === "PENDING_FOR_JE_VERIFICATION") {
    return false;
  }

  // At PENDING_FOR_ZRO_APPROVAL: it is editable (satisfaction declaration, etc.), not read-only
  if (normState === "PENDING_FOR_ZRO_APPROVAL") {
    return false;
  }

  if (
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

export const getRainWaterHarvestingDefault = (applicationData, workflowDetails) => {
  const processInstances = [
    ...(workflowDetails?.data?.processInstances || []),
    ...(workflowDetails?.data?.ProcessInstances || []),
    ...(workflowDetails?.ProcessInstances || []),
    ...(applicationData?.processInstancesDetails || []),
  ];
  const piWithChecklist = processInstances.find(
    (pi) =>
      pi?.additionalDetails?.waterPipelineFacility !== undefined ||
      pi?.additionalDetails?.infrastructureChargesApplicable !== undefined ||
      pi?.additionalDetails?.rainWaterHarvesting !== undefined ||
      pi?.additionalDetails?.bulkConnectionVerification !== undefined
  );
  const addDetails = {
    ...(piWithChecklist?.additionalDetails || {}),
    ...(applicationData?.additionalDetails || {}),
  };
  const rootRwh = applicationData?.rainWaterHarvesting;

  const hasRwh =
    addDetails?.hasRainWaterHarvestingCertificate === true ||
    String(addDetails?.hasRainWaterHarvestingCertificate) === "true" ||
    String(addDetails?.hasRainWaterHarvestingCertificate).toLowerCase() === "yes" ||
    addDetails?.isRainwaterHarvesting === true ||
    String(addDetails?.isRainwaterHarvesting) === "true" ||
    String(addDetails?.isRainwaterHarvesting).toLowerCase() === "yes" ||
    addDetails?.rainWaterHarvesting?.hasCertificate === true ||
    String(addDetails?.rainWaterHarvesting?.hasCertificate) === "true" ||
    String(addDetails?.rainWaterHarvesting?.hasCertificate).toLowerCase() === "yes" ||
    rootRwh?.hasCertificate === true ||
    String(rootRwh?.hasCertificate) === "true" ||
    String(rootRwh?.hasCertificate).toLowerCase() === "yes";

  const hasRwhAdequacy =
    addDetails?.hasRainWaterHarvestingAdequacyCertificate === true ||
    addDetails?.hasAdequacyCertificate === true ||
    addDetails?.applyForAdequacyCertificate === true ||
    String(addDetails?.hasRainWaterHarvestingAdequacyCertificate) === "true" ||
    String(addDetails?.hasAdequacyCertificate) === "true" ||
    String(addDetails?.applyForAdequacyCertificate) === "true" ||
    addDetails?.rainWaterHarvesting?.hasAdequacyCertificate === true ||
    String(addDetails?.rainWaterHarvesting?.hasAdequacyCertificate) === "true" ||
    rootRwh?.hasAdequacyCertificate === true ||
    String(rootRwh?.hasAdequacyCertificate) === "true";

  return Boolean(hasRwh && hasRwhAdequacy);
};

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

export const isWSApprovalChecklistComplete = (applicationData, values = {}, workflowDetails) => {
  const currentState = getWSCurrentState(applicationData, workflowDetails);
  const normState = typeof currentState === "string" ? currentState.trim().toUpperCase() : "";

  // In PENDING_FOR_JE_VERIFICATION: JE must fill mandatory checklist fields (and remarks if No)
  // Satisfaction declaration is not shown to JE and not required
  if (normState === "PENDING_FOR_JE_VERIFICATION") {
    const fields = getWSApprovalChecklistFields(applicationData);
    const mandatoryFieldsAnswered = fields
      .filter((field) => field.isMandatory)
      .every((field) => values?.[field.name] === true || values?.[field.name] === false);

    if (!mandatoryFieldsAnswered) return false;

    const remarksValid = fields.every((field) => {
      if (values?.[field.name] === false && field.isMandatory) {
        const remark = values?.[`${field.name}Remarks`];
        return typeof remark === "string" && remark.trim().length > 0;
      }
      return true;
    });

    return remarksValid;
  }

  // In PENDING_FOR_EE_APPROVAL or PENDING_FOR_ZRO_APPROVAL:
  if (normState === "PENDING_FOR_EE_APPROVAL" || normState === "PENDING_FOR_ZRO_APPROVAL") {
    const jeVerified = hasJEVerifiedInWorkflow(applicationData, workflowDetails);
    // Before JE verification, EE does not need to fill anything; can forward to JE directly
    if (normState === "PENDING_FOR_EE_APPROVAL" && !jeVerified) {
      return true;
    }

    // Must select satisfaction confirmation
    if (values?.isFullySatisfied === undefined) return false;

    // When 'No — Not Completely Satisfied' is selected, remark is mandatory
    if (values?.isFullySatisfied === false) {
      const satisfactionRemark = values?.notCompletelySatisfiedRemarks || values?.completelySatisfiedRemarks;
      if (!satisfactionRemark || typeof satisfactionRemark !== "string" || !satisfactionRemark.trim()) {
        return false;
      }

      // If user selected No for any mandatory checklist question, remark for that question is also mandatory
      const fields = getWSApprovalChecklistFields(applicationData);
      const remarksValid = fields.every((field) => {
        if (values?.[field.name] === false && field.isMandatory) {
          const remark = values?.[`${field.name}Remarks`];
          return typeof remark === "string" && remark.trim().length > 0;
        }
        return true;
      });
      return remarksValid;
    }

    return true;
  }

  return true;
};

const WSApprovalChecklist = ({ applicationData, workflowDetails, showApprovalChecklist, values = {}, onChange, isReadOnly = false }) => {
  const { t } = useTranslation();
  if (!showApprovalChecklist) return null;

  const currentState = getWSCurrentState(applicationData, workflowDetails);
  const normState = typeof currentState === "string" ? currentState.trim().toUpperCase() : "";
  const isNewConn = isWSNewConnection(applicationData, workflowDetails);
  const jeVerified = hasJEVerifiedInWorkflow(applicationData, workflowDetails);
  const cameFromCitizenAction = checkCameFromCitizenAction(applicationData, workflowDetails);

  // In New Connection:
  // - PENDING_FOR_JE_VERIFICATION: Questions are editable for JE
  // - When 'No — Not Completely Satisfied' is selected: Questions are selectable condition-based
  // - Otherwise: Questions are READ-ONLY
  const isQuestionsReadOnly =
    isReadOnly ||
    !isNewConn ||
    (normState !== "PENDING_FOR_JE_VERIFICATION" && values?.isFullySatisfied !== false);

  const isDAOrZROState =
    normState === "PENDING_FOR_DEALING_ASSISTENCE_VERIFICATION" ||
    normState === "PENDING_FOR_DEALING_ASSISTANT_VERIFICATION" ||
    normState === "PENDING_FOR_DA_VERIFICATION" ||
    normState === "PENDING_FOR_ZRO_APPROVAL";

  // Show satisfaction declaration:
  // - In New Connection: show everywhere EXCEPT at PENDING_FOR_JE_VERIFICATION
  //   and EXCEPT at First EE Approval (before JE has verified)
  // - In other modules: when approval checklist data exists
  const showSatisfaction =
    isNewConn
      ? (normState !== "PENDING_FOR_JE_VERIFICATION" && !(normState === "PENDING_FOR_EE_APPROVAL" && !jeVerified))
      : hasWSApprovalChecklistData(applicationData, workflowDetails);

  // Satisfaction Declaration is editable:
  // - At PENDING_FOR_ZRO_APPROVAL
  // - At second PENDING_FOR_EE_APPROVAL (after JE verification)
  // - Whenever returning from citizen action
  const isSatisfactionReadOnly =
    isReadOnly ||
    !isNewConn ||
    !(
      normState === "PENDING_FOR_ZRO_APPROVAL" ||
      (normState === "PENDING_FOR_EE_APPROVAL" && jeVerified) ||
      cameFromCitizenAction
    );

  // Show note above Approval Checklist during first time PENDING_FOR_EE_APPROVAL
  const showFirstTimeEENote =
    isNewConn &&
    normState === "PENDING_FOR_EE_APPROVAL" &&
    !jeVerified;

  const piWithChecklist = workflowDetails?.data?.processInstances?.find(
    (pi) =>
      pi?.additionalDetails?.waterPipelineFacility !== undefined ||
      pi?.additionalDetails?.infrastructureChargesApplicable !== undefined ||
      pi?.additionalDetails?.rainWaterHarvesting !== undefined ||
      pi?.additionalDetails?.bulkConnectionVerification !== undefined
  );
  const addDetails = {
    ...(piWithChecklist?.additionalDetails || {}),
    ...(applicationData?.additionalDetails || {}),
  };

  const yesNoOptions = [
    { label: t("CORE_COMMON_YES", "Yes"), code: true },
    { label: t("CORE_COMMON_NO", "No"), code: false },
  ];

  const satisfactionOptions = [
    { label: t("Yes — Completely Satisfied"), code: true },
    { label: t("No — Not Completely Satisfied"), code: false },
  ];

  const piWithSatisfaction = workflowDetails?.data?.processInstances?.find(
    (pi) => pi?.additionalDetails?.CompletelySatisfied !== undefined || pi?.additionalDetails?.isFullySatisfied !== undefined
  );

  const rawSatisfied =
    values?.isFullySatisfied !== undefined
      ? values.isFullySatisfied
      : addDetails.CompletelySatisfied !== undefined
      ? addDetails.CompletelySatisfied
      : addDetails.isFullySatisfied !== undefined
      ? addDetails.isFullySatisfied
      : piWithSatisfaction?.additionalDetails?.CompletelySatisfied !== undefined
      ? piWithSatisfaction?.additionalDetails?.CompletelySatisfied
      : piWithSatisfaction?.additionalDetails?.isFullySatisfied !== undefined
      ? piWithSatisfaction?.additionalDetails?.isFullySatisfied
      : isDAOrZROState && jeVerified && !cameFromCitizenAction
      ? true
      : undefined;
  const satisfiedBool = parseBool(rawSatisfied);
  const isSatisfiedNoSelected = satisfiedBool === false;
  const satisfactionRemarkValue =
    values?.notCompletelySatisfiedRemarks ||
    values?.completelySatisfiedRemarks ||
    addDetails.notCompletelySatisfiedRemarks ||
    addDetails.completelySatisfiedRemarks ||
    piWithSatisfaction?.additionalDetails?.notCompletelySatisfiedRemarks ||
    piWithSatisfaction?.additionalDetails?.completelySatisfiedRemarks ||
    "";

  return (
    <React.Fragment>
      {showFirstTimeEENote && (
        <div
          style={{
            marginTop: "24px",
            marginBottom: "16px",
            padding: "12px 16px",
            backgroundColor: "#E8F1FA",
            borderLeft: "4px solid #005A9C",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#0B0C0C",
            fontSize: "16px",
            lineHeight: "1.4",
          }}
        >
          <InfoBannerIcon fill="#005A9C" style={{ minWidth: "20px", width: "20px", height: "20px" }} />
          <span>
            <strong style={{ color: "#005A9C" }}>{t("CS_COMMON_NOTE", "Note")}:</strong>{" "}
            {t("WS_FORWARD_TO_JE_TO_CHECK_DETAILS")}
          </span>
        </div>
      )}

      <div
        style={{
          marginTop: showFirstTimeEENote ? "0px" : "24px",
          padding: "16px",
          border: "1px solid #D6D5D4",
          borderRadius: "4px",
          background: "#FAFAFA",
        }}
      >
        <CardSubHeader style={{ margin: "0 0 16px", color: "#0B0C0C", fontSize: "20px" }}>{t("Approval Checklist")}</CardSubHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {getWSApprovalChecklistFields(applicationData).map((field) => {
            let rawFieldValue = values?.[field.name] !== undefined ? values[field.name] : addDetails[field.name];
            if (rawFieldValue === undefined && field.name === "rainWaterHarvesting") {
              rawFieldValue = getRainWaterHarvestingDefault(applicationData, workflowDetails);
            }
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
                  {!isQuestionsReadOnly && field.isMandatory && <span style={{ color: "#D4351C", marginLeft: "4px" }}>*</span>}
                </div>

                <RadioButtons
                  name={`ws_checklist_${field.name}`}
                  style={{
                    display: "flex",
                    gap: "2rem",
                    cursor: isQuestionsReadOnly ? "default" : "pointer",
                  }}
                  innerStyles={{
                    ...(isQuestionsReadOnly ? { pointerEvents: "none", cursor: "default" } : {}),
                  }}
                  inputStyle={{
                    ...(isQuestionsReadOnly ? { cursor: "default" } : {}),
                  }}
                  options={yesNoOptions}
                  optionsKey="label"
                  selectedOption={
                    fieldBool !== undefined
                      ? yesNoOptions.find((opt) => opt.code === fieldBool) || null
                      : null
                  }
                  disabled={isQuestionsReadOnly}
                  onSelect={(option) => {
                    if (isQuestionsReadOnly) return;
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
                      {t("Remarks")} {!isQuestionsReadOnly && field.isMandatory && <span style={{ color: "#D4351C" }}>*</span>}
                    </div>
                    {isQuestionsReadOnly ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#F3F3F3",
                          border: "1px solid #D6D5D4",
                          borderRadius: "4px",
                          color: "#0B0C0C",
                          fontSize: "14px",
                          lineHeight: "1.4",
                          wordBreak: "break-word",
                        }}
                      >
                        {remarkValue || t("CS_COMMON_NO_REMARKS", "No remarks provided")}
                      </div>
                    ) : (
                      <React.Fragment>
                        <TextArea
                          name={`${field.name}Remarks`}
                          value={remarkValue}
                          disabled={false}
                          onChange={(event) =>
                            onChange &&
                            onChange({ ...values, [`${field.name}Remarks`]: event.target.value })
                          }
                          placeholder={t("Enter mandatory remarks for selecting No")}
                          style={{
                            width: "100%",
                            minHeight: "60px",
                            backgroundColor: "#FFFFFF",
                            color: "#0B0C0C",
                            cursor: "text",
                          }}
                        />
                        {!remarkValue?.trim() && (
                          <span className="card-label-error" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
                            {t("CS_REMARK_IS_MANDATORY", "Remarks are mandatory when selecting No")}
                          </span>
                        )}
                      </React.Fragment>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showSatisfaction && (
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
            {!isSatisfactionReadOnly && <span style={{ color: "#D4351C", marginLeft: "4px" }}>*</span>}
          </div>
          <RadioButtons
            name="ws_checklist_isFullySatisfied"
            style={{
              display: "flex",
              gap: "2rem",
              cursor: isSatisfactionReadOnly ? "default" : "pointer",
            }}
            innerStyles={{
              ...(isSatisfactionReadOnly ? { pointerEvents: "none", cursor: "default" } : {}),
            }}
            inputStyle={{
              ...(isSatisfactionReadOnly ? { cursor: "default" } : {}),
            }}
            options={satisfactionOptions}
            optionsKey="label"
            selectedOption={
              satisfiedBool !== undefined
                ? satisfactionOptions.find((opt) => opt.code === satisfiedBool) || null
                : null
            }
            disabled={isSatisfactionReadOnly}
            onSelect={(option) => {
              if (isSatisfactionReadOnly) return;
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
                {t("Remarks")} {!isSatisfactionReadOnly && <span style={{ color: "#D4351C" }}>*</span>}
              </div>
              <TextArea
                name="notCompletelySatisfiedRemarks"
                value={satisfactionRemarkValue}
                disabled={isSatisfactionReadOnly}
                onChange={(event) => {
                  if (!isSatisfactionReadOnly && onChange) {
                    const val = event.target.value;
                    onChange({
                      ...values,
                      notCompletelySatisfiedRemarks: val,
                      completelySatisfiedRemarks: val,
                    });
                  }
                }}
                placeholder={isSatisfactionReadOnly ? "" : t("Enter mandatory remarks for selecting No")}
                style={{
                  width: "100%",
                  minHeight: "60px",
                  backgroundColor: isSatisfactionReadOnly ? "#F3F3F3" : "#FFFFFF",
                  color: "#0B0C0C",
                  cursor: isSatisfactionReadOnly ? "default" : "text",
                }}
              />
              {!isSatisfactionReadOnly && !satisfactionRemarkValue?.trim() && (
                <span className="card-label-error" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {t("CS_REMARK_IS_MANDATORY", "Remarks are mandatory when selecting No")}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default WSApprovalChecklist;
