import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { SubmitBar, ActionBar, Menu, CardLabel } from "@djb25/digit-ui-react-components";

function ApplicationDetailsActionBar({
  workflowDetails,
  displayMenu,
  onActionSelect,
  setDisplayMenu,
  businessService,
  forcedActionPrefix,
  ActionBarStyle = {},
  MenuStyle = {},
  isAction,
  applicationDetails,
  applicationData,
  isApprovalChecklistValid = false,
  approvalChecklist = {},
  showApprovalChecklist,
}) {
  const { t } = useTranslation();
  let user = Digit.UserService.getUser();
  const menuRef = React.useRef();
  const [isSubmitDisabled, setIsSubmitDisabled] = React.useState(() => {
    if (typeof window !== "undefined" && typeof window.isDocumentsVerified !== "undefined") {
      return !window.isDocumentsVerified;
    }
    return false;
  });

  React.useEffect(() => {
    // Sync immediately in case the event already fired before this component mounted
    if (typeof window !== "undefined" && typeof window.isDocumentsVerified !== "undefined") {
      setIsSubmitDisabled(!window.isDocumentsVerified);
    }
    const handleDocVerification = (e) => {
      setIsSubmitDisabled(!e.detail);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("DOCUMENTS_VERIFIED", handleDocVerification);
      return () => {
        window.removeEventListener("DOCUMENTS_VERIFIED", handleDocVerification);
        // Reset so stale state doesn't carry over to other pages
        delete window.isDocumentsVerified;
      };
    }
  }, []);
  if (window.location.href.includes("/obps") || window.location.href.includes("/noc")) {
    const userInfos = sessionStorage.getItem("Digit.citizen.userRequestObject");
    const userInfo = userInfos ? JSON.parse(userInfos) : {};
    user = userInfo?.value;
  }
  const userRoles = user?.info?.roles?.map((e) => e.code);
  let isSingleButton = false;
  let isMenuBotton = false;
  let actions =
    workflowDetails?.data?.actionState?.nextActions?.filter((e) => {
      return userRoles?.some((role) => e.roles?.includes(role)) || !e.roles;
    }) ||
    workflowDetails?.data?.nextActions?.filter((e) => {
      return userRoles?.some((role) => e.roles?.includes(role)) || !e.roles;
    });

  const isMutationOrReconnection =
    applicationDetails?.applicationData?.applicationType?.includes("MUTATION") ||
    applicationData?.applicationType?.includes("MUTATION") ||
    businessService?.toUpperCase()?.includes("MUTATION") ||
    applicationData?.applicationNo?.includes("MUT") ||
    applicationDetails?.applicationData?.applicationType?.includes("RECONNECT") ||
    applicationData?.applicationType?.includes("RECONNECT") ||
    businessService?.toUpperCase()?.includes("RECONNECTION") ||
    applicationData?.applicationNo?.includes("RC") ||
    applicationData?.reconnectRequest;

  const hasDirectSendBack = actions?.some((e) => e.action === "SEND_BACK_TO_CITIZEN_DIRECT");

  const completelySatisfied =
    isMutationOrReconnection
      ? undefined
      : approvalChecklist?.isFullySatisfied !== undefined
      ? approvalChecklist?.isFullySatisfied
      : showApprovalChecklist
      ? undefined
      : applicationDetails?.applicationData?.additionalDetails?.CompletelySatisfied !== undefined
      ? applicationDetails?.applicationData?.additionalDetails?.CompletelySatisfied
      : applicationData?.additionalDetails?.CompletelySatisfied;

  if (!isMutationOrReconnection && hasDirectSendBack && completelySatisfied !== undefined) {
    if (completelySatisfied === true) {
      actions = actions?.filter((e) => e.action !== "SEND_BACK_TO_CITIZEN");
    } else if (completelySatisfied === false) {
      actions = actions?.filter((e) => e.action !== "SEND_BACK_TO_CITIZEN_DIRECT");
    }
  }

  actions?.forEach((action) => {
    if (action?.action === "SEND_BACK_TO_CITIZEN" && !action.forcedName) {
      const primaryKey = forcedActionPrefix ? `${forcedActionPrefix}_SEND_BACK_TO_CITIZEN` : `WF_EMPLOYEE_${businessService?.toUpperCase()}_SEND_BACK_TO_CITIZEN`;
      const translatedPrimary = t(primaryKey);
      if (translatedPrimary && translatedPrimary !== primaryKey) {
        action.forcedName = primaryKey;
      } else {
        const fallbackKeys = [
          "WF_EMPLOYEE_NEWWS1_SEND_BACK_TO_CITIZEN",
          "WF_EMPLOYEE_WS_SEND_BACK_TO_CITIZEN",
          "WF_SEND_BACK_TO_CITIZEN",
          "ES_COMMON_SEND_BACK",
          "SEND_BACK_TO_CITIZEN",
        ];
        for (const fbKey of fallbackKeys) {
          const trans = t(fbKey);
          if (trans && trans !== fbKey) {
            action.forcedName = fbKey;
            break;
          }
        }
      }
    }
  });

  const closeMenu = () => {
    setDisplayMenu(false);
  };
  Digit.Hooks.useClickOutside(menuRef, closeMenu, displayMenu);

  if (
    ((window.location.href.includes("/obps") || window.location.href.includes("/noc")) && actions?.length == 1) ||
    (actions?.[0]?.redirectionUrl?.pathname.includes("/pt/property-details/") && actions?.length == 1)
  ) {
    isMenuBotton = false;
    isSingleButton = true;
  } else if (actions?.length > 0) {
    isMenuBotton = true;
    isSingleButton = false;
  }
  const Session = Digit.SessionStorage.get("User");
  const uuid = Session?.info?.uuid;
  const modified = applicationDetails?.applicationData?.auditDetails?.lastModifiedBy;

  return (
    <React.Fragment>
      {!workflowDetails?.isLoading && isMenuBotton && !isSingleButton && !isAction && (
        <ActionBar style={{ ...ActionBarStyle }}>
          {displayMenu && (workflowDetails?.data?.actionState?.nextActions || workflowDetails?.data?.nextActions) ? (
            <Menu
              localeKeyPrefix={forcedActionPrefix || `WF_EMPLOYEE_${businessService?.toUpperCase()}`}
              options={actions}
              optionKey={"action"}
              t={t}
              onSelect={onActionSelect}
              style={MenuStyle}
            />
          ) : null}
          {businessService === "ewst" ? (
            modified === uuid || modified == null ? (
              <SubmitBar
                ref={menuRef}
                label={t("WF_TAKE_ACTION")}
                onSubmit={() => setDisplayMenu(!displayMenu)}
                disabled={isSubmitDisabled || !isApprovalChecklistValid}
              />
            ) : (
              <CardLabel style={{ color: "red", font: "30px", fontWeight: "bold" }}>{`${t("EW_ALERT_ANOTHER_VENDOR")}`}</CardLabel>
            )
          ) : (
            <SubmitBar
              ref={menuRef}
              label={t("WF_TAKE_ACTION")}
              onSubmit={() => setDisplayMenu(!displayMenu)}
              disabled={isSubmitDisabled || !isApprovalChecklistValid}
            />
          )}
          {/* <SubmitBar ref={menuRef} label={t("WF_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} /> */}
        </ActionBar>
      )}
      {!workflowDetails?.isLoading && !isMenuBotton && isSingleButton && !isAction && (
        <ActionBar style={{ ...ActionBarStyle }}>
          <button
            style={{ color: "#FFFFFF", fontSize: "18px" }}
            className={"submit-bar"}
            name={actions?.[0]?.action}
            value={actions?.[0]?.action}
            onClick={(e) => {
              onActionSelect(actions?.[0] || {});
            }}
          >
            {t(`${forcedActionPrefix || `WF_EMPLOYEE_${businessService?.toUpperCase()}`}_${actions?.[0]?.action}`)}
          </button>
        </ActionBar>
      )}
    </React.Fragment>
  );
}

export default ApplicationDetailsActionBar;
