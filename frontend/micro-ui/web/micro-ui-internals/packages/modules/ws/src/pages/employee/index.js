import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import { PrivateRoute, BreadcrumbHeader, PrintBtnCommon, Toast, MultiLink, LinkButton } from "@djb25/digit-ui-react-components";

import WSResponse from "./WSResponse";
import Response from "./Response";
import ResponseBillAmend from "./ResponseBillAmend";
import WSDisconnectionResponse from "./DisconnectionApplication/WSDisconnectionResponse";
import WSRestorationResponse from "./RestorationApplication/WSRestorationResponse";
import { ArrowLeft } from "@djb25/digit-ui-react-components";
import { HomeIcon } from "@djb25/digit-ui-react-components";
import { getFiles, getPDFData, getQueryStringParams } from "../../utils";

import getModifyPDFData from "../../utils/getWsAckDataForModifyPdfs";

const BILLSBreadCrumbs = ({ location }) => {
  const { t } = useTranslation();

  const search = useLocation().search;

  const [showWaringToast, setShowWaringToast] = useState(null);

  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef();
  const fromScreen = new URLSearchParams(search).get("from") || null;
  const IsEdit = new URLSearchParams(search).get("isEdit") || null;
  const applicationNumbercheck = new URLSearchParams(search).get("applicationNumber") || null;
  let isMobile = window.Digit.Utils.browser.isMobile();
  let requestParam = window.location.href.split("?")[1];

  function findLastIndex(array, searchKey, searchValue) {
    var index = array
      .slice()
      .reverse()
      .findIndex((x) => x[searchKey] === searchValue);
    var count = array.length - 1;
    var finalIndex = index >= 0 ? count - index : index;
    return finalIndex;
  }

  const printDiv = () => {
    let content = document.getElementById("documents-div").innerHTML;
    //APK button to print required docs
    if (window.mSewaApp && window.mSewaApp.isMsewaApp()) {
      window.mSewaApp.downloadBase64File(window.btoa(content), t("WS_REQ_DOCS"));
    } else {
      let printWindow = window.open("", "");
      printWindow.document.write(`<html><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };
  const tenantId = Digit.ULBService.getCurrentTenantId();
  let filters = getQueryStringParams(location.search);
  const applicationNumber = filters?.applicationNumber;
  const serviceType = filters?.service;

  const userInfo = Digit.UserService.getUser();
  let { data: applicationDetails } = Digit.Hooks.ws.useWSDetailsPage(t, tenantId, applicationNumber, serviceType, userInfo, {
    privacy: Digit.Utils.getPrivacyObject(),
  });
  let dowloadOptions = [],
    appStatus = applicationDetails?.applicationData?.applicationStatus || "";
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
  const applicationDownloadObject = {
    order: 3,
    label: t("WS_APPLICATION"),
    onClick: handleDownloadPdf,
  };

  const handleEstimateDownload = async () => {
    if (applicationDetails?.applicationData?.additionalDetails?.estimationFileStoreId) {
      getFiles([applicationDetails?.applicationData?.additionalDetails?.estimationFileStoreId], applicationDetails?.tenantId);
    } else {
      const warningCount = sessionStorage.getItem("WARINIG_COUNT") || "0";
      const warningCountDetails = JSON.parse(warningCount);
      if (warningCountDetails == 0) {
        const filters = { applicationNumber };
        const response = await Digit.WSService.search({
          tenantId: applicationDetails?.tenantId,
          filters: { ...filters },
          businessService: serviceType == "WATER" ? "WS" : "SW",
        });
        let details = serviceType == "WATER" ? response?.WaterConnection?.[0] : response?.SewerageConnections?.[0];
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

  const sanctionDownloadObject = {
    order: 2,
    label: t("WS_SANCTION_LETTER"),
    onClick: () => getFiles([applicationDetails?.applicationData?.additionalDetails?.sanctionFileStoreId], applicationDetails?.tenantId),
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

  const appFeeDownloadReceipt = {
    order: 4,
    label: t("DOWNLOAD_RECEIPT_HEADER"),
    onClick: () =>
      getRecieptSearch(Digit.ULBService.getStateId(), reciept_data?.Payments?.[0], applicationDetails?.applicationData?.applicationNo, receiptKey),
  };

  const handleViewTimeline = () => {
    const timelineSection = document.getElementById("timeline");
    if (timelineSection) {
      timelineSection.scrollIntoView({ behavior: "smooth" });
    }
  };

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

  let crumbs = [
    {
      path: "/digit-ui/employee",
      show: true,
      style: isMobile ? { width: "20%" } : {},
      icon: HomeIcon,
    },
    {
      path: "/digit-ui/employee/module/details",
      content: t("ES_TITLE_WATER_AND_SEWERAGE"),
      show: location.pathname.includes("/create-application") ||
        location.pathname.includes("/new-application"),
    },
    {
      path: "/digit-ui/employee/ws/create-application",
      content: t("ES_COMMON_WS_DOCUMENTS_REQUIRED"),
      show: location.pathname.includes("/create-application") ||
        location.pathname.includes("/new-application"),
      rightContent: (
        location.pathname.includes("/create-application") && <div onClick={printDiv} style={{ cursor: "pointer", display: "flex" }}>
          <PrintBtnCommon />
          <div style={{ fontSize: "24px", fontWeight: "400", color: "#0B0C0C" }}>{"Print"}</div>
        </div>
      ),
    },
    {
      path: "/digit-ui/employee/water/inbox",
      content: t("ES_COMMON_BILLS_WATER_INBOX_LABEL"),
      show: location.pathname.includes("/water/inbox") ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/water/bill-amendment/inbox",
      content: t("ES_COMMON_BILL_AMEND_WATER_INBOX_LABEL"),
      show: location.pathname.includes("/water/bill-amendment/inbox") ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/sewerage/bill-amendment/inbox",
      content: t("ES_COMMON_BILL_AMEND_SEWERAGE_INBOX_LABEL"),
      show: location.pathname.includes("/sewerage/bill-amendment/inbox") ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/water/search-application",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_SEARCH_APPLICATIONS")}` : t("WS_SEARCH_APPLICATIONS"),
      show: location.pathname.includes("/water/search-application") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/water/search-connection",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_SEARCH_CONNECTION")}` : t("WS_SEARCH_CONNECTION"),
      show: location.pathname.includes("/water/search-connection") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/water/wns-search",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_SEARCH_INTEGRATED_BILL")}` : t("WS_SEARCH_INTEGRATED_BILL"),
      show: location.pathname.includes("/water/wns-search") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/sewerage/search-application",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_SEARCH_APPLICATIONS")}` : t("WS_SEARCH_APPLICATIONS"),
      show: location.pathname.includes("/sewerage/search-application") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/sewerage/search-connection",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_SEARCH_CONNECTION")}` : t("WS_SEARCH_CONNECTION"),
      show: location.pathname.includes("/sewerage/search-connection") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/sewerage/inbox",
      content: t("ES_COMMON_BILLS_SEWERAGE_INBOX_LABEL"),
      show: location.pathname.includes("/sewerage/inbox") ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/new-application",
      content: fromScreen ? `${t(fromScreen)} / ${t("ES_COMMON_WS_NEW_CONNECTION")}` : t("ES_COMMON_WS_NEW_CONNECTION"),
      show: location.pathname.includes("/new-application") ? true : false,
    },
    {
      path: `${location?.pathname}${location.search}`,
      content: t("ACTION_TEST_RESPONSE"),
      show: location.pathname.includes("/ws-response") ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/consumption-details",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_VIEW_CONSUMPTION_DETAIL")}` : t("WS_VIEW_CONSUMPTION_DETAIL"),
      show: location.pathname.includes("/consumption-details") ? true : false,
      isBack: fromScreen && true,
    },
    // {
    //   path: sessionStorage.getItem("redirectedfromEDIT") === "true"? (applicationNumbercheck?.includes("SW_AP")?  "/digit-ui/employee/ws/sewerage/search-application" : "/digit-ui/employee/ws/water/search-application") : "/digit-ui/employee/ws/application-details",
    //   content: fromScreen ? `${t(fromScreen)} / ${t("WS_APPLICATION_DETAILS_HEADER")}` : t("WS_APPLICATION_DETAILS_HEADER"),
    //   show: location.pathname.includes("/generate-note") ? true : false,
    //   isBack: sessionStorage.getItem("redirectedfromEDIT") !== "true" && fromScreen && true,
    // },
    {
      path:
        sessionStorage.getItem("redirectedfromEDIT") === "true"
          ? applicationNumbercheck?.includes("SW_AP")
            ? "/digit-ui/employee/ws/sewerage/search-application"
            : "/digit-ui/employee/ws/water/search-application"
          : "/digit-ui/employee/ws/application-details",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_APPLICATION_DETAILS_HEADER")}` : t("WS_APPLICATION_DETAILS_HEADER"),
      show: location.pathname.includes("/application-details") ? true : false,
      isBack: sessionStorage.getItem("redirectedfromEDIT") !== "true" && fromScreen && true,
      rightContent: (
        <div style={{ zIndex: "10", display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "10px" }}>
          <div style={{ zIndex: "10", position: "relative", maxWidth: "100% !important" }}>
            {dowloadOptions && dowloadOptions.length > 0 && (
              <React.Fragment>
                <MultiLink
                  className="abcd"
                  onHeadClick={() => setShowOptions(!showOptions)}
                  displayOptions={showOptions}
                  options={dowloadOptions}
                  downloadBtnClassName={"employee-download-btn-className"}
                  optionsClassName={"employee-options-btn-className"}
                  ref={menuRef}
                  style={{ margin: "0px", color: "#fff" }}
                />
              </React.Fragment>
            )}
          </div>
          <LinkButton label={t("VIEW_TIMELINE")} style={{ color: "#A52A2A" }} onClick={handleViewTimeline}></LinkButton>
        </div>
      ),
    },
    {
      path:
        sessionStorage.getItem("redirectedfromEDIT") === "true"
          ? applicationNumbercheck?.includes("SW_AP")
            ? "/digit-ui/employee/ws/sewerage/search-application"
            : "/digit-ui/employee/ws/water/search-application"
          : "/digit-ui/employee/ws/modify-details",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_APPLICATION_DETAILS_HEADER")}` : t("WS_APPLICATION_DETAILS_HEADER"),
      show: location.pathname.includes("/modify-details") ? true : false,
      isBack: sessionStorage.getItem("redirectedfromEDIT") !== "true" && fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/disconnection-details",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_APPLICATION_DETAILS_HEADER")}` : t("WS_APPLICATION_DETAILS_HEADER"),
      show: location.pathname.includes("/disconnection-details") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/connection-details",
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_COMMON_CONNECTION_DETAIL")}` : t("WS_COMMON_CONNECTION_DETAIL"),
      show: location.pathname.includes("/connection-details") ? true : false,
      isBack: fromScreen && true,
    },
    {
      path: "/digit-ui/employee/ws/edit-application",
      content: `${t("WS_APPLICATION_DETAILS_HEADER")} / ${t("WS_APP_FOR_WATER_AND_SEWERAGE_EDIT_LABEL")}`,
      show: location.pathname.includes("/edit-application") ? true : false,
      isBack: true,
    },
    {
      path: `${location?.pathname}${location.search}`,
      content: `${t("WS_APPLICATION_DETAILS_HEADER")} / ${t("WF_EMPLOYEE_NEWSW1_ACTIVATE_CONNECTION")}`,
      show: location.pathname.includes("/activate-connection") ? true : false,
      isBack: true,
    },
    {
      path: `${location?.pathname}${location.search}`,
      content: `${t("WS_APPLICATION_DETAILS_HEADER")} / ${t("WS_WATER_SEWERAGE_DISCONNECTION_EDIT_LABEL")}`,
      show: location.pathname.includes("edit-disconnection-application") ? true : false,
      isBack: true,
    },
    {
      path: `${location?.pathname}${location.search}`,
      content: `${t("WS_APPLICATION_DETAILS_HEADER")} / ${t("WS_WATER_SEWERAGE_DISCONNECTION_EDIT_LABEL")}`,
      show: location.pathname.includes("config-by-disconnection-application") ? true : false,
      isBack: true,
    },
    {
      path: `${location?.pathname}${location.search}`,
      content: `${t("WS_APPLICATION_DETAILS_HEADER")} / ${t("WS_WATER_SEWERAGE_DISCONNECTION_EDIT_LABEL")}`,
      show: location.pathname.includes("resubmit-disconnection-application") ? true : false,
      isBack: true,
    },
    {
      path: `/digit-ui/employee/ws/new-disconnection/docsrequired`,
      content: t("WS_NEW_DISCONNECTION_DOCS_REQUIRED"),
      show: location.pathname.includes("/new-disconnection/docsrequired") ? true : false,
    },
    {
      path: `/digit-ui/employee/ws/new-disconnection/application-form`,
      content: isMobile
        ? `${t("WS_NEW_DISCONNECTION_DOCS_REQUIRED")} / ${t("WS_NEW_DISCONNECTION_APPLICATION")}`
        : `${t("WS_NEW_DISCONNECTION_DOCS_REQUIRED")} / ${t("WS_NEW_DISCONNECTION_APPLICATION")}`,
      show: location.pathname.includes("/new-disconnection/application-form") ? true : false,
      isBack: true,
    },
    {
      path: `${location?.pathname}${location.search}`,
      content: `${t("WS_NEW_DISCONNECTION_RESPONSE")}`,
      show: location.pathname.includes("/ws-disconnection-response") ? true : false,
      isBack: true,
    },
    // {
    //   path: "/digit-ui/employee/sewerage/bill-amendment/inbox",
    //   content: t("ES_COMMON_BILLS_SEWERAGE_INBOX_LABEL"),
    //   show: location.pathname.includes("/sewerage/bill-amendment/inbox") ? true : false,
    // },
    {
      path: `${location?.pathname}${location.search}`,
      content: fromScreen ? `${t(fromScreen)} / ${t("WS_MODIFY_CONNECTION_BUTTON")}` : t("WS_MODIFY_CONNECTION_BUTTON"),
      show: location.pathname.includes("ws/modify-application") ? true : false,
      isBack: true,
    },
    {
      path: "/digit-ui/employee/ws/required-documents",
      content: t("ES_COMMON_WS_DOCUMENTS_REQUIRED"),
      show: location.pathname.includes("/required-documents") ? true : false,
    },
    {
      path: requestParam ? `/digit-ui/employee/ws/bill-amendment?${requestParam}` : "/digit-ui/employee/ws/bill-amendment",
      content: t("WS_BILL_AMEND_APP"),
      show: location.pathname.includes("ws/bill-amendment") && !IsEdit ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/bill-amendment",
      content: t("WS_BILL_AMEND_EDIT_APP"),
      show: location.pathname.includes("ws/bill-amendment") && IsEdit ? true : false,
    },
    {
      path: "/digit-ui/employee/ws/response",
      content: t("WS_ACK_SCREEN"),
      show: location.pathname.includes("/employee/ws/response") ? true : false,
      isclickable: false,
    },
    {
      path: "/digit-ui/employee/ws/generate-note-bill-amendment",
      content: t("CS_TITLE_GENERATE_NOTE"),
      show: location.pathname.includes("/generate-note-bill-amendment") ? true : false,
      //isclickable : false,
    },
    {
      path: "/digit-ui/employee/ws/water/bulk-bil",
      content: t("CS_TITLE_BULK_BILL"),
      show: location.pathname.includes("/ws/water/bulk-bill") ? true : false,
      //isclickable : false,
    },
  ];

  let lastCrumbIndex = findLastIndex(crumbs, "show", true);
  crumbs[lastCrumbIndex] = { ...crumbs[lastCrumbIndex], isclickable: false };

  return (
    <React.Fragment>
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
      <BreadcrumbHeader
        style={
          window?.location.href.includes("/employee/ws/bill-amendment") || window?.location.href.includes("/employee/ws/response")
            ? { marginLeft: "20px" }
            : {}
        }
        leftContent={
          <React.Fragment>
            <ArrowLeft className="icon" />
            Back
          </React.Fragment>
        }
        onLeftClick={() => window.history.back()}
        breadcrumbs={crumbs}
      />
    </React.Fragment>
  );
};

