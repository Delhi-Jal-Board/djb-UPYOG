import React, { useState, useRef, useEffect } from "react";
import WorkflowTimeline from "../../components/WorkflowTimeline";
import { Toast } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import ApplicationDetailsTemplate from "../../../../templates/ApplicationDetails";
import * as func from "../../utils";
import getPDFData from "../../utils/getWSAcknowledgementData";
import getModifyPDFData from "../../utils/getWsAckDataForModifyPdfs";
import { getFiles, getBusinessService } from "../../utils";
// import _ from "lodash";
import { ifUserRoleExists } from "../../utils";
const ApplicationDetails = () => {
  const { t } = useTranslation();
  const userInfo = Digit.UserService.getUser();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const stateCode = Digit.ULBService.getStateId();
  const [showToast, setShowToast] = useState(null);
  const [showWaringToast, setShowWaringToast] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  let filters = func.getQueryStringParams(window.location.search);

  const applicationNumber = filters?.applicationNumber;
  const serviceType = filters?.service;
  const menuRef = useRef();
  const [hideTimeline, setHideTimeline] = React.useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  sessionStorage.removeItem("Digit.PT_CREATE_EMP_WS_NEW_FORM");
  sessionStorage.removeItem("IsDetailsExists");

  const [sessionFormData, setSessionFormData, clearSessionFormData] = Digit.Hooks.useSessionStorage("ADHOC_ADD_REBATE_DATA", {});
  const [sessionBillFormData, setSessionBillFormData, clearBillSessionFormData] = Digit.Hooks.useSessionStorage("ADHOC_BILL_ADD_REBATE_DATA", {});
  //for common receipt key.
  const { isBillingServiceLoading } = Digit.Hooks.obps.useMDMS(stateCode, "BillingService", ["BusinessService"]);
  const { isCommonmastersLoading, data: mdmsCommonmastersData } = Digit.Hooks.obps.useMDMS(stateCode, "common-masters", ["uiCommonPay"]);
  const { isServicesMasterLoading, data: servicesMasterData } = Digit.Hooks.ws.useMDMS(stateCode, "ws-services-masters", [
    "WSEditApplicationByConfigUser",
  ]);
  const commonPayDetails = mdmsCommonmastersData?.["common-masters"]?.uiCommonPay || [];
  const index =
    commonPayDetails &&
    commonPayDetails.findIndex((item) => {
      return item.code === "WS.ONE_TIME_FEE";
    });
  let commonPayInfo = "";
  if (index > -1) commonPayInfo = commonPayDetails[index];
  else commonPayInfo = commonPayDetails && commonPayDetails.filter((item) => item.code === "DEFAULT");
  const receiptKey = commonPayInfo?.receiptKey || "consolidatedreceipt";

  const { isLoading: isPrivacyLoading, data: privacyData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "DataSecurity",
    [{ name: "SecurityPolicy" }],
    {
      select: (data) => data?.DataSecurity?.SecurityPolicy?.find((elem) => elem?.model === "User") || {},
    }
  );

  let { isLoading, isError, data: applicationDetails, error } = Digit.Hooks.ws.useWSDetailsPage(
    t,
    tenantId,
    applicationNumber,
    serviceType,
    userInfo,
    { privacy: Digit.Utils.getPrivacyObject() }
  );

  function checkforPrivacyenablement() {
    if (
      !isLoading &&
      Digit.Utils.checkPrivacy(privacyData, {
        uuid: applicationDetails?.applicationData?.connectionHolders?.uuid || applicationDetails?.propertyDetails?.owners?.[0]?.uuid,
        fieldName: "mobileNumber",
        model: "User",
      })
    )
      return true;
    else return false;
  }

  let workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId: tenantId,
    id: applicationNumber,
    moduleCode: applicationDetails?.processInstancesDetails?.[0]?.businessService,
    config: {
      enabled: applicationDetails?.processInstancesDetails?.[0]?.businessService ? true : false,
      privacy: Digit.Utils.getPrivacyObject(),
    },
  });

  const { data: oldData } = Digit.Hooks.ws.useOldValue(
    {
      tenantId,
      filters: { connectionNumber: applicationDetails?.applicationData?.connectionNo, isConnectionSearch: true },
      businessService: serviceType,
    },
    {
      enabled: applicationDetails?.applicationData?.applicationType?.includes("MODIFY_") ? true : false,
      privacy: Digit.Utils.getPrivacyObject(),
    }
  );

  sessionStorage.removeItem("eyeIconClicked");
  const oldValueWC = oldData?.WaterConnection;
  const oldValueSC = oldData?.SewerageConnections;

  const oldValueCopy = [oldValueWC, oldValueSC];

  const newValueFilter = oldValueCopy?.filter((ele) => ele);

  const currentValue = applicationDetails?.applicationData;
  const res = newValueFilter[0]?.flatMap((o) => {
    const pairs = Object.entries(o).filter(([k, v]) => currentValue?.[k] !== v);
    return pairs?.length ? Object.fromEntries(pairs) : [];
  });

  const {
    // isLoading: updatingApplication,
    // isError: updateApplicationError,
    // data: updateResponse,
    // error: updateError,
    mutate,
  } = Digit.Hooks.ws.useWSApplicationActions(serviceType);

  const { data: reciept_data, isLoading: recieptDataLoading } = Digit.Hooks.useRecieptSearch(
    {
      tenantId: tenantId,
      businessService: serviceType == "WATER" ? "WS.ONE_TIME_FEE" : "SW.ONE_TIME_FEE",
      consumerCodes: applicationDetails?.applicationData?.applicationNo,
    },
    {
      enabled: applicationDetails?.applicationData?.applicationType?.includes("NEW_") ? true : false,
      privacy: Digit.Utils.getPrivacyObject(),
    }
  );

  const clearDataDetails = () => {
    clearSessionFormData();
    setSessionFormData({});
    setSessionBillFormData({});
    clearBillSessionFormData();
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const checkWSAdditionalDetails = () => {
    return true;
  };
  let dowloadOptions = [],
    appStatus = applicationDetails?.applicationData?.applicationStatus || "";

  const timeline =
    workflowDetails?.data?.processInstances ||
    workflowDetails?.ProcessInstances ||
    applicationDetails?.processInstancesDetails ||
    [];

  const allTimelineSteps = workflowDetails?.data?.timeline || [];

  const isSendBackToCitizen =
    (Array.isArray(timeline) &&
      timeline.some(
        (step) =>
          step?.action === "SEND_BACK_TO_CITIZEN" ||
          step?.action === "SEND_BACK_TO_CITIZEN_DIRECT"
      )) ||
    (Array.isArray(allTimelineSteps) &&
      allTimelineSteps.some(
        (step) =>
          step?.performedAction === "SEND_BACK_TO_CITIZEN" ||
          step?.performedAction === "SEND_BACK_TO_CITIZEN_DIRECT"
      ));

  const hasPaymentInTimeline =
    (Array.isArray(timeline) &&
      timeline.some(
        (step) =>
          step?.action === "PAY" ||
          step?.state?.state === "PENDING_FOR_PAYMENT" ||
          step?.state?.applicationStatus === "PENDING_FOR_PAYMENT" ||
          step?.state?.state === "PENDING_FOR_ZRO_APPROVAL" ||
          step?.state?.state === "PENDING_FOR_EE_APPROVAL" ||
          step?.state?.applicationStatus === "PENDING_FOR_ZRO_APPROVAL" ||
          step?.state?.applicationStatus === "PENDING_FOR_EE_APPROVAL"
      )) ||
    (Array.isArray(allTimelineSteps) &&
      allTimelineSteps.some(
        (step) =>
          step?.performedAction === "PAY" ||
          step?.state === "PENDING_FOR_PAYMENT" ||
          step?.status === "PENDING_FOR_PAYMENT" ||
          step?.state === "PENDING_FOR_ZRO_APPROVAL" ||
          step?.state === "PENDING_FOR_EE_APPROVAL" ||
          step?.status === "PENDING_FOR_ZRO_APPROVAL" ||
          step?.status === "PENDING_FOR_EE_APPROVAL"
      ));

  const isCitizenActionPostPayment =
    (appStatus === "PENDING_FOR_CITIZEN_ACTION" || appStatus === "PENDING FOR CITIZEN ACTION") &&
    (isSendBackToCitizen || hasPaymentInTimeline);

  const isFeePaid =
    reciept_data?.Payments?.length > 0 ||
    isCitizenActionPostPayment ||
    (appStatus &&
      appStatus !== "INITIATED" &&
      appStatus !== "PENDING_FOR_DOCUMENT_VERIFICATION" &&
      (appStatus !== "PENDING_FOR_CITIZEN_ACTION" || isCitizenActionPostPayment) &&
      appStatus !== "PENDING_FOR_FIELD_INSPECTION" &&
      appStatus !== "PENDING_FOR_PAYMENT" &&
      appStatus !== "PENDING_FOR_FINAL_PAYMENT" &&
      appStatus !== "PENDING_FOR_ADDITIONAL_PAYMENT" &&
      appStatus !== "PENDING_APPROVAL_FOR_MUTATION");

  const feeEstimationSection = applicationDetails?.applicationDetails?.find((section) => section?.title === "WS_TASK_DETAILS_FEE_ESTIMATE");
  if (feeEstimationSection?.additionalDetails && isFeePaid) {
    feeEstimationSection.additionalDetails.isPaid = true;
  }

  if (
    workflowDetails?.data &&
    applicationDetails?.processInstancesDetails?.[0]?.businessService === "NewWS1" &&
    appStatus === "PENDING_FOR_BILLING_CLERK_REVIEW"
  ) {
    const plotArea = Number(applicationDetails?.propertyDetails?.additionalDetails?.plotArea ?? 0);
    // Filter actionState.nextActions
    if (workflowDetails?.data?.actionState?.nextActions) {
      workflowDetails.data.actionState.nextActions = workflowDetails.data.actionState.nextActions.filter((action) => {
        if (action.action === "VERIFY_AND_FORWARD_TO_AE") {
          return plotArea > 200;
        }
        if (action.action === "VERIFY_AND_FORWARD_TO_ASO") {
          return plotArea <= 200;
        }
        return true;
      });
    }

    // Filter nextActions
    if (workflowDetails?.data?.nextActions) {
      workflowDetails.data.nextActions = workflowDetails.data.nextActions.filter((action) => {
        if (action.action === "VERIFY_AND_FORWARD_TO_AE") {
          return plotArea > 200;
        }
        if (action.action === "VERIFY_AND_FORWARD_TO_ASO") {
          return plotArea <= 200;
        }
        return true;
      });
    }
  }
  [workflowDetails?.data?.actionState?.nextActions, workflowDetails?.data?.nextActions].forEach((actionsList) => actionsList?.forEach((action) => {
    if (action?.action === "RESUBMIT_APPLICATION") {
      const isMutation = applicationDetails?.applicationData?.applicationType?.includes("MUTATION");
      let pathName = isMutation
        ? `/digit-ui/employee/ws/mutation-application?applicationNumber=${applicationNumber}&tenantId=${tenantId}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`
        : `/digit-ui/employee/ws/edit-application?applicationNumber=${applicationNumber}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`;

      const userConfig = servicesMasterData?.["ws-services-masters"]?.WSEditApplicationByConfigUser || [];
      const editApplicationUserRole = userConfig?.[0]?.roles || [];
      const mdmsApplicationStatus = userConfig?.[0]?.status;

      let isFieldInspector = false;
      editApplicationUserRole.every((role, index) => {
        isFieldInspector = ifUserRoleExists(role);
        if (isFieldInspector) return false;
        else return true;
      });

      if (!isMutation && isFieldInspector && appStatus === mdmsApplicationStatus) {
        pathName = `/digit-ui/employee/ws/edit-application-by-config?applicationNumber=${applicationNumber}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`;
      }

      action.redirectionUrll = {
        action: "ACTIVATE_CONNECTION",
        pathname: pathName,
        state: {
          applicationDetails: applicationDetails,
          action: "RESUBMIT_APPLICATION",
        },
      };
    }
    if (action?.action === "SUBMIT_APPLICATION") {
      action.redirectionUrll = {
        action: "ACTIVATE_CONNECTION",
        pathname: `/digit-ui/employee/ws/modify-application-edit?applicationNumber=${applicationNumber}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`,
        state: applicationDetails,
      };
    }
  }));

  // if (
  //   workflowDetails?.data?.nextActions?.length > 0 &&
  //   workflowDetails?.data?.actionState?.nextActions?.length > 0 &&
  //   // !workflowDetails?.data?.actionState?.nextActions?.find((e) => e.action === "EDIT") &&
  //   !workflowDetails?.data?.actionState?.nextActions?.find((e) => e.action === "RESUBMIT_APPLICATION") &&
  //   !workflowDetails?.data?.actionState?.nextActions?.find((e) => e.action === "ACTIVATE_CONNECTION") &&
  //   !workflowDetails?.data?.actionState?.nextActions?.find((e) => e.action === "SUBMIT_APPLICATION")
  // ) {
  //   workflowDetails?.data?.nextActions?.forEach((data) => {
  //     if (data.action === "EDIT") workflowDetails.data.actionState.nextActions.push(data);
  //   });
  // }

  workflowDetails?.data?.actionState?.nextActions?.forEach((action) => {
    if (action?.action === "ACTIVATE_CONNECTION") {
      delete action.redirectionUrll;
      delete action.redirectionUrl;
    }
    if (action?.action === "EDIT") {
      const isMutation = applicationDetails?.applicationData?.applicationType?.includes("MUTATION");
      let pathName = isMutation
        ? `/digit-ui/employee/ws/mutation-application?applicationNumber=${applicationNumber}&tenantId=${tenantId}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`
        : `/digit-ui/employee/ws/edit-application?applicationNumber=${applicationNumber}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`;

      const userConfig = servicesMasterData?.["ws-services-masters"]?.WSEditApplicationByConfigUser || [];
      const editApplicationUserRole = userConfig?.[0]?.roles || [];
      const mdmsApplicationStatus = userConfig?.[0]?.status;

      let isFieldInspector = false;
      editApplicationUserRole.every((role, index) => {
        isFieldInspector = ifUserRoleExists(role);
        if (isFieldInspector) return false;
        else return true;
      });

      if (!isMutation && isFieldInspector && appStatus === mdmsApplicationStatus) {
        pathName = `/digit-ui/employee/ws/edit-application-by-config?applicationNumber=${applicationNumber}&service=${serviceType}&propertyId=${applicationDetails?.propertyDetails?.propertyId}`;
      }

      action.redirectionUrll = {
        action: "ACTIVATE_CONNECTION",
        pathname: pathName,
        state: {
          applicationDetails: applicationDetails,
          action: "VERIFY_AND_FORWARD",
        },
      };
    }
  });

  workflowDetails?.data?.nextActions?.forEach((action) => {
    if (action?.action === "VERIFY_AND_FORWARD" && appStatus === "PENDING_FOR_FIELD_INSPECTION" && !checkWSAdditionalDetails()) {
      action.isToast = true;
      action.toastMessage = "MISSING_ADDITIONAL_DETAILS";
    }
  });

  workflowDetails?.data?.actionState?.nextActions?.forEach((action) => {
    if (action?.action === "VERIFY_AND_FORWARD" && appStatus === "PENDING_FOR_FIELD_INSPECTION" && !checkWSAdditionalDetails()) {
      action.isToast = true;
      action.toastMessage = "MISSING_ADDITIONAL_DETAILS";
    }
  });
  workflowDetails?.data?.nextActions?.forEach((action) => {
    if (action?.action === "PAY") {
      if (workflowDetails?.data?.processInstances?.[0]?.businessService === "WSReconnection") {
        action.redirectionUrll = {
          pathname: `WSReconnection/${applicationDetails?.applicationNo}/${applicationDetails?.tenantId}?tenantId=${applicationDetails?.tenantId}&ISWSAPP&applicationNumber=${applicationDetails?.applicationNo}`,
          state: applicationDetails?.tenantId,
        };
      } else if (workflowDetails?.data?.processInstances?.[0]?.businessService === "SWReconnection") {
        action.redirectionUrll = {
          pathname: `SWReconnection/${applicationDetails?.applicationNo}/${applicationDetails?.tenantId}?tenantId=${applicationDetails?.tenantId}&ISWSAPP&applicationNumber=${applicationDetails?.applicationNo}`,
          state: applicationDetails?.tenantId,
        };
      } else {
        action.redirectionUrll = {
          pathname: `${getBusinessService(filters, applicationDetails)}/${applicationDetails?.applicationNo}/${applicationDetails?.tenantId}?tenantId=${applicationDetails?.tenantId
            }&ISWSAPP&applicationNumber=${applicationDetails?.applicationNo}`,
          state: applicationDetails?.tenantId,
        };
      }
    }
  });

  workflowDetails?.data?.actionState?.nextActions?.forEach((action) => {
    if (action?.action === "PAY") {
      if (workflowDetails?.data?.processInstances?.[0]?.businessService === "WSReconnection") {
        action.redirectionUrll = {
          pathname: `WSReconnection/${applicationDetails?.applicationNo}/${applicationDetails?.tenantId}?tenantId=${applicationDetails?.tenantId}&ISWSAPP&applicationNumber=${applicationDetails?.applicationNo}`,
          state: applicationDetails?.tenantId,
        };
      } else if (workflowDetails?.data?.processInstances?.[0]?.businessService === "SWReconnection") {
        action.redirectionUrll = {
          pathname: `SWReconnection/${applicationDetails?.applicationNo}/${applicationDetails?.tenantId}?tenantId=${applicationDetails?.tenantId}&ISWSAPP&applicationNumber=${applicationDetails?.applicationNo}`,
          state: applicationDetails?.tenantId,
        };
      } else {
        action.redirectionUrll = {
          pathname: `${getBusinessService(filters, applicationDetails)}/${applicationDetails?.applicationNo}/${applicationDetails?.tenantId}?tenantId=${applicationDetails?.tenantId
            }&ISWSAPP&applicationNumber=${applicationDetails?.applicationNo}`,
          state: applicationDetails?.tenantId,
        };
      }
    }
  });

  const oldApplication =
    serviceType === "WATER"
      ? oldData?.WaterConnection?.[oldData?.WaterConnection?.length - 1]
      : oldData?.SewerageConnections?.[oldData?.SewerageConnections?.length - 1];

  const handleDownloadPdf = async () => {
    const tenantInfo = applicationDetails?.applicationData?.tenantId;
    let result = applicationDetails?.applicationData;

    if (applicationDetails?.applicationData?.applicationType?.includes("MODIFY_")) {
      const PDFdata = getModifyPDFData({ ...result }, { ...applicationDetails?.propertyDetails }, tenantInfo, t, oldApplication);
      PDFdata.then((ress) => Digit.Utils.pdf.generateModifyPdf(ress));
      return;
    }
    const PDFdata = getPDFData({ ...result }, { ...applicationDetails?.propertyDetails }, tenantInfo, t);
    PDFdata.then((ress) => Digit.Utils.pdf.generatev1(ress));
  };

  async function getRecieptSearch(tenantId, payments, consumerCodes, receiptKey) {
    let response = null;
    if (payments?.fileStoreId) {
      response = { filestoreIds: [payments?.fileStoreId] };
      const fileStore = await Digit.PaymentService.printReciept(tenantId, { fileStoreIds: response.filestoreIds[0] });
      window.open(fileStore[response.filestoreIds[0]], "_blank");
    } else {
      response = await Digit.PaymentService.generatePdf(tenantId, { Payments: [{ ...payments }] }, receiptKey);
      const fileStore = await Digit.PaymentService.printReciept(tenantId, { fileStoreIds: response.filestoreIds[0] });
      window.open(fileStore[response?.filestoreIds[0]], "_blank");
    }
  }

  const handleEstimateDownload = async () => {
    if (applicationDetails?.applicationData?.additionalDetails?.estimationFileStoreId) {
      getFiles([applicationDetails?.applicationData?.additionalDetails?.estimationFileStoreId], applicationDetails?.tenantId);
    } else {
      const warningCount = sessionStorage.getItem("WARINIG_COUNT") || "0";
      const warningCountDetails = JSON.parse(warningCount);
      if (warningCountDetails === 0) {
        const filters = { applicationNumber };
        const response = await Digit.WSService.search({
          tenantId: applicationDetails?.tenantId,
          filters: { ...filters },
          businessService: serviceType === "WATER" ? "WS" : "SW",
        });
        let details = serviceType === "WATER" ? response?.WaterConnection?.[0] : response?.SewerageConnections?.[0];
        if (details?.additionalDetails?.estimationFileStoreId) {
          getFiles([details?.additionalDetails?.estimationFileStoreId], tenantId);
        } else {
          sessionStorage.setItem("WARINIG_COUNT", warningCountDetails ? warningCountDetails + 1 : 1);
          setTimeout(() => {
            sessionStorage.setItem("WARINIG_COUNT", "0");
          }, 60000);
          setShowWaringToast({
            isError: false,
            isWarning: true,
            key: "warning",
            message: t("WS_WARNING_FILESTOREID_PLEASE_TRY_AGAIN_SOMETIME_LABEL"),
          });
        }
      } else if (!showWaringToast) {
        setShowWaringToast({ isError: false, isWarning: true, key: "warning", message: t("WS_WARNING_FILESTOREID_PLEASE_TRY_AGAIN_SOMETIME_LABEL") });
      }
    }
  };

  const wsEstimateDownloadObject = {
    order: 1,
    label: t("WS_ESTIMATION_NOTICE"),
    onClick: handleEstimateDownload,
  };

  const sanctionDownloadObject = {
    order: 2,
    label: t("WS_SANCTION_LETTER"),
    onClick: () => getFiles([applicationDetails?.applicationData?.additionalDetails?.sanctionFileStoreId], applicationDetails?.tenantId),
  };

  const applicationDownloadObject = {
    order: 3,
    label: t("WS_APPLICATION"),
    onClick: handleDownloadPdf,
  };

  const appFeeDownloadReceipt = {
    order: 4,
    label: t("DOWNLOAD_RECEIPT_HEADER"),
    onClick: () =>
      getRecieptSearch(Digit.ULBService.getStateId(), reciept_data?.Payments?.[0], applicationDetails?.applicationData?.applicationNo, receiptKey),
  };
  // const handleViewTimeline = () => {
  //   const timelineSection = document.getElementById("timeline");
  //   if (timelineSection) {
  //     timelineSection.scrollIntoView({ behavior: "smooth" });
  //   }
  // };
  // const applicationFeeReceipt = {
  //   order: 4,
  //   label: t("WS_APLICATION_RECEIPT"),
  //   onClick: async () => {
  //     const tenant = Digit.ULBService.getStateId();
  //     const ConnectionDetailsfile = await Digit.PaymentService.generatePdf(
  //       tenantId,
  //       { WaterConnection: [applicationDetails?.applicationData] },
  //       "ws-consolidatedacknowlegment"
  //     );
  //     const file = await Digit.PaymentService.printReciept(tenant, { fileStoreIds: ConnectionDetailsfile.filestoreIds[0] });
  //     window.open(file[ConnectionDetailsfile.filestoreIds[0]], "_blank");
  //   },
  // };

  switch (appStatus) {
    case "PENDING_FOR_DOCUMENT_VERIFICATION":
    case "PENDING_FOR_CITIZEN_ACTION":
    case "PENDING_FOR_FIELD_INSPECTION":
      dowloadOptions = [applicationDownloadObject];
      break;
    case "PENDING_APPROVAL_FOR_CONNECTION":
    case "PENDING_FOR_PAYMENT":
      dowloadOptions = [applicationDownloadObject, wsEstimateDownloadObject];
      break;
    case "PENDING_FOR_CONNECTION_ACTIVATION":
    case "CONNECTION_ACTIVATED":
      if (applicationDetails?.applicationData?.applicationType?.includes("NEW_") && reciept_data?.Payments?.length > 0)
        dowloadOptions = [sanctionDownloadObject, wsEstimateDownloadObject, applicationDownloadObject, appFeeDownloadReceipt];
      else dowloadOptions = [sanctionDownloadObject, wsEstimateDownloadObject, applicationDownloadObject];
      break;
    case "REJECTED":
      dowloadOptions = [applicationDownloadObject];
      break;

    default:
      dowloadOptions = [applicationDownloadObject];
      break;
  }

  const closeMenu = () => {
    setShowOptions(false);
  };
  Digit.Hooks.useClickOutside(menuRef, closeMenu, showOptions);

  dowloadOptions.sort(function (a, b) {
    return a.order - b.order;
  });

  const isMutationApp = Boolean(
    applicationDetails?.applicationData?.applicationType === "MUTATION_WATER_CONNECTION" ||
    applicationDetails?.applicationData?.applicationType?.includes("MUTATION") ||
    applicationDetails?.applicationData?.applicationStatus?.includes("MUTATION") ||
    applicationDetails?.applicationData?.additionalDetails?.reasonForNameChange ||
    applicationDetails?.applicationData?.additionalDetails?.relationshipWithExistingConsumer ||
    applicationDetails?.processInstancesDetails?.[0]?.businessService?.toLowerCase()?.includes("mutation") ||
    applicationDetails?.processInstancesDetails?.[0]?.state?.state?.includes("MUTATION") ||
    applicationDetails?.processInstancesDetails?.[0]?.state?.applicationStatus?.includes("MUTATION") ||
    workflowDetails?.data?.processInstances?.[0]?.businessService?.toLowerCase()?.includes("mutation") ||
    workflowDetails?.data?.processInstances?.[0]?.state?.state?.includes("MUTATION") ||
    workflowDetails?.data?.processInstances?.[0]?.state?.applicationStatus?.includes("MUTATION") ||
    workflowDetails?.data?.timeline?.[0]?.state?.includes("MUTATION") ||
    workflowDetails?.data?.timeline?.[0]?.status?.includes("MUTATION")
  );

  const getMaskedMeterNumber = (meter) => {
    if (!meter || meter === "NA") return t("NA");
    const str = String(meter).trim();
    if (str.length <= 4) return "****";
    return `******${str.slice(-4)}`;
  };

  const getMaskedDocNumber = (doc) => {
    if (!doc || doc === "NA") return t("NA");
    const str = String(doc).trim();
    if (str.length <= 4) return "****";
    return `******${str.slice(-4)}`;
  };

  const getMaskedName = (name) => {
    if (!name) return t("NA");
    return String(name)
      .split("")
      .map((char, index) => (index % 2 === 1 && char !== " " ? "*" : char))
      .join("");
  };

  const getMaskedPhone = (phone) => {
    if (!phone || String(phone).length < 10) return t("NA");
    const str = String(phone).replace(/\D/g, "").slice(-10);
    return `******${str.slice(-4)}`;
  };

  const getRelationshipName = (code) => {
    if (!code) return t("NA");
    if (code?.code) return t(code.i18nKey || code.name || code.code);
    const map = { BLOOD_RELATION: t("Blood Relation"), LEGAL_HEIR: t("Legal Heir"), OTHER: t("Other") };
    return map[code] || t(code);
  };

  const getReasonName = (code) => {
    if (!code) return t("NA");
    if (code?.code) return t(code.i18nKey || code.name || code.code);
    const map = { SALE_PURCHASE: t("Purchase of Property"), DEVOLUTION_INHERITANCE: t("Inheritance"), OTHER: t("Devolution/Other") };
    return map[code] || t(code);
  };

  let renderedApplicationDetails = applicationDetails;
  if (isMutationApp && applicationDetails?.applicationData && Array.isArray(applicationDetails?.applicationDetails)) {
    const appData = applicationDetails.applicationData;
    const propData = applicationDetails.propertyDetails || {};
    const addDetails = appData.additionalDetails || {};
    const transfereeHolder = appData.connectionHolders?.[0] || {};

    // 1. Header Section
    let headerSection = {
      title: " ",
      asSectionHeader: true,
      values: [
        { title: t("PDF_STATIC_LABEL_APPLICATION_NUMBER_LABEL", "Application Number"), value: appData.applicationNo || t("NA") },
        {
          title: t("WS_SERVICE_NAME_LABEL", "Connection Category"),
          value: addDetails?.serviceType?.name || (appData?.serviceType === "SEWERAGE" || appData?.applicationNo?.includes("SW") ? t("Sewerage Connection") : t("Water Connection")),
        },
      ],
    };

    // 2. Fee Estimation Section
    const feeSection = applicationDetails.applicationDetails.find((s) => s?.title === "WS_TASK_DETAILS_FEE_ESTIMATE");

    // 3. Existing Consumer / Connection Details
    let existingConsumerDetails = applicationDetails.applicationDetails.find(
      (s) =>
        s?.title === "WS_EXISTING_CONSUMER_DETAILS_HEADER" ||
        s?.title === t("WS_EXISTING_CONSUMER_DETAILS_HEADER", "Existing Consumer / Connection Details")
    );
    if (!existingConsumerDetails) {
      existingConsumerDetails = {
        title: t("WS_EXISTING_CONSUMER_DETAILS_HEADER", "Existing Consumer / Connection Details"),
        asSectionHeader: true,
        values: [
          {
            title: t("WS_ACK_COMMON_CONNECTION_NO", "Consumer Number"),
            value: appData.connectionNo || t("NA"),
          },
          {
            title: t("WS_REGISTERED_CONSUMER_NAME", "Registered Consumer Name"),
            value: getMaskedName(
              addDetails?.ownerName ||
              propData?.owners?.[0]?.name ||
              appData?.connectionHolders?.find((h) => h?.isPrimaryOwner)?.name ||
              appData?.connectionHolders?.[0]?.name
            ),
          },
          {
            title: t("WS_REGISTERED_MOBILE_NUMBER", "Registered Mobile Number"),
            value: getMaskedPhone(
              addDetails?.ownerContactNumber ||
              propData?.owners?.[0]?.mobileNumber ||
              addDetails?.ownerMobileNumber ||
              appData?.mobileNumber
            ),
          },
          {
            title: t("WS_SERV_DETAIL_METER_NO", "Meter Number"),
            value: getMaskedMeterNumber(appData?.meterId || addDetails?.meterNo || addDetails?.meterId),
          },
          {
            title: t("WS_PROPERTY_ID_LABEL", "Property ID"),
            value: appData?.propertyId || propData?.propertyId || t("NA"),
          },
          {
            title: t("WS_PROPERTY_ADDRESS_LABEL", "Property Address"),
            value:
              addDetails?.completeAddress ||
              addDetails?.addressType ||
              func.getAddress?.(propData?.address, t) ||
              t("NA"),
          },
        ],
      };
    }

    // 4. Transferee (New Owner) Details
    let newConsumerDetails = applicationDetails.applicationDetails.find(
      (s) =>
        s?.title === "WS_MUTATION_NEW_CONSUMER_DETAILS_HEADER" ||
        s?.title === t("WS_MUTATION_NEW_CONSUMER_DETAILS_HEADER", "Transferee (New Owner) Details")
    );
    if (!newConsumerDetails) {
      const reasonChange = addDetails?.reasonForNameChange || addDetails?.reason || t("NA");
      const relationShip =
        transfereeHolder?.relationship ||
        addDetails?.relationshipWithExistingConsumer ||
        addDetails?.relationship ||
        t("NA");

      newConsumerDetails = {
        title: t("WS_MUTATION_NEW_CONSUMER_DETAILS_HEADER", "Transferee (New Owner) Details"),
        asSectionHeader: true,
        values: [
          {
            title: t("WS_NEW_CONSUMER_NAME", "New Consumer Name"),
            value: transfereeHolder?.name || addDetails?.proposedNewConsumerName || t("NA"),
          },
          {
            title: t("CORE_COMMON_MOBILE_NUMBER", "Mobile Number"),
            value: transfereeHolder?.mobileNumber || addDetails?.newOwnerMobileNumber || t("NA"),
          },
          {
            title: t("WS_EMAIL_ID", "Email ID"),
            value: transfereeHolder?.emailId || addDetails?.emailId || t("NA"),
          },
          {
            title: t("WS_CONN_HOLDER_OWN_DETAIL_GENDER_LABEL", "Gender"),
            value: transfereeHolder?.gender
              ? t(`GENDER_${transfereeHolder?.gender}`, transfereeHolder?.gender)
              : t("NA"),
          },
          {
            title: t("WS_REASON_FOR_TRANSFER", "Reason for Name Change / Mutation"),
            value: getReasonName(reasonChange),
          },
          {
            title: t("WS_RELATIONSHIP_WITH_EXISTING_CONSUMER", "Relationship with Existing Consumer"),
            value: getRelationshipName(relationShip),
          },
          ...(addDetails?.isOtpVerified !== undefined
            ? [
                {
                  title: t("WS_OTP_VERIFICATION_STATUS", "OTP Verification Status"),
                  value: addDetails?.isOtpVerified
                    ? t("Verified with OTP")
                    : t("Without OTP Verification"),
                },
              ]
            : []),
        ],
      };
    }

    // 5. Filter Documents Section (Only Proof of Identity and Supporting Document)
    let rawDocSection = applicationDetails.applicationDetails.find((s) => s?.title === "WS_DOCUMENTS");
    let mutationDocs = [];

    // Identity Proof
    const idDocId = addDetails?.identityProofDocumentId;
    const idDocNum = addDetails?.identityProofDocumentNumber || addDetails?.identityProofNumber;
    const idDocType = addDetails?.identityProofDocumentName || "AADHAAR";

    // Supporting Doc
    const saleDocId = addDetails?.saleDeedDocumentId || appData?.documents?.find((d) => d?.documentType === "REGISTERED_SALE_DEED" || d?.documentType?.includes("SALE_DEED"))?.fileStoreId;
    const saleDocType = appData?.documents?.find((d) => d?.documentType === "REGISTERED_SALE_DEED" || d?.documentType?.includes("SALE_DEED"))?.documentType || "SUPPORTING_DOCUMENT";

    const idDocObj = {
      title: "WS_IDENTITY_PROOF",
      categoryLabel: "Proof of Identity",
      documentType: idDocType,
      documentUid: getMaskedDocNumber(idDocNum),
      documentNumber: getMaskedDocNumber(idDocNum),
      fileStoreId: idDocId,
      numberLabel: "Identity Proof Document Number",
    };

    const saleDocObj = {
      title: "WS_REASON_BASED_DOCUMENT",
      categoryLabel: "Supporting Document",
      documentType: saleDocType,
      documentUid: "",
      documentNumber: "",
      fileStoreId: saleDocId,
      numberLabel: "",
    };

    if (rawDocSection?.additionalDetails?.documents?.[0]?.values) {
      const existingValues = rawDocSection.additionalDetails.documents[0].values;
      const filteredValues = existingValues.filter((v) => {
        const isMeter =
          v?.title === "WS_METER_PHOTO_UPLOAD_LABEL" ||
          v?.documentType?.includes("METER_PHOTO") ||
          v?.title === "WS_METER_WARRANTY_REPORT_INVOICE_LABEL" ||
          v?.documentType?.includes("METER_WARRANTY") ||
          v?.documentType?.includes("METER");
        const isSig = v?.title === "WS_APPLICANT_SIGNATURE" || v?.documentType?.includes("SIGNATURE") || v?.documentType?.includes("SIGN");
        const isPhoto = v?.isPhoto;
        return !isMeter && !isSig && !isPhoto;
      });

      filteredValues.forEach((v) => {
        if (v.documentNumber) v.documentNumber = getMaskedDocNumber(v.documentNumber);
        if (v.documentUid) v.documentUid = getMaskedDocNumber(v.documentUid);
      });

      mutationDocs = filteredValues;
    }

    if (mutationDocs.length === 0) {
      if (idDocId) mutationDocs.push(idDocObj);
      if (saleDocId) mutationDocs.push(saleDocObj);
    }

    const docSection = {
      title: "WS_DOCUMENTS",
      asSectionHeader: true,
      additionalDetails: {
        documents: [
          {
            title: "",
            values: mutationDocs,
          },
        ],
      },
    };

    renderedApplicationDetails = {
      ...applicationDetails,
      applicationDetails: [
        headerSection,
        feeSection,
        existingConsumerDetails,
        newConsumerDetails,
        docSection,
      ].filter(Boolean),
    };
  }

  return (
    <React.Fragment>
      <div className={"employee-main-application-details"} style={{ display: "flex", gap: "20px" }}>
        {/* Left Column: Workflow Timeline */}
        <div
          className={`workflow-timeline-wrapper no-scrollbar ${hideTimeline ? "hide-workflow" : ""}`}
          style={{ flex: "1 1 300px", maxWidth: hideTimeline ? "fit-content" : "400px", transition: "max-width 0.3s" }}
        >
          <WorkflowTimeline workflowDetails={workflowDetails} hideTimeline={hideTimeline} setHideTimeline={setHideTimeline} />
        </div>

        {/* Right Column: Application Details */}
        <div style={{ flex: "2 1 500px", minWidth: "300px" }}>
          <ApplicationDetailsTemplate
            applicationDetails={renderedApplicationDetails}
            isLoading={isLoading || isBillingServiceLoading || isCommonmastersLoading || isServicesMasterLoading}
            isDataLoading={isLoading || isBillingServiceLoading || isCommonmastersLoading || isServicesMasterLoading}
            applicationData={renderedApplicationDetails?.applicationData}
            mutate={mutate}
            id={"timeline"}
            workflowDetails={workflowDetails}
            businessService={renderedApplicationDetails?.processInstancesDetails?.[0]?.businessService?.toUpperCase()}
            moduleCode="WS"
            showToast={showToast}
            setShowToast={setShowToast}
            closeToast={closeToast}
            timelineStatusPrefix={`WF_${renderedApplicationDetails?.processInstancesDetails?.[0]?.businessService?.toUpperCase()}_`}
            oldValue={res}
            isInfoLabel={checkforPrivacyenablement()}
            clearDataDetails={clearDataDetails}
            showTimeLine={false}
          />
          {showWaringToast && (
            <Toast
              style={{ zIndex: "10000" }}
              warning={showWaringToast?.isWarning}
              error={showWaringToast?.isWarning ? false : true}
              label={t(showWaringToast?.message)}
              onClose={() => setShowWaringToast(null)}
              isDleteBtn={true}
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ApplicationDetails;
