import React, { useEffect, useState } from "react";
import { Card, Banner, CardText, SubmitBar, Loader, LinkButton, Toast, ActionBar, Menu } from "@djb25/digit-ui-react-components";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import getPDFData from "../getPDFData";
import { getVehicleType } from "../utils";

const GetMessage = (type, action, isSuccess, isEmployee, t, data) => {
  const zeroPricing = data?.additionalDetails?.tripAmount === 0 || data?.additionalDetails?.tripAmount === null || false;
  const advanceZero = data?.advanceAmount === 0 || false;
  return t(
    `${isEmployee ? "E" : "C"}S_FSM_RESPONSE_${action ? action : "CREATE"}_${type}${isSuccess ? "" : "_ERROR"}${action ? "" : advanceZero ? "_POST_PAY" : zeroPricing ? "_ZERO_PAY" : ""
    }`
  );
};

const GetActionMessage = (action, isSuccess, isEmployee, t) => {
  return GetMessage("ACTION", action, isSuccess, isEmployee, t);
};

const GetLabel = (action, isSuccess, isEmployee, t) => {
  return GetMessage("LABEL", action, isSuccess, isEmployee, t);
};

const DisplayText = (action, isSuccess, isEmployee, t, data) => {
  return GetMessage("DISPLAY", action, isSuccess, isEmployee, t, data);
};

const BannerPicker = (props) => {
  const firstFsm = props.data?.fsm?.[0];
  const actionMessage = props?.action ? props.action : firstFsm?.applicationStatus;
  let labelMessage = GetLabel(firstFsm?.applicationStatus || props.action, props.isSuccess, props.isEmployee, props.t);

  if (props.errorInfo && props.errorInfo !== null && props.errorInfo !== "" && typeof props.errorInfo === "string" && props.action !== "SCHEDULE") {
    labelMessage = props.errorInfo;
  }
  return (
    <Banner
      message={GetActionMessage(actionMessage || props.action, props.isSuccess, props.isEmployee, props.t)}
      applicationNumber={firstFsm?.applicationNo}
      info={labelMessage}
      successful={props.isSuccess}
      style={{ width: "100%" }}
    />
  );
};

