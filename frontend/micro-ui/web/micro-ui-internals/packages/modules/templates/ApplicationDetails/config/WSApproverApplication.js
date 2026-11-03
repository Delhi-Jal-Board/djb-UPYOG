import { Dropdown, UploadFile } from "@djb25/digit-ui-react-components";
import React from "react";

export const configWSApproverApplication = ({
  t,
  action,
  approvers,
  selectedApprover,
  setSelectedApprover,
  selectFile,
  uploadedFile,
  setUploadedFile,
  assigneeLabel,
  businessService,
  error,
  isReasonRequiredAction,
  selectedReason,
  setSelectedReason,
  otherReasonText,
  setOtherReasonText,
}) => {
  let checkCondtions = true;
  if (action?.action?.includes("SEND_BACK") || action?.action == "APPROVE_FOR_CONNECTION" || action?.action === "ACTIVATE_CONNECTION") checkCondtions = false;
  if (action.isTerminateState) checkCondtions = false;

  const reasonOptions = [
    { code: "INCOMPLETE_DOCUMENTS", name: "Incomplete / Incorrect Documents", i18nKey: "WS_MUTATION_REASON_INCOMPLETE_DOCUMENTS" },
    { code: "MISMATCH_DETAILS", name: "Mismatch in Owner / Consumer Details", i18nKey: "WS_MUTATION_REASON_MISMATCH_DETAILS" },
    { code: "INVALID_PROOF", name: "Invalid / Unverified Proof Provided", i18nKey: "WS_MUTATION_REASON_INVALID_PROOF" },
    { code: "OTHER", name: "Other", i18nKey: "WS_MUTATION_REASON_OTHER" },
  ];

  const commentsField = isReasonRequiredAction
    ? [
        {
          label: t("WF_REASON_LABEL") || t("Reason"),
          isMandatory: false,
          populators: (
            <Dropdown
              option={reasonOptions}
              autoComplete="off"
              optionKey="name"
              id="mutationActionReason"
              select={(val) => {
                setSelectedReason(val);
              }}
              selected={selectedReason}
              t={t}
              placeholder={t("WF_SELECT_REASON_PLACEHOLDER") || "Select Reason"}
            />
          ),
        },
        {
          label: t("WF_COMMON_COMMENTS") && t("WF_COMMON_COMMENTS") !== "WF_COMMON_COMMENTS" ? t("WF_COMMON_COMMENTS") : "Comments",
          type: "textarea",
          populators: {
            name: "comments",
          },
        },
      ]
    : [
        {
          label: t("WF_COMMON_COMMENTS") && t("WF_COMMON_COMMENTS") !== "WF_COMMON_COMMENTS" ? t("WF_COMMON_COMMENTS") : "Comments",
          type: "textarea",
          populators: {
            name: "comments",
          },
        },
      ];

  const isActivate = action?.action === "ACTIVATE_CONNECTION";

  const getHeadingLabel = () => {
    if (isActivate) {
      const translated = t("WF_APPROVE_APPLICATION");
      if (translated && translated !== "WF_APPROVE_APPLICATION") return translated;
      return "Approve Application";
    }
    return `WF_${action?.action}_APPLICATION`;
  };

  const getSubmitLabel = () => {
    if (isActivate) {
      const translated = t("WF_APPROVE_CONNECTION");
      if (translated && translated !== "WF_APPROVE_CONNECTION") return translated;
      const translatedAction = t("WF_EMPLOYEE_NEWWS1_ACTIVATE_CONNECTION");
      if (translatedAction && translatedAction !== "WF_EMPLOYEE_NEWWS1_ACTIVATE_CONNECTION" && translatedAction !== "Activate Connection") {
        return translatedAction;
      }
      return "Approve Connection";
    }
    return `WF_${businessService?.toUpperCase()}_${action?.action}`;
  };

  return {
    label: {
      heading: getHeadingLabel(),
      submit: getSubmitLabel(),
      cancel: "CS_COMMON_CANCEL",
    },
    form: [
      {
        body: [
          ...commentsField,
          /*
          {
            label: t("WS_APPROVAL_CHECKLIST_BUTTON_UP_FILE"),
            populators: (
              <UploadFile
                id={"workflow-doc"}
                accept=".jpg,.pdf,.png,.jpeg"
                onUpload={selectFile}
                onDelete={() => {
                  setUploadedFile(null);
                }}
                message={uploadedFile ? `1 ${t(`ES_PT_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)}
                error={error}
                iserror={error}
                showHintBelow={true}
                hintText={"WS_HINT_TEXT_LABEL"}
              />
            ),
          },
          */
        ],
      },
    ],
  };
};