const App = ({ path }) => {
  const location = useLocation();

  const WSDocsRequired = Digit?.ComponentRegistryService?.getComponent("WSDocsRequired");
  const WSInbox = Digit?.ComponentRegistryService?.getComponent("WSInbox");
  const WSDisconnectionDocsRequired = Digit?.ComponentRegistryService?.getComponent("WSDisconnectionDocsRequired");
  const WSApplicationBillAmendment = Digit?.ComponentRegistryService?.getComponent("WSApplicationBillAmendment");
  const WSRequiredDocuments = Digit?.ComponentRegistryService?.getComponent("WSRequiredDocuments");
  const WSNewApplication = Digit?.ComponentRegistryService?.getComponent("WSNewApplication");
  const WSApplicationDetails = Digit?.ComponentRegistryService?.getComponent("WSApplicationDetails");
  const WSGetConnectionDetails = Digit?.ComponentRegistryService?.getComponent("WSGetConnectionDetails");
  const WSActivateConnection = Digit?.ComponentRegistryService?.getComponent("WSActivateConnection");
  const WSApplicationDetailsBillAmendment = Digit?.ComponentRegistryService?.getComponent("WSApplicationDetailsBillAmendment");
  const WSSearch = Digit?.ComponentRegistryService?.getComponent("WSSearch");
  const WSSearchWater = Digit?.ComponentRegistryService?.getComponent("WSSearchWater");
  const WSEditApplication = Digit?.ComponentRegistryService?.getComponent("WSEditApplication");
  const WSConsumptionDetails = Digit?.ComponentRegistryService?.getComponent("WSConsumptionDetails");
  const WSModifyApplication = Digit?.ComponentRegistryService?.getComponent("WSModifyApplication");
  const WSEditModifyApplication = Digit?.ComponentRegistryService?.getComponent("WSEditModifyApplication");
  const WSDisconnectionApplication = Digit?.ComponentRegistryService?.getComponent("WSDisconnectionApplication");
  const WSRestorationApplication = Digit?.ComponentRegistryService?.getComponent("WSRestorationApplication");
  const WSEditApplicationByConfig = Digit?.ComponentRegistryService?.getComponent("WSEditApplicationByConfig");
  const WSBillIAmendMentInbox = Digit?.ComponentRegistryService?.getComponent("WSBillIAmendMentInbox");
  const WSGetDisconnectionDetails = Digit?.ComponentRegistryService?.getComponent("WSGetDisconnectionDetails");
  const WSModifyApplicationDetails = Digit?.ComponentRegistryService?.getComponent("WSModifyApplicationDetails");
  const WSEditDisconnectionApplication = Digit?.ComponentRegistryService?.getComponent("WSEditDisconnectionApplication");
  const WSEditDisconnectionByConfig = Digit?.ComponentRegistryService?.getComponent("WSEditDisconnectionByConfig");
  const WSResubmitDisconnection = Digit?.ComponentRegistryService?.getComponent("WSResubmitDisconnection");
  const WSSearchIntegrated = Digit?.ComponentRegistryService?.getComponent("WSSearchIntegrated");
  const WSBulkBillGeneration = Digit?.ComponentRegistryService?.getComponent("WSBulkBillGeneration");

  const locationCheck =
    window.location.href.includes("/employee/ws/new-application") ||
    window.location.href.includes("/employee/ws/modify-application") ||
    window.location.href.includes("/employee/ws/edit-application") ||
    window.location.href.includes("/employee/ws/activate-connection") ||
    window.location.href.includes("/employee/ws/application-details") ||
    window.location.href.includes("/employee/ws/modify-details") ||
    window.location.href.includes("/employee/ws/ws-response") ||
    window.location.href.includes("/employee/ws/new-disconnection/application-form") ||
    window.location.href.includes("/employee/ws/ws-disconnection-response") ||
    window.location.href.includes("/employee/ws/consumption-details") ||
    window.location.href.includes("/employee/ws/edit-disconnection-application") ||
    window.location.href.includes("/employee/ws/config-by-disconnection-application") ||
    window.location.href.includes("/employee/ws/resubmit-disconnection-application") ||
    window.location.href.includes("/employee/ws/water/bulk-bill");

  const locationCheckReqDocs =
    window.location.href.includes("/employee/ws/create-application") || window.location.href.includes("/employee/ws/new-disconnection/docsrequired");

  return (
    <Switch>
      <React.Fragment>
        <div className="form-container">
          <BILLSBreadCrumbs location={location} />

          <PrivateRoute path={`${path}/create-application`} component={WSDocsRequired} />
          <PrivateRoute path={`${path}/new-application`} component={WSNewApplication} />
          <PrivateRoute path={`${path}/edit-application`} component={WSEditApplication} />
          <PrivateRoute path={`${path}/edit-disconnection-application`} component={WSEditDisconnectionApplication} />
          <PrivateRoute path={`${path}/resubmit-disconnection-application`} component={WSResubmitDisconnection} />
          <PrivateRoute path={`${path}/config-by-disconnection-application`} component={WSEditDisconnectionByConfig} />
          <PrivateRoute path={`${path}/application-details`} component={WSApplicationDetails} />
          <PrivateRoute path={`${path}/modify-details`} component={WSModifyApplicationDetails} />
          <PrivateRoute path={`${path}/connection-details`} component={WSGetConnectionDetails} />
          <PrivateRoute path={`${path}/bill-amendment`} component={() => <WSApplicationBillAmendment {...{ path }} />} />
          <PrivateRoute path={`${path}/generate-note-bill-amendment`} component={() => <WSApplicationDetailsBillAmendment {...{ path }} />} />
          <PrivateRoute path={`${path}/response`} component={() => <Response {...{ path }} />} />
          <PrivateRoute path={`${path}/response-bill-amend`} component={() => <ResponseBillAmend {...{ path }} />} />
          <PrivateRoute path={`${path}/required-documents`} component={() => <WSRequiredDocuments {...{ path }} />} />
          <PrivateRoute path={`${path}/activate-connection`} component={WSActivateConnection} />
          <PrivateRoute path={`${path}/water/search-application`} component={(props) => <WSSearch {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/sewerage/search-application`} component={(props) => <WSSearch {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/ws-response`} component={WSResponse} />
          <PrivateRoute path={`${path}/ws-disconnection-response`} component={WSDisconnectionResponse} />
          <PrivateRoute path={`${path}/ws-restoration-response`} component={WSRestorationResponse} />
          <PrivateRoute path={`${path}/water/search-connection`} component={(props) => <WSSearchWater {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/sewerage/search-connection`} component={(props) => <WSSearchWater {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/water/search-demand`} component={(props) => <WSSearchWater {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/sewerage/search-demand`} component={(props) => <WSSearchWater {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/consumption-details`} component={WSConsumptionDetails} />
          <PrivateRoute path={`${path}/modify-application`} component={WSModifyApplication} />
          <PrivateRoute path={`${path}/modify-application-edit`} component={WSEditModifyApplication} />
          <PrivateRoute path={`${path}/disconnection-application`} component={WSDisconnectionDocsRequired} />
          <PrivateRoute path={`${path}/new-disconnection`} component={WSDisconnectionApplication} />
          <PrivateRoute path={`${path}/new-restoration`} component={WSRestorationApplication} />
          <PrivateRoute path={`${path}/bill-amend/inbox`} component={(props) => <WSBillIAmendMentInbox {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/water/inbox`} component={(props) => <WSInbox {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/sewerage/inbox`} component={(props) => <WSInbox {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/edit-application-by-config`} component={WSEditApplicationByConfig} />
          <PrivateRoute path={`${path}/disconnection-details`} component={WSGetDisconnectionDetails} />
          <PrivateRoute path={`${path}/water/bill-amendment/inbox`} component={(props) => <WSBillIAmendMentInbox {...props} parentRoute={path} />} />
          <PrivateRoute
            path={`${path}/sewerage/bill-amendment/inbox`}
            component={(props) => <WSBillIAmendMentInbox {...props} parentRoute={path} />}
          />
          <PrivateRoute path={`${path}/water/wns-search`} component={(props) => <WSSearchIntegrated {...props} parentRoute={path} />} />
          <PrivateRoute path={`${path}/water/bulk-bill`} component={(props) => <WSBulkBillGeneration {...props} parentRoute={path} />} />

          {/* <Route path={`${path}/search`} component={SearchConnectionComponent} />
          <Route path={`${path}/search-results`} component={SearchResultsComponent} /> */}
        </div>
      </React.Fragment>
    </Switch>
  );
};

export default App;
