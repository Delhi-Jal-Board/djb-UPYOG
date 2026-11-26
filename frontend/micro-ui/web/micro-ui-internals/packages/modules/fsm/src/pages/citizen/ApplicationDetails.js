import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardSubHeader,
  CardSectionHeader,
  StatusTable,
  Row,
  SubmitBar,
  Loader,
  ActionBar,
  ImageViewer,
  Header,
  MultiLink,
} from "@djb25/digit-ui-react-components";
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import getPDFData from "../../getPDFData";
import { ViewImages } from "../../components/ViewImages";
import WorkflowTimeline from "../../components/WorkflowTimeline";

const ApplicationDetails = (props) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const history = useHistory();
  const { state: locState } = useLocation();
  const tenantId = locState?.tenantId || Digit.ULBService.getCurrentTenantId();
  const state = Digit.ULBService.getStateId();

  const [showOptions, setShowOptions] = useState(false);
  const [imageZoom, setImageZoom] = useState(null);
  const [hideTimeline, setHideTimeline] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  const { isLoading, data: applicationDetails } = Digit.Hooks.fsm.useApplicationDetail(t, tenantId, id, {}, "DSO");
  const { isLoading: isDataLoading, data: applicationData } = Digit.Hooks.fsm.useSearch(
    tenantId,
    { applicationNos: id },
    { staleTime: Infinity }
  );

  const workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId: applicationDetails?.tenantId || tenantId,
    id: id,
    moduleCode:
      applicationData?.paymentPreference === "POST_PAY"
        ? "FSM_POST_PAY_SERVICE"
        : applicationData?.advanceAmount === 0
        ? "PAY_LATER_SERVICE"
        : applicationData?.advanceAmount > 0
        ? "FSM_ADVANCE_PAY_SERVICE"
        : applicationData?.paymentPreference === null &&
          applicationData?.additionalDetails?.tripAmount === 0 &&
          applicationData?.advanceAmount === null
        ? "FSM_ZERO_PAY_SERVICE"
        : "FSM",
    role: "CITIZEN",
    serviceData: applicationDetails,
    getTripData: true,
  });

  const { data: paymentsHistory } = Digit.Hooks.fsm.usePaymentHistory(tenantId, id);
  const { data: storeData } = Digit.Hooks.useStore.getInitData();
  const { tenants } = storeData || {};

  const handleDownloadPdf = async () => {
    const tenantInfo = tenants?.find((tenant) => tenant.code === (applicationDetails?.tenantId || tenantId));
    const data = getPDFData({ ...applicationData, slum: applicationData?.address?.slumName }, tenantInfo, t);
    Digit.Utils.pdf.generate(data);
  };

  const downloadPaymentReceipt = async () => {
    const receiptFile = { filestoreIds: [paymentsHistory?.Payments?.[0]?.fileStoreId] };

    if (!receiptFile?.filestoreIds?.[0]) {
      const newResponse = await Digit.PaymentService.generatePdf(state, { Payments: [paymentsHistory?.Payments?.[0]] }, "fsm-receipt");
      const fileStore = await Digit.PaymentService.printReciept(state, { fileStoreIds: newResponse?.filestoreIds?.[0] });
      window.open(fileStore[newResponse?.filestoreIds?.[0]], "_blank");
    } else {
      const fileStore = await Digit.PaymentService.printReciept(state, { fileStoreIds: receiptFile?.filestoreIds?.[0] });
      window.open(fileStore[receiptFile?.filestoreIds?.[0]], "_blank");
    }
  };

  const dowloadOptions =
    paymentsHistory?.Payments?.length > 0
      ? [
          {
            label: t("CS_COMMON_APPLICATION_ACKNOWLEDGEMENT"),
            onClick: handleDownloadPdf,
          },
          {
            label: t("CS_COMMON_PAYMENT_RECEIPT"),
            onClick: downloadPaymentReceipt,
          },
        ]
      : [
          {
            label: t("CS_COMMON_APPLICATION_ACKNOWLEDGEMENT"),
            onClick: handleDownloadPdf,
          },
        ];

  function zoomImageWrapper(imageSource, index) {
    setImageZoom(imageSource);
  }

  function onCloseImageZoom() {
    setImageZoom(null);
  }

  if (isLoading || isDataLoading) {
    return <Loader />;
  }

  if (!applicationDetails || !applicationDetails?.applicationDetails || applicationDetails?.applicationDetails?.length === 0) {
    return (
      <Card>
        <p style={{ textAlign: "center", margin: "16px 0" }}>
          {t("CS_NO_APPLICATION_FOUND", "No application details found.")}
        </p>
      </Card>
    );
  }

  return (
    <React.Fragment>
      <div
        className="cardHeaderWithOptions"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "100%",
          marginBottom: "16px",
        }}
      >
        <Header style={{ margin: "0" }}>{t("CS_FSM_APPLICATION_DETAIL_TITLE_APPLICATION_DETAILS")}</Header>
        {dowloadOptions && dowloadOptions.length > 0 && (
          <MultiLink
            className="multilinkWrapper"
            onHeadClick={() => setShowOptions(!showOptions)}
            displayOptions={showOptions}
            options={dowloadOptions}
          />
        )}
      </div>

      <div className="employee-main-application-details" style={{ display: "flex", gap: "20px" }}>
        {/* Left Column: Workflow Timeline */}
        <div
          className={`workflow-timeline-wrapper no-scrollbar ${hideTimeline ? "hide-workflow" : ""}`}
          style={{ flex: "1 1 300px", maxWidth: hideTimeline ? "fit-content" : "400px", transition: "max-width 0.3s" }}
        >
          <WorkflowTimeline workflowDetails={workflowDetails} hideTimeline={hideTimeline} setHideTimeline={setHideTimeline} />
        </div>

        {/* Right Column: Application Details */}
        <div style={{ flex: "2 1 500px", minWidth: "300px" }}>
          <Card className="employeeCard-override">
            {applicationDetails?.applicationDetails?.map((detail, index) => (
              <React.Fragment key={index}>
                <div style={{ lineHeight: "19px", maxWidth: "100%", minWidth: "280px" }}>
                  {detail?.title?.trim() &&
                    (index === 0 && !detail.asSectionHeader ? (
                      <CardSubHeader style={{ marginBottom: "16px", fontSize: "24px" }}>{t(detail.title)}</CardSubHeader>
                    ) : (
                      <CardSectionHeader style={{ marginBottom: "16px", marginTop: "16px", fontSize: "24px" }}>
                        {t(detail.title)}
                        {detail?.Component ? <detail.Component /> : null}
                      </CardSectionHeader>
                    ))}

                  <StatusTable style={{ position: "relative", marginTop: "19px" }}>
                    {detail?.values?.map((value, valIndex) => {
                      if (value === null || value === undefined) return null;
                      if (value.map === true && value.value !== "N/A") {
                        return (
                          <Row
                            labelStyle={{ wordBreak: "break-all" }}
                            textStyle={{ wordBreak: "break-all" }}
                            key={t(value.title)}
                            label={t(value.title)}
                            text={<img src={t(value.value)} alt="" />}
                          />
                        );
                      }
                      if (value?.isLink === true) {
                        return (
                          <Row
                            key={t(value.title)}
                            label={t(value.title)}
                            text={
                              <div>
                                <Link to={value?.to}>
                                  <span className="link" style={{ color: "#a82227" }}>
                                    {value?.value}
                                  </span>
                                </Link>
                              </div>
                            }
                            last={valIndex === detail?.values?.length - 1}
                            caption={value.caption}
                            className="border-none"
                          />
                        );
                      }
                      return (
                        <Row
                          className="border-none"
                          key={t(value.title)}
                          label={t(value.title)}
                          text={t(value.value) || value.value || "N/A"}
                          last={valIndex === detail?.values?.length - 1}
                          caption={value.caption}
                        />
                      );
                    })}
                  </StatusTable>
                </div>
              </React.Fragment>
            ))}

            {applicationData?.pitDetail?.additionalDetails?.fileStoreId?.CITIZEN?.length ? (
              <div style={{ lineHeight: "19px", maxWidth: "100%", minWidth: "280px" }}>
                <CardSectionHeader style={{ marginBottom: "16px", marginTop: "16px", fontSize: "24px" }}>
                  {t("ES_FSM_SUB_HEADING_CITIZEN_UPLOADS")}
                </CardSectionHeader>
                <ViewImages
                  fileStoreIds={applicationData?.pitDetail?.additionalDetails?.fileStoreId?.CITIZEN}
                  tenantId={state}
                  onClick={(source, index) => zoomImageWrapper(source, index)}
                />
              </div>
            ) : null}

            {applicationData?.pitDetail?.additionalDetails?.fileStoreId?.FSM_DSO?.length ? (
              <div style={{ lineHeight: "19px", maxWidth: "100%", minWidth: "280px" }}>
                <CardSectionHeader style={{ marginBottom: "16px", marginTop: "16px", fontSize: "24px" }}>
                  {t("ES_FSM_SUB_HEADING_DSO_UPLOADS")}
                </CardSectionHeader>
                <ViewImages
                  fileStoreIds={applicationData?.pitDetail?.additionalDetails?.fileStoreId?.FSM_DSO}
                  tenantId={tenantId}
                  onClick={(source, index) => zoomImageWrapper(source, index)}
                />
              </div>
            ) : null}

            {imageZoom ? <ImageViewer imageSrc={imageZoom} onClose={onCloseImageZoom} /> : null}
          </Card>

          {/* Citizen Actions: Payment or Feedback/Rating */}
          {!workflowDetails?.isLoading &&
            workflowDetails?.data?.nextActions?.length > 0 && (
              <ActionBar style={{ zIndex: "19" }}>
                {workflowDetails?.data?.nextActions?.map((action, index) => {
                  if (action.action === "PAY" || action.action === "FSM_PAY") {
                    return (
                      <SubmitBar
                        key={index}
                        label={t("CS_APPLICATION_DETAILS_MAKE_PAYMENT")}
                        onSubmit={() =>
                          history.push({
                            pathname: `/digit-ui/citizen/payment/my-bills/FSM.TRIP_CHARGES/${id}/?tenantId=${applicationDetails?.tenantId || tenantId}`,
                            state: { tenantId: applicationDetails?.tenantId || tenantId },
                          })
                        }
                      />
                    );
                  }
                  if (action.action === "SUBMIT_FEEDBACK" || action.action === "RATE") {
                    return (
                      <SubmitBar
                        key={index}
                        label={t("CS_APPLICATION_DETAILS_RATE")}
                        onSubmit={() => history.push(`/digit-ui/citizen/fsm/rate/${id}`)}
                      />
                    );
                  }
                  return null;
                })}
              </ActionBar>
            )}

          {/* View Rating when completed and already reviewed */}
          {!workflowDetails?.isLoading &&
            (!workflowDetails?.data?.nextActions || workflowDetails?.data?.nextActions?.length === 0) &&
            applicationData?.additionalDetails?.CheckList?.length > 0 && (
              <ActionBar style={{ zIndex: "19" }}>
                <SubmitBar
                  label={t("CS_FSM_RATE_VIEW")}
                  onSubmit={() => history.push(`/digit-ui/citizen/fsm/rate-view/${id}`)}
                />
              </ActionBar>
            )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ApplicationDetails;
