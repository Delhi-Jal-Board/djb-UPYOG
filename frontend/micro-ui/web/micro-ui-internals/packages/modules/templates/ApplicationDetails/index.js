import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";

import { Loader, Modal } from "@djb25/digit-ui-react-components";

import ActionModal from "./Modal";

import { useHistory, useParams } from "react-router-dom";
import ApplicationDetailsContent from "./components/ApplicationDetailsContent";
import ApplicationDetailsToast from "./components/ApplicationDetailsToast";
import ApplicationDetailsActionBar from "./components/ApplicationDetailsActionBar";
import ApplicationDetailsWarningPopup from "./components/ApplicationDetailsWarningPopup";
import {
  getWSApprovalChecklistFields,
  getWSCurrentState,
  isWSApprovalChecklistComplete,
  isWSApprovalChecklistState,
  isWSApprovalChecklistEditableState,
  isWSApprovalChecklistReadOnlyState,
  parseBool,
  getRainWaterHarvestingDefault,
  checkCameFromCitizenAction,
} from "./components/WSApprovalChecklist";

const ApplicationDetails = (props) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const state = Digit.ULBService.getStateId();
  const { t } = useTranslation();
  const history = useHistory();
  let { id: applicationNumber } = useParams();
  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [isWarningPop, setWarningPopUp] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [approvalChecklist, setApprovalChecklist] = useState({});

  const {
    applicationDetails,
    showToast,
    setShowToast,
    isLoading,
    isDataLoading,
    applicationData,
    mutate,
    nocMutation,
    workflowDetails,
    id,
    businessService,
    closeToast,
    moduleCode,
    timelineStatusPrefix,
    forcedActionPrefix,
    statusAttribute,
    ActionBarStyle,
    MenuStyle,
    paymentsList,
    showTimeLine = true,
    oldValue,
    isInfoLabel = false,
    clearDataDetails,
    isAction = false,
  } = props;

  const currentWorkflowState = getWSCurrentState(applicationData, workflowDetails);
  const isChecklistEditable = moduleCode === "WS" && isWSApprovalChecklistEditableState(applicationData, workflowDetails);
  const isChecklistReadOnly = moduleCode === "WS" && isWSApprovalChecklistReadOnlyState(applicationData, workflowDetails);
  const showApprovalChecklist = isChecklistEditable || isChecklistReadOnly;

  // While workflow is still loading, treat the checklist as valid so the button isn't blocked during load.
  // Once loaded, require all mandatory fields to be checked when in editable state.
  const approvalChecklistValid =
    workflowDetails?.isLoading ||
    !isChecklistEditable ||
    isWSApprovalChecklistComplete(applicationData, approvalChecklist, workflowDetails);

  // Track the last seeded combination so we don't re-seed (and wipe user changes)
  // every time workflowDetails reloads and currentWorkflowState flickers.
  const seededKeyRef = useRef(null);

  useEffect(() => {
    const seedKey = `${applicationData?.applicationNo}__${currentWorkflowState}`;

    if (showApprovalChecklist) {
      // Only seed from server data once per application+state combo.
      // After the initial seed the user's checkbox interactions drive the state.
      if (seededKeyRef.current !== seedKey) {
        seededKeyRef.current = seedKey;
        const piWithChecklist = workflowDetails?.data?.processInstances?.find(
          (pi) =>
            pi?.additionalDetails?.waterPipelineFacility !== undefined ||
            pi?.additionalDetails?.infrastructureChargesApplicable !== undefined ||
            pi?.additionalDetails?.rainWaterHarvesting !== undefined ||
            pi?.additionalDetails?.bulkConnectionVerification !== undefined
        );
        const sourceDetails =
          applicationData?.additionalDetails ||
          piWithChecklist?.additionalDetails ||
          {};
        const initialChecklist = getWSApprovalChecklistFields(applicationData).reduce((values, field) => {
          const parsedVal = parseBool(sourceDetails?.[field.name]);
          if (parsedVal !== undefined) {
            values[field.name] = parsedVal;
          } else if (field.name === "rainWaterHarvesting") {
            values[field.name] = getRainWaterHarvestingDefault(applicationData);
          }
          if (sourceDetails?.[`${field.name}Remarks`]) {
            values[`${field.name}Remarks`] = sourceDetails?.[`${field.name}Remarks`];
          }
          return values;
        }, {});
        const piWithSatisfaction = workflowDetails?.data?.processInstances?.find(
          (pi) => pi?.additionalDetails?.CompletelySatisfied !== undefined || pi?.additionalDetails?.isFullySatisfied !== undefined
        );
        const satDetails =
          applicationData?.additionalDetails ||
          piWithSatisfaction?.additionalDetails ||
          sourceDetails ||
          {};
        const cameFromCitizenAction = checkCameFromCitizenAction(applicationData, workflowDetails);
        if (!cameFromCitizenAction) {
          const rawSatisfied =
            satDetails?.CompletelySatisfied !== undefined
              ? satDetails?.CompletelySatisfied
              : satDetails?.isFullySatisfied !== undefined
              ? satDetails?.isFullySatisfied
              : piWithSatisfaction?.additionalDetails?.CompletelySatisfied !== undefined
              ? piWithSatisfaction?.additionalDetails?.CompletelySatisfied
              : piWithSatisfaction?.additionalDetails?.isFullySatisfied;
          const parsedSatisfied = parseBool(rawSatisfied);
          if (parsedSatisfied !== undefined) {
            initialChecklist.isFullySatisfied = parsedSatisfied;
          }
        }
        const satRemark =
          satDetails?.notCompletelySatisfiedRemarks ||
          satDetails?.completelySatisfiedRemarks ||
          piWithSatisfaction?.additionalDetails?.notCompletelySatisfiedRemarks ||
          piWithSatisfaction?.additionalDetails?.completelySatisfiedRemarks;
        if (satRemark) {
          initialChecklist.notCompletelySatisfiedRemarks = satRemark;
          initialChecklist.completelySatisfiedRemarks = satRemark;
        }
        setApprovalChecklist(initialChecklist);
      }
    } else {
      // Different application or state no longer requires the checklist — clear it.
      if (seededKeyRef.current !== null) {
        seededKeyRef.current = null;
        setApprovalChecklist({});
      }
    }
  }, [applicationData?.applicationNo, currentWorkflowState, showApprovalChecklist]);

  useEffect(() => {
    if (showToast) {
      workflowDetails.revalidate();
    }
  }, [showToast]);

  function onActionSelect(action) {
    sessionStorage.setItem("SELECTED_ACTION", action?.action);
    if (action) {
      if (action?.action === "ACTIVATE_CONNECTION" && window.location.href.includes("/employee/ws")) {
        setSelectedAction(action);
        setShowModal(true);
        setDisplayMenu(false);
        return;
      }
      if (action?.action === "PAY" && !action?.redirectionUrl && !action?.redirectionUrll) {
        if (window.location.href.includes("/employee")) {
            history.push(`/digit-ui/employee/payment/collect/${businessService}/${applicationNumber}?tenantId=${tenantId}`);
        } else {
            history.push(`/digit-ui/citizen/payment/my-bills/${businessService}/${applicationNumber}?tenantId=${tenantId}`);
        }
        return;
      }
      if (action?.isToast) {
        setShowToast({ key: "error", error: { message: action?.toastMessage } });
        setTimeout(closeToast, 5000);
      } else if (action?.isWarningPopUp) {
        setWarningPopUp(true);
      } else if (action?.redirectionUrll) {
        if (action?.action === "ACTIVATE_CONNECTION" || action?.redirectionUrll?.action === "ACTIVATE_CONNECTION") {
          setShowModal(true);
        } else if (action?.redirectionUrll?.action === "RE-SUBMIT-APPLICATION") {
          history.push(`${action?.redirectionUrll?.pathname}`, { data: action?.redirectionUrll?.state });
        } else {
          window.location.assign(`${window.location.origin}/digit-ui/employee/payment/collect/${action?.redirectionUrll?.pathname}`);
        }
      } else if (!action?.redirectionUrl) {
        setShowModal(true);
      } else {
        history.push({
          pathname: action.redirectionUrl?.pathname,
          state: { ...action.redirectionUrl?.state },
        });
      }
    }
    setSelectedAction(action);
    setDisplayMenu(false);
  }

  const queryClient = useQueryClient();

  const closeModal = () => {
    setSelectedAction(null);
    setShowModal(false);
  };

  const closeWarningPopup = () => {
    setWarningPopUp(false);
  };

  const executeSubmitAction = async (data, nocData = false, isOBPS = {}) => {
    if (
      data?.Property?.workflow?.comment?.length == 0 ||
      data?.Licenses?.[0]?.comment?.length == 0 ||
      data?.WaterConnection?.comment?.length == 0 ||
      data?.SewerageConnection?.comment?.length == 0 ||
      data?.BPA?.comment?.length == 0
    ) {
      alert("Please fill in the comments before submitting");
    } else {
      setIsEnableLoader(true);
      if (typeof data?.customFunctionToExecute === "function") {
        data?.customFunctionToExecute({ ...data });
      }
      if (nocData !== false && nocMutation) {
        const nocPrmomises = nocData?.map((noc) => {
          return nocMutation?.mutateAsync(noc);
        });
        try {
          setIsEnableLoader(true);
          const values = await Promise.all(nocPrmomises);
          values &&
            values.map((ob) => {
              Digit.SessionStorage.del(ob?.Noc?.[0]?.nocType);
            });
        } catch (err) {
          setIsEnableLoader(false);
          let errorValue = err?.response?.data?.Errors?.[0]?.code
            ? t(err?.response?.data?.Errors?.[0]?.code)
            : err?.response?.data?.Errors?.[0]?.message || err;
          closeModal();
          setShowToast({ key: "error", error: { message: errorValue } });
          setTimeout(closeToast, 5000);
          return;
        }
      }
      if (mutate) {
        setIsEnableLoader(true);
        mutate(data, {
          onError: (error, variables) => {
            setIsEnableLoader(false);
            setShowToast({ key: "error", error });
            setTimeout(closeToast, 5000);
          },
          onSuccess: (data, variables) => {
            sessionStorage.removeItem("WS_SESSION_APPLICATION_DETAILS");
            setIsEnableLoader(false);
            if (
              moduleCode?.includes("WS") &&
              (selectedAction?.action === "ACTIVATE_CONNECTION" ||
                data?.WaterConnection?.[0]?.applicationStatus === "CONNECTION_ACTIVATED" ||
                data?.SewerageConnections?.[0]?.applicationStatus === "CONNECTION_ACTIVATED")
            ) {
              const waterConnection = data?.WaterConnection?.[0] || data?.WaterConnection || variables?.WaterConnection;
              const sewerageConnection = data?.SewerageConnections?.[0] || data?.SewerageConnections || variables?.SewerageConnection;
              const activatedConn = waterConnection || sewerageConnection || {};
              const connNo =
                activatedConn?.connectionNo ||
                activatedConn?.connectionNumber ||
                data?.connectionNo ||
                data?.connectionNumber ||
                "";
              const appNo = activatedConn?.applicationNo || applicationNumber;
              const isCitizen = window.location.href.includes("/citizen");
              const basePath = isCitizen ? "/digit-ui/citizen/ws" : "/digit-ui/employee/ws";
              const service = waterConnection ? "WATER" : sewerageConnection ? "SEWERAGE" : "WATER";
              history.push({
                pathname: `${basePath}/ws-response`,
                search: `?${service === "WATER" ? "applicationNumber" : "applicationNumber1"}=${appNo}&service=${service}&connectionNo=${encodeURIComponent(connNo)}&action=ACTIVATE_CONNECTION`,
                state: { connectionNo: connNo, data: data },
              });
              return;
            }
            if (isOBPS?.bpa) {
              data.selectedAction = selectedAction;
              history.replace(`/digit-ui/employee/obps/response`, { data: data });
            }
            if (isOBPS?.isStakeholder) {
              data.selectedAction = selectedAction;
              history.push(`/digit-ui/employee/obps/stakeholder-response`, { data: data });
            }
            if (isOBPS?.isNoc) {
              history.push(`/digit-ui/employee/noc/response`, { data: data });
            }
            if (data?.Amendments?.length > 0) {
              //RAIN-6981 instead just show a toast here with appropriate message
              //show toast here and return
              //history.push("/digit-ui/employee/ws/response-bill-amend", { status: true, state: data?.Amendments?.[0] })

              if (variables?.AmendmentUpdate?.workflow?.action.includes("SEND_BACK")) {
                setShowToast({ key: "success", label: t("ES_MODIFYSWCONNECTION_SEND_BACK_UPDATE_SUCCESS") });
              } else if (variables?.AmendmentUpdate?.workflow?.action.includes("RE-SUBMIT")) {
                setShowToast({ key: "success", label: t("ES_MODIFYSWCONNECTION_RE_SUBMIT_UPDATE_SUCCESS") });
              } else if (variables?.AmendmentUpdate?.workflow?.action.includes("APPROVE")) {
                setShowToast({ key: "success", label: t("ES_MODIFYSWCONNECTION_APPROVE_UPDATE_SUCCESS") });
              } else if (variables?.AmendmentUpdate?.workflow?.action.includes("REJECT")) {
                setShowToast({ key: "success", label: t("ES_MODIFYWSCONNECTION_REJECT_UPDATE_SUCCESS") });
              }
              return;
            }
            setShowToast({ key: "success", action: selectedAction });
            clearDataDetails && setTimeout(clearDataDetails, 3000);
            setTimeout(closeToast, 5000);
            queryClient.clear();
            queryClient.refetchQueries("APPLICATION_SEARCH");
            //push false status when reject
          },
        });
      }
      closeModal();
    }
  };

  const submitAction = async (data, nocData = false, isOBPS = {}) => {
    if (moduleCode?.includes("WS")) {
      const actionStr = selectedAction?.action || "";
      if (actionStr === "INITIATE" || actionStr === "EXECUTE_DISCONNECTION") {
        setShowConfirmation({ data, nocData, isOBPS });
        return;
      }
    }

    return executeSubmitAction(data, nocData, isOBPS);
  };

  const actionName = selectedAction?.action?.replace(/[ _-]+/g, " ").toLowerCase() || "this action";

  const confirmSubmitAction = () => {
    const confirmationData = showConfirmation;
    setShowConfirmation(false);
    return executeSubmitAction(confirmationData.data, confirmationData.nocData, confirmationData.isOBPS);
  };

  if (isLoading || isEnableLoader) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {!isLoading ? (
        <React.Fragment>
          <ApplicationDetailsContent
            applicationDetails={applicationDetails}
            id={id}
            workflowDetails={workflowDetails}
            isDataLoading={isDataLoading}
            applicationData={applicationData}
            businessService={businessService}
            timelineStatusPrefix={timelineStatusPrefix}
            statusAttribute={statusAttribute}
            paymentsList={paymentsList}
            showTimeLine={showTimeLine}
            oldValue={oldValue}
            isInfoLabel={isInfoLabel}
            approvalChecklist={approvalChecklist}
            onApprovalChecklistChange={setApprovalChecklist}
            showApprovalChecklist={showApprovalChecklist}
            isApprovalChecklistReadOnly={isChecklistReadOnly}
          />
          {showModal ? (
            <ActionModal
              t={t}
              action={selectedAction}
              tenantId={tenantId}
              state={state}
              id={applicationNumber}
              applicationDetails={applicationDetails}
              applicationData={applicationDetails?.applicationData || applicationData}
              closeModal={closeModal}
              submitAction={submitAction}
              actionData={workflowDetails?.data?.timeline}
              businessService={businessService}
              approvalChecklist={approvalChecklist}
              showApprovalChecklist={isChecklistEditable}
              moduleCode={moduleCode}
              cardFormWrapperClassName={"modal-form"}
            />
          ) : null}
          {showConfirmation ? (
            <Modal
              headerBarMain={<h1 className="heading-m">Confirmation</h1>}
              headerBarEnd={<div onClick={() => setShowConfirmation(false)} style={{ cursor: "pointer", fontSize: "16px", padding: "10px" }}>✕</div>}
              actionCancelLabel="Cancel"
              actionCancelOnSubmit={() => setShowConfirmation(false)}
              actionSaveLabel="Yes"
              actionSaveOnSubmit={confirmSubmitAction}
            >
              <div style={{ padding: "16px" }}>
                <p style={{ fontSize: "16px" }}>Are you sure you want to {actionName} ?</p>
              </div>
            </Modal>
          ) : null}
          {isWarningPop ? (
            <ApplicationDetailsWarningPopup
              action={selectedAction}
              workflowDetails={workflowDetails}
              businessService={businessService}
              isWarningPop={isWarningPop}
              closeWarningPopup={closeWarningPopup}
            />
          ) : null}
          <ApplicationDetailsToast t={t} showToast={showToast} closeToast={closeToast} businessService={businessService} />
          <ApplicationDetailsActionBar
            isAction={isAction} // isAction is added to enable or disable the action bar
            workflowDetails={workflowDetails}
            displayMenu={displayMenu}
            onActionSelect={onActionSelect}
            setDisplayMenu={setDisplayMenu}
            businessService={businessService}
            forcedActionPrefix={forcedActionPrefix}
            ActionBarStyle={ActionBarStyle}
            MenuStyle={MenuStyle}
            applicationDetails={applicationDetails}
            applicationData={applicationDetails?.applicationData || applicationData}
            isApprovalChecklistValid={approvalChecklistValid}
            approvalChecklist={approvalChecklist}
            showApprovalChecklist={isChecklistEditable}
          />
        </React.Fragment>
      ) : (
        <Loader />
      )}
    </React.Fragment>
  );
};

export default ApplicationDetails;