const Response = (props) => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const paymentAccess = Digit.UserService.hasAccess("FSM_COLLECTOR");
  const FSM_EDITOR = Digit.UserService.hasAccess("FSM_EDITOR_EMP") || false;
  const isCitizen = Digit.UserService.hasAccess("CITIZEN") || window.location.pathname.includes("citizen") || false;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateId = Digit.ULBService.getStateId();
  const { state } = props.location || {};
  const parentRoute = props.parentRoute || (isCitizen ? "/digit-ui/citizen/fsm" : "/digit-ui/employee/fsm");
  const isEmployee = parentRoute.includes("employee");

  const mutation = state?.key === "update" ? Digit.Hooks.fsm.useApplicationActions(tenantId) : Digit.Hooks.fsm.useDesludging(tenantId);

  const { data: storeData } = Digit.Hooks.useStore.getInitData();
  const { tenants } = storeData || {};
  const [mutationHappened, setMutationHappened, clear] = Digit.Hooks.useSessionStorage("FSM_MUTATION_HAPPENED", false);
  const [errorInfo, setErrorInfo, clearError] = Digit.Hooks.useSessionStorage("FSM_ERROR_DATA", false);
  const [successData, setsuccessData, clearSuccessData] = Digit.Hooks.useSessionStorage("FSM_MUTATION_SUCCESS_DATA", false);
  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  sessionStorage.removeItem("Digit_FSM_PT");
  const onError = (error) => {
    setErrorInfo(error?.response?.data?.Errors?.[0]?.code || error?.message || "ERROR");
    setMutationHappened(true);
  };
  useEffect(() => {
    if (mutation.data) setsuccessData(mutation.data);
  }, [mutation.data]);
  const localityCode = mutation?.data?.fsm?.[0]?.address?.locality?.code;
  const slumCode = mutation?.data?.fsm?.[0]?.address?.slumName;
  const slum = Digit.Hooks.fsm.useSlum(mutation?.data?.fsm?.[0]?.tenantId, slumCode, localityCode, {
    enabled: slumCode ? true : false,
    retry: slumCode ? true : false,
  });
  const { data: vehicleMenu } = Digit.Hooks.fsm.useMDMS(stateId, "Vehicle", "VehicleType", { staleTime: Infinity });
  const Data = mutation?.data || successData;
  const firstFsm = Data?.fsm?.[0];
  const vehicle = vehicleMenu?.find((vehicle) => firstFsm?.vehicleType === vehicle?.code);
  const pdfVehicleType = getVehicleType(vehicle, t);
  const getApplicationNo = firstFsm?.applicationNo;

  const { data: paymentsHistory } = Digit.Hooks.fsm.usePaymentHistory(tenantId, getApplicationNo);

  const handleDownloadPdf = () => {
    const { fsm } = mutation.data || successData || {};
    if (!fsm?.length) return;
    const [applicationDetails] = fsm;
    const tenantInfo = tenants?.find((tenant) => tenant.code === applicationDetails.tenantId);

    const data = getPDFData({ ...applicationDetails, slum, pdfVehicleType }, tenantInfo, t);
    Digit.Utils.pdf.generate(data);
  };

  const downloadPaymentReceipt = async () => {
    if (!paymentsHistory?.Payments?.[0]) return;
    const receiptFile = { filestoreIds: [paymentsHistory.Payments[0]?.fileStoreId] };

    if (!receiptFile?.fileStoreIds?.[0]) {
      const newResponse = await Digit.PaymentService.generatePdf(stateId, { Payments: [paymentsHistory.Payments[0]] }, "fsm-receipt");
      const fileStore = await Digit.PaymentService.printReciept(stateId, { fileStoreIds: newResponse.filestoreIds[0] });
      window.open(fileStore[newResponse.filestoreIds[0]], "_blank");
    } else {
      const fileStore = await Digit.PaymentService.printReciept(stateId, { fileStoreIds: receiptFile.filestoreIds[0] });
      window.open(fileStore[receiptFile.filestoreIds[0]], "_blank");
    }
  };

  const handleResponse = () => {
    if (firstFsm?.paymentPreference === "POST_PAY") {
      setShowToast({ key: "error", action: `ES_FSM_PAYMENT_BEFORE_SCHEDULE_FAILURE` });
      setTimeout(() => {
        closeToast();
      }, 5000);
    } else {
      history.push(`/digit-ui/employee/payment/collect/FSM.TRIP_CHARGES/${state?.applicationData?.applicationNo || firstFsm?.applicationNo}`);
    }
  };

  const closeToast = () => {
    setShowToast(null);
  };

  useEffect(() => {
    const onSuccess = () => {
      queryClient.clear();
      setMutationHappened(true);
      window.history.replaceState({}, "FSM_CREATE_RESPONSE");
    };
    if (!mutationHappened && !errorInfo && state) {
      if (state.key === "update") {
        mutation.mutate(
          {
            fsm: state.applicationData,
            workflow: {
              action: state.action,
              ...state.actionData,
            },
          },
          {
            onError,
            onSuccess,
          }
        );
      } else {
        mutation.mutate(state, {
          onError,
          onSuccess,
        });
      }
    }
  }, []);

  function onActionSelect(action) {
    setSelectedAction(action);
    setDisplayMenu(false);
  }

  const handleGeneratePdf = () => {
    if (firstFsm?.applicationStatus === "COMPLETED" && firstFsm?.advanceAmount !== null) {
      return downloadPaymentReceipt;
    }
    return handleDownloadPdf;
  };

  const generatePdfLabel = () => {
    if (firstFsm?.applicationStatus === "COMPLETED" && firstFsm?.advanceAmount !== null) {
      return t("CS_COMMON_PAYMENT_RECEIPT");
    }
    return t("CS_COMMON_DOWNLOAD");
  };

  useEffect(() => {
    switch (selectedAction) {
      case "GO_TO_HOME":
        return isCitizen ? history.push("/digit-ui/citizen") : history.push("/digit-ui/employee");
      case "ASSIGN_TO_DSO":
        return history.push(`/digit-ui/employee/fsm/application-details/${getApplicationNo}`);
      case "PAY":
        return handleResponse();
      default:
        break;
    }
  }, [selectedAction]);

  if (mutation.isLoading || (state && mutation.isIdle && !mutationHappened)) {
    return <Loader />;
  }
  let ACTIONS = ["GO_TO_HOME"];
  if (firstFsm?.applicationStatus === "PENDING_APPL_FEE_PAYMENT" && paymentAccess) {
    ACTIONS = [...ACTIONS, "PAY"];
  } else if (firstFsm?.applicationStatus === "ASSING_DSO" && FSM_EDITOR) {
    ACTIONS = [...ACTIONS, "ASSIGN_TO_DSO"];
  }

  const isSuccess = !errorInfo && !mutation?.isError && (!successData ? mutation?.isSuccess : true);
  return (
    <React.Fragment>
      <Card className="vehicle-details-card">
        <BannerPicker
          t={t}
          data={Data}
          action={state?.action}
          isSuccess={isSuccess}
          isLoading={(mutation.isIdle && !mutationHappened) || mutation?.isLoading}
          isEmployee={isEmployee}
          errorInfo={errorInfo}
        />
        <CardText>{DisplayText(state?.action, isSuccess, isEmployee, t, firstFsm)}</CardText>
        {isSuccess && <SubmitBar label={generatePdfLabel()} onSubmit={handleGeneratePdf()} />}
      </Card>
      <ActionBar>
        {displayMenu ? <Menu localeKeyPrefix={"ES_COMMON"} options={ACTIONS} t={t} onSelect={onActionSelect} /> : null}
        {ACTIONS.length === 1 ? (
          <SubmitBar label={t(`ES_COMMON_${ACTIONS[0]}`)} onSubmit={() => onActionSelect(ACTIONS[0])} />
        ) : (
          <SubmitBar label={t("ES_COMMON_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} />
        )}
      </ActionBar>

      {showToast && (
        <Toast
          error={showToast.key === "error" ? true : false}
          label={t(showToast.key === "success" ? showToast.action : `ES_FSM_PAYMENT_BEFORE_SCHEDULE_FAILURE`)}
          onClose={closeToast}
        />
      )}
    </React.Fragment>
  );
};

export default Response;
