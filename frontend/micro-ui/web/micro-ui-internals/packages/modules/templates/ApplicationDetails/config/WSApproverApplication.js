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
  if (action?.action?.includes("SEND_BACK") || action?.action == "APPROVE_FOR_CONNECTION") checkCondtions = false;
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
          label: t("WF_COMMON_COMMENTS"),
          type: "textarea",
          populators: {
            name: "comments",
          },
        },
      ]
    : [
        {
          label: t("WF_COMMON_COMMENTS"),
          type: "textarea",
          populators: {
            name: "comments",
          },
        },
      ];

  return {
    label: {
      heading: `WF_${action?.action}_APPLICATION`,
      submit: `WF_${businessService?.toUpperCase()}_${action?.action}`,
      cancel: "CS_COMMON_CANCEL",
    },
    form: [
      {
        body: [
          ...commentsField,
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
        ],
      },
    ],
  };
};
