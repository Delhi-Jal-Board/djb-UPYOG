import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { SubmitBar, ActionBar, Menu, CardLabel } from "@djb25/digit-ui-react-components";
import { checkCameFromCitizenAction } from "./WSApprovalChecklist";

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
  const [isDocsVerified, setIsDocsVerified] = React.useState(() => {
    if (typeof window !== "undefined" && typeof window.isDocumentsVerified !== "undefined") {
      return !!window.isDocumentsVerified;
    }
    return false;
  });

  React.useEffect(() => {
    // Sync immediately in case the event already fired before this component mounted
    if (typeof window !== "undefined" && typeof window.isDocumentsVerified !== "undefined") {
      setIsDocsVerified(!!window.isDocumentsVerified);
    }
    const handleDocVerification = (e) => {
      setIsDocsVerified(!!e.detail);
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

  const cameFromCitizenAction = React.useMemo(() => {
    return checkCameFromCitizenAction(applicationData, workflowDetails);
  }, [applicationData, workflowDetails]);

  const isWSNewConn =
    !isMutationOrReconnection &&
    (businessService?.toUpperCase() === "NEWWS1" ||
      businessService?.toUpperCase() === "NEWSW1" ||
      applicationData?.applicationType?.includes("NEW_") ||
      applicationData?.applicationNo?.includes("WS_AP") ||
      applicationData?.applicationNo?.includes("SW_AP"));

  const getActionTargetState = (act) => {
    if (typeof act?.state === "string") return act.state.toUpperCase();
    if (typeof act?.state?.state === "string") return act.state.state.toUpperCase();
    if (typeof act?.state?.applicationStatus === "string") return act.state.applicationStatus.toUpperCase();
    if (typeof act?.applicationStatus === "string") return act.applicationStatus.toUpperCase();
    return "";
  };

  const isDAAction = (act) => {
    const targetState = getActionTargetState(act);
    const actName = (act?.action || "").toUpperCase();

    if (
      targetState.includes("DEALING_ASSIST") ||
      targetState.includes("DA_VERIF") ||
      targetState === "PENDING_FOR_DEALING_ASSISTENCE_VERIFICATION" ||
      targetState === "PENDING_FOR_DEALING_ASSISTANT_VERIFICATION" ||
      targetState === "WF_PENDING_FOR_DEALING_ASSISTENCE_VERIFICATION" ||
      targetState === "WF_PENDING_FOR_DEALING_ASSISTANT_VERIFICATION"
    ) {
      return true;
    }

    if (actName.includes("DEALING_ASSIST") || actName.includes("TO_DA") || actName.includes("FORWARD_TO_DA")) {
      return true;
    }

    if ((actName === "FORWARD" || actName === "VERIFY_AND_FORWARD" || actName === "APPROVE") && !actName.includes("JE") && !actName.includes("CITIZEN")) {
      return true;
    }

    return false;
  };

  const isJEAction = (act) => {
    const targetState = getActionTargetState(act);
    const actName = (act?.action || "").toUpperCase();

    if (
      targetState.includes("JE_VERIF") ||
      targetState === "PENDING_FOR_JE_VERIFICATION" ||
      targetState === "WF_PENDING_FOR_JE_VERIFICATION"
    ) {
      return true;
    }

    if (actName.includes("TO_JE") || actName.includes("SEND_BACK_TO_JE") || actName.includes("FORWARD_TO_JE")) {
      return true;
    }

    if ((actName === "SEND_BACK" || actName === "REJECT_TO_JE") && !actName.includes("CITIZEN")) {
      return true;
    }

    return false;
  };

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

  if (isWSNewConn && completelySatisfied !== undefined) {
    if (completelySatisfied === true) {
      actions = actions?.filter((e) => !isJEAction(e) && e.action !== "SEND_BACK_TO_CITIZEN");
    } else if (completelySatisfied === false) {
      actions = actions?.filter((e) => !isDAAction(e) && e.action !== "SEND_BACK_TO_CITIZEN_DIRECT");
    }
  } else if (!isMutationOrReconnection && hasDirectSendBack && completelySatisfied !== undefined) {
    if (completelySatisfied === true) {
      actions = actions?.filter((e) => e.action !== "SEND_BACK_TO_CITIZEN");
    } else if (completelySatisfied === false) {
      actions = actions?.filter((e) => e.action !== "SEND_BACK_TO_CITIZEN_DIRECT");
    }
  }

  const currentWorkflowStatus =
    workflowDetails?.data?.actionState?.state ||
    workflowDetails?.data?.processInstances?.[0]?.state?.state ||
    applicationData?.applicationStatus ||
    applicationData?.status;
  const isConnectionActivationState =
    currentWorkflowStatus === "PENDING_FOR_CONNECTION_ACTIVATION" ||
    String(currentWorkflowStatus).includes("CONNECTION_ACTIVATION");

  let isSubmitDisabled = false;
  if (isConnectionActivationState) {
    isSubmitDisabled = false;
  } else if (isWSNewConn) {
    if (completelySatisfied === true) {
      if (cameFromCitizenAction) {
        isSubmitDisabled = !isDocsVerified;
      } else {
        isSubmitDisabled = false;
      }
    } else if (completelySatisfied === false) {
      isSubmitDisabled = false;
    } else {
      isSubmitDisabled = true;
    }
  } else {
    isSubmitDisabled = !isDocsVerified;
  }

  actions?.forEach((action) => {
    if (isDAAction(action) && !action.forcedName) {
      const daKey = "WF_PENDING_FOR_DEALING_ASSISTENCE_VERIFICATION";
      const transDA = t(daKey);
      const defaultKey = `WF_EMPLOYEE_${businessService?.toUpperCase()}_${action?.action}`;
      const transDefault = t(defaultKey);
      if (transDefault && transDefault !== defaultKey) {
        // default translation exists
      } else if (transDA && transDA !== daKey) {
        action.forcedName = daKey;
      }
    }
    if (isJEAction(action) && !action.forcedName) {
      const jeKey = "WF_PENDING_FOR_JE_VERIFICATION";
      const transJE = t(jeKey);
      const defaultKey = `WF_EMPLOYEE_${businessService?.toUpperCase()}_${action?.action}`;
      const transDefault = t(defaultKey);
      if (transDefault && transDefault !== defaultKey) {
        // default translation exists
      } else if (transJE && transJE !== jeKey) {
        action.forcedName = jeKey;
      }
    }
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
                disabled={isConnectionActivationState ? false : (isSubmitDisabled || !isApprovalChecklistValid)}
              />
            ) : (
              <CardLabel style={{ color: "red", font: "30px", fontWeight: "bold" }}>{`${t("EW_ALERT_ANOTHER_VENDOR")}`}</CardLabel>
            )
          ) : (
            <SubmitBar
              ref={menuRef}
              label={t("WF_TAKE_ACTION")}
              onSubmit={() => setDisplayMenu(!displayMenu)}
              disabled={isConnectionActivationState ? false : (isSubmitDisabled || !isApprovalChecklistValid)}
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
