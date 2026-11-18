import { Header, MultiLink, Toast } from "@djb25/digit-ui-react-components";
import React, { Fragment, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import ApplicationDetailsTemplate from "../../../../templates/ApplicationDetails";
import WorkflowTimeline from "../../components/WorkflowTimeline";
import getPDFData from "../../utils/getWsAckDataForBillAmendPdf";

const ApplicationDetailsBillAmendment = () => {
  const queryParams = Digit.Hooks.useQueryParams();
  const applicationNumber = queryParams?.applicationNumber || queryParams?.applicationNo;
  const isEmployee = window.location.href.includes("/employee");
  const tenantId =
    queryParams?.tenantId ||
    (Digit.ULBService.getCurrentTenantId() && Digit.ULBService.getCurrentTenantId() !== "dl"
      ? Digit.ULBService.getCurrentTenantId()
      : "dl.djb");
  const { t } = useTranslation();
  let serviceType = "WATER";
  if (applicationNumber?.includes("SW")) serviceType = "SEWERAGE";
  const [showToast, setShowToast] = useState(false);
  const [hideTimeline, setHideTimeline] = React.useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const menuRef = useRef();

  const { isLoading, isError, data: applicationDetails, error } = Digit.Hooks.ws.useWSApplicationDetailsBillAmendment(
    t,
    tenantId,
    applicationNumber,
    serviceType,
    { enabled: !!applicationNumber }
  );

  const businessService = applicationDetails?.processInstancesDetails?.[0]?.businessService || (serviceType === "WATER" ? "WS.AMENDMENT" : "SW.AMENDMENT");
  const workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId,
    id: applicationNumber,
    moduleCode: businessService,
    config: { enabled: !!applicationNumber },
  });

  const allNextActions = [
    ...(workflowDetails?.data?.actionState?.nextActions || []),
    ...(workflowDetails?.data?.nextActions || []),
  ];

  allNextActions.forEach((action) => {
    if (["RE-SUBMIT", "RESUBMIT", "RE_SUBMIT", "SUBMIT", "EDIT"].includes(action?.action)) {
      let pathName = isEmployee
        ? `/digit-ui/employee/ws/bill-amendment?connectionNumber=${applicationDetails?.applicationData?.connectionNo}&tenantId=${tenantId}&isEdit=true`
        : `/digit-ui/citizen/ws/bill-amendment?connectionNumber=${applicationDetails?.applicationData?.connectionNo}&tenantId=${tenantId}&isEdit=true`;
      action.redirectionUrll = {
        action: "RE-SUBMIT-APPLICATION",
        pathname: pathName,
        state: {
          applicationDetails: applicationDetails,
          action: "RE-SUBMIT-APPLICATION",
        },
      };
    }
  });
  const {
    isLoading: updatingApplication,
    isError: updateApplicationError,
    data: updateResponse,
    error: updateError,
    isSuccess,
    mutate,
  } = Digit.Hooks.ws.useApplicationActionsBillAmendUpdate();
  // useEffect(() => {
  //   isSuccess && !updateApplicationError ? setShowToast(isSuccess) : null;
  //   updateApplicationError && !isSuccess ? setShowToast(updateApplicationError) : null;
  // }, [updateApplicationError, isSuccess]);

  useEffect(() => {
    if (showToast) {
      setTimeout(() => setShowToast(false), 5000);
    }
  }, [showToast]);

  const [showOptions, setShowOptions] = useState(false);

  const closeMenu = () => {
    setShowOptions(false);
  };
  Digit.Hooks.useClickOutside(menuRef, closeMenu, showOptions);

  async function getCouponPDF({ tenantId, Amendments }) {
    const stateId = Digit.ULBService.getStateId();
    const response = await Digit.PaymentService.generatePdf(stateId, { Amendments: [Amendments] }, "bill-amendment-credit-note");
    const fileStore = await Digit.PaymentService.printReciept(stateId, { fileStoreIds: response.filestoreIds[0] });
    window.open(fileStore[response?.filestoreIds[0]], "_blank");
  }

  const getAckPdf = async (amendment, tenantId, t, tableData, app) => {
    const PDFdata = getPDFData(amendment, tenantId, t, tableData, app);
    PDFdata.then((ress) => Digit.Utils.pdf.generateBillAmendPDF(ress));
  };
  const dowloadOptions =
    applicationDetails?.amendment?.status === "CONSUMED"
      ? [
          // {
          //   order: 2,
          //   label: t("WS_DOWNLOAD_COUPON_PDF"),
          //   onClick: () => getCouponPDF({ tenantId, Amendments: applicationDetails?.amendment }),
          // },
          {
            order: 1,
            label: t("WS_ACK_PDF"),
            onClick: () => getAckPdf(applicationDetails?.amendment, tenantId, t, applicationDetails?.applicationDetails, applicationDetails),
          },
        ]
      : [
          {
            order: 1,
            label: t("WS_ACK_PDF"),
            onClick: () => getAckPdf(applicationDetails?.amendment, tenantId, t, applicationDetails?.applicationDetails, applicationDetails),
          },
        ];

  return (
    <Fragment>
      <div className={"employee-main-application-details"} style={{ display: "flex", gap: "20px" }}>
        {isEmployee && (
          <div
            className={`workflow-timeline-wrapper no-scrollbar ${hideTimeline ? "hide-workflow" : ""}`}
            style={{ flex: "1 1 300px", maxWidth: hideTimeline ? "fit-content" : "400px", transition: "max-width 0.3s" }}
          >
            <WorkflowTimeline workflowDetails={workflowDetails} hideTimeline={hideTimeline} setHideTimeline={setHideTimeline} />
          </div>
        )}

        <div style={{ flex: "2 1 500px", minWidth: "300px", position: "relative" }}>
          {dowloadOptions && dowloadOptions.length > 0 && (
            <div style={{ position: "absolute", right: "24px", zIndex: 11 }}>
              <MultiLink
                className="multilinkWrapper employee-mulitlink-main-divNew"
                onHeadClick={() => setShowOptions(!showOptions)}
                displayOptions={showOptions}
                options={dowloadOptions}
                downloadBtnClassName={"employee-download-btn-className"}
                optionsClassName={"employee-options-btn-className"}
                ref={menuRef}
              />
            </div>
          )}
          <ApplicationDetailsTemplate
            applicationDetails={applicationDetails}
            isLoading={isLoading}
            isDataLoading={isLoading}
            applicationData={applicationDetails?.applicationData}
            mutate={mutate}
            workflowDetails={workflowDetails}
            businessService={businessService}
            moduleCode="WS"
            showToast={showToast}
            setShowToast={setShowToast}
            closeToast={() => setShowToast(null)}
            timelineStatusPrefix={`WF_${businessService?.toUpperCase()}_`}
            showTimeLine={!isEmployee}
          />
        </div>
      </div>
      {showToast ? (
        <Toast
          isDleteBtn={true}
          error={updateApplicationError ? "WS_APPLICATION_UPDATE_ERROR" : null}
          label={isSuccess ? showToast?.label : updateError?.Error}
        />
      ) : null}
    </Fragment>
  );
};

export default ApplicationDetailsBillAmendment;
