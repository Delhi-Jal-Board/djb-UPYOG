import React, { useState, useEffect } from "react";
import {
  Card,
  CardSubHeader,
  StatusTable,
  Row,
  SubmitBar,
  ActionBar,
  Menu,
  Loader,
  Modal,
  TextArea,
  CardLabel,
  Toast,
  Banner,
  CardText,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useLocation, useHistory } from "react-router-dom";
const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const Close = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF">
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
);

const CloseBtn = (props) => {
  return (
    <div className="icon-bg-secondary" onClick={props.onClick}>
      <Close />
    </div>
  );
};

const WSZROVerificationDetails = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const [displayMenu, setDisplayMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [comments, setComments] = useState("");
  const [toast, setToast] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    let timer;
    if (isSuccess) {
      timer = setTimeout(() => {
        history.push("/digit-ui/employee/ws/zro-application");
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, history]);

  const caseDataFromState = location.state?.caseData;
  const searchParams = new URLSearchParams(location.search);
  const connectionNumber = searchParams.get("connectionNumber");
  const tenantId = searchParams.get("tenantId") || Digit.ULBService.getCurrentTenantId();

  const { isLoading, data } = Digit.Hooks.ws.useWSZROVerification({
    tenantId,
    filters: { connectionNo: connectionNumber, status: "PENDING", offset: 0, limit: 20 },
    config: {
      enabled: !caseDataFromState && !!connectionNumber,
      select: (res) => res?.cases?.[0],
    },
  });

  const caseDetails = caseDataFromState || data;

  if (isLoading) {
    return <Loader />;
  }

  if (!caseDetails) {
    return (
      <Card>
        <div style={{ textAlign: "center" }}>{t("CS_COMMON_NO_DATA")}</div>
      </Card>
    );
  }

  const { verification, ...billingData } = caseDetails;

  const formatDate = (timestamp) => {
    if (!timestamp) return "NA";
    return Digit.DateUtils.ConvertTimestampToDate(timestamp);
  };

  const onActionSelect = (action) => {
    setSelectedAction(action);
    setDisplayMenu(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setComments("");
    setSelectedAction(null);
  };

  const submitAction = async () => {
    try {
      const payload = {
        billingCycleId: billingData?.billingCycleId,
        action: selectedAction === "VERIFY" ? "APPROVE" : "REJECT",
        remarks: comments,
      };

      const res = await Digit.WSService.updateZROVerification(payload, tenantId);
      setApiResponse(res);

      setToast({ key: "success", error: false, message: t("WF_ZRO_ACTION_SUCCESS") });
      setShowModal(false); // only close modal, do not clear state
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setToast({ key: "error", error: true, message: err?.response?.data?.Errors?.[0]?.message || t("CS_ACTION_ERROR") });
      closeModal();
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <Banner
          message={t(selectedAction === "VERIFY" ? "WF_ZRO_VERIFY_SUCCESS" : "WF_ZRO_REJECT_SUCCESS")}
          applicationNumber={apiResponse?.connectionno ? apiResponse.connectionno : connectionNumber}
          info={apiResponse?.connectionno ? t("WS_CONNECTION_NO_LABEL") : t("WS_CONNECTION_NO_LABEL")}
          successful={selectedAction === "VERIFY"}
        />
        <CardText>{apiResponse?.message ? apiResponse.message : t("WF_ZRO_SUCCESS_MESSAGE_MAIN")}</CardText>
        <ActionBar>
          <SubmitBar label={t("CORE_COMMON_GO_TO_HOME")} onSubmit={() => history.push("/digit-ui/employee/ws/zro-application")} />
        </ActionBar>
      </Card>
    );
  }

  return (
    <React.Fragment>
      <Card>
        {/* Verification Details Section */}
        <CardSubHeader>{t("WS_VERIFICATION_DETAILS")}</CardSubHeader>
        <StatusTable>
          <Row label={t("WS_CONNECTION_NO_LABEL")} text={verification?.connectionno || "NA"} />
          <Row label={t("WS_VERIFICATION_STATUS")} text={verification?.status || "NA"} />
          <Row label={t("WS_CONSUMPTION_LABEL")} text={verification?.consumption ?? "NA"} />
          <Row label={t("WS_PREVIOUS_CONSUMPTION")} text={verification?.previousconsumption ?? "NA"} />
          <Row label={t("WS_DEVIATION_FACTOR")} text={verification?.deviationfactor ? Number(verification.deviationfactor).toFixed(2) : "NA"} />
          <Row label={t("WS_REMARKS")} text={verification?.remarks || "NA"} />
        </StatusTable>

        {/* Billing & Consumption Details Section */}
        <CardSubHeader style={{ marginTop: "32px" }}>{t("WS_BILLING_AND_CONSUMPTION_DETAILS")}</CardSubHeader>
        <StatusTable>
          <Row label={t("WS_BILLING_CYCLE_ID")} text={billingData.billingCycleId || "NA"} />
          <Row label={t("WS_BILLING_PERIOD")} text={`${formatDate(billingData.billingPeriodFrom)} - ${formatDate(billingData.billingPeriodTo)}`} />
          <Row label={t("WS_BILLING_DAYS")} text={billingData.billingDays ?? "NA"} />
          <Row label={t("WS_PREVIOUS_READING_LABEL")} text={billingData.previousReading ?? "NA"} />
          <Row label={t("WS_PREVIOUS_OK_READING_DATE")} text={formatDate(billingData.previousOkReadingDate)} />
          <Row label={t("WS_CURRENT_READING_LABEL")} text={billingData.currentReading ?? "NA"} />
          <Row label={t("WS_READING_QUALITY_CODE")} text={billingData.readingQualityCode || "NA"} />
          <Row label={t("WS_BILLING_BASIS")} text={billingData.billingBasis || "NA"} />

          <Row label={t("WS_ACTUAL_CONSUMPTION")} text={billingData.actualConsumption ?? "NA"} />
          <Row label={t("WS_MONTHLY_CONSUMPTION")} text={billingData.monthlyConsumption ? Number(billingData.monthlyConsumption).toFixed(2) : "NA"} />
          <Row
            label={t("WS_THRESHOLD_CONSUMPTION")}
            text={billingData.thresholdConsumption ? Number(billingData.thresholdConsumption).toFixed(2) : "NA"}
          />
          <Row label={t("WS_1_5X_FLAG")} text={billingData.onePointFiveXFlag ? t("CORE_COMMON_YES") : t("CORE_COMMON_NO")} />
          <Row label={t("WS_BILLING_CYCLE_STATUS")} text={billingData.billingCycleStatus || "NA"} />
          <Row label={t("WS_CORRECTION_STATUS")} text={billingData.correctionStatus || "NA"} />
        </StatusTable>
      </Card>

      <ActionBar>
        {displayMenu ? <Menu localeKeyPrefix={"WF_ZRO"} options={["VERIFY", "REJECT"]} t={t} onSelect={onActionSelect} /> : null}
        <SubmitBar label={t("WF_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} />
      </ActionBar>

      {showModal && (
        <Modal
          headerBarMain={<Heading label={selectedAction === "VERIFY" ? t("WF_ZRO_VERIFY") : t("WF_ZRO_REJECT")} />}
          headerBarEnd={<CloseBtn onClick={closeModal} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={closeModal}
          actionSaveLabel={selectedAction === "VERIFY" ? t("WF_ZRO_VERIFY") : t("WF_ZRO_REJECT")}
          actionSaveOnSubmit={submitAction}
        >
          <div style={{ marginBottom: "16px" }}>
            <CardLabel>{t("WF_COMMON_COMMENTS")}</CardLabel>
            <TextArea name="comments" value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
        </Modal>
      )}

      {toast && <Toast error={toast.error} label={toast.message} onClose={() => setToast(null)} />}
    </React.Fragment>
  );
};

export default WSZROVerificationDetails;
