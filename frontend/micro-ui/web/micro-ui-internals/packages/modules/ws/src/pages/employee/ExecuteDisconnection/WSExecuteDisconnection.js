import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
import { Modal, Toast, ButtonSelector, Loader } from "@djb25/digit-ui-react-components";
import FitterSandbox from "../../../../../templates/ApplicationDetails/Modal/FitterSandbox";

const WSExecuteDisconnection = () => {
  const { t } = useTranslation();
  let { state } = useLocation();
  const applicationData = state?.applicationData;
  const action = state?.action;
  const serviceType = state?.serviceType || (applicationData?.applicationNo?.includes("WS") ? "WATER" : "SEWERAGE");
  const history = useHistory();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [payload, setPayload] = useState(null);
  const [isEnableLoader, setIsEnableLoader] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const {
    isLoading: updatingApplication,
    isError: updateApplicationError,
    data: updateResponse,
    error: updateError,
    mutate,
  } = Digit.Hooks.ws.useWSApplicationActions(serviceType);

  const onSubmitAction = (data) => {
    setPayload(data);
    setShowConfirmation(true);
  };

  const executeAction = () => {
    setShowConfirmation(false);
    setIsEnableLoader(true);
    if (mutate) {
      mutate(payload, {
        onError: (error, variables) => {
          setIsEnableLoader(false);
          setShowToast({ key: "error", message: error?.message ? error.message : error });
        },
        onSuccess: (data, variables) => {
          setIsEnableLoader(false);
          setShowToast({ key: false, message: "Disconnection Executed Successfully" });
          setTimeout(() => {
            history.push(`/digit-ui/employee/ws/application-details?applicationNumber=${applicationData?.applicationNo}&service=${serviceType}`);
          }, 3000);
        },
      });
    }
  };

  if (isEnableLoader || updatingApplication) {
    return <Loader />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <FitterSandbox
        t={t}
        action={action}
        applicationData={applicationData}
        submitAction={onSubmitAction}
        closeModal={() => history.goBack()}
      />

      {showConfirmation && (
        <Modal
          headerBarMain={<h1 className="heading-m">Confirmation</h1>}
          headerBarEnd={<div onClick={() => setShowConfirmation(false)} style={{ cursor: "pointer", fontSize: "16px", padding: "10px" }}>✕</div>}
          actionCancelLabel="Cancel"
          actionCancelOnSubmit={() => setShowConfirmation(false)}
          actionSaveLabel="Yes"
          actionSaveOnSubmit={executeAction}
        >
          <div style={{ padding: "16px" }}>
            <p style={{ fontSize: "16px" }}>Are you sure you want to execute disconnection?</p>
          </div>
        </Modal>
      )}

      {showToast && <Toast error={showToast.key === "error"} label={t(showToast?.message)} onClose={() => setShowToast(null)} />}
    </div>
  );
};

export default WSExecuteDisconnection;
