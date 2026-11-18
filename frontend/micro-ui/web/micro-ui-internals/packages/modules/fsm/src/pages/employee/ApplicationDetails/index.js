import React, { useEffect, useState } from "react";
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
  Menu,
  Toast,
  ImageViewer,
} from "@djb25/digit-ui-react-components";

import ActionModal from "./Modal";
import TLCaption from "../../../components/TLCaption";

import { useQueryClient } from "react-query";

import { Link, useHistory, useParams } from "react-router-dom";
import { ViewImages } from "../../../components/ViewImages";
import WorkflowTimeline from "../../../components/WorkflowTimeline";

const ApplicationDetails = (props) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const state = Digit.ULBService.getStateId();
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  let { id: applicationNumber } = useParams();
  const [displayMenu, setDisplayMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [imageZoom, setImageZoom] = useState(null);
  const [hideTimeline, setHideTimeline] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  const userType = props.userType || "EMPLOYEE";

  const { isLoading, data: applicationDetails } = Digit.Hooks.fsm.useApplicationDetail(t, tenantId, applicationNumber, {}, userType);
  const { isLoading: isDataLoading, data: applicationData } = Digit.Hooks.fsm.useSearch(
    tenantId,
    { applicationNos: applicationNumber },
    { staleTime: Infinity }
  );

  const { mutate } = Digit.Hooks.fsm.useApplicationActions(tenantId);

  const workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId: applicationDetails?.tenantId || tenantId,
    id: applicationNumber,
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
    role: userType === "DSO" ? "FSM_DSO" : "FSM_EMPLOYEE",
    serviceData: applicationDetails,
    getTripData: true,
  });

  useEffect(() => {
    if (showToast) {
      workflowDetails.revalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  function onActionSelect(action) {
    setSelectedAction(action);
    setDisplayMenu(false);
  }

  useEffect(() => {
    switch (selectedAction) {
      case "SCHEDULE":
      case "DSO_ACCEPT":
      case "ACCEPT":
      case "ASSIGN":
      case "GENERATE_DEMAND":
      case "FSM_GENERATE_DEMAND":
      case "REASSIGN":
      case "COMPLETE":
      case "COMPLETED":
      case "CANCEL":
      case "SENDBACK":
      case "DSO_REJECT":
      case "REJECT":
      case "DECLINE":
      case "REASSING":
      case "UPDATE":
        return setShowModal(true);
      case "SUBMIT":
      case "FSM_SUBMIT":
        return history.push("/digit-ui/employee/fsm/modify-application/" + applicationNumber);
      case "PAY":
      case "FSM_PAY":
      case "ADDITIONAL_PAY_REQUEST":
        return history.push(`/digit-ui/employee/payment/collect/FSM.TRIP_CHARGES/${applicationNumber}?workflow=FSM`);
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction]);

  const closeModal = () => {
    setSelectedAction(null);
    setShowModal(false);
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const submitAction = (data) => {
    mutate(data, {
      onError: (error, variables) => {
        setShowToast({ key: "error", action: error });
        setTimeout(closeToast, 5000);
      },
      onSuccess: (data, variables) => {
        setShowToast({ key: "success", action: selectedAction });
        setTimeout(closeToast, 5000);
        queryClient.invalidateQueries("FSM_CITIZEN_SEARCH");
        const inbox = queryClient.getQueryData("FUNCTION_RESET_INBOX");
        inbox?.revalidate();
      },
    });
    closeModal();
  };

  function zoomImageWrapper(imageSource, index) {
    setImageZoom(imageSource);
  }

  function onCloseImageZoom() {
    setImageZoom(null);
  }

  if (isLoading || isDataLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
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

          {showModal ? (
            <ActionModal
              t={t}
              action={selectedAction}
              tenantId={tenantId}
              state={state}
              id={applicationNumber}
              closeModal={closeModal}
              submitAction={submitAction}
              actionData={workflowDetails?.data?.timeline}
              module={workflowDetails?.data?.applicationBusinessService}
            />
          ) : null}
          {showToast && (
            <Toast
              error={showToast.key === "error" ? true : false}
              label={t(showToast.key === "success" ? `ES_FSM_${showToast.action}_UPDATE_SUCCESS` : showToast.action)}
              onClose={closeToast}
            />
          )}
          {!workflowDetails?.isLoading &&
            workflowDetails?.data?.nextActions?.length === 1 &&
            workflowDetails?.data?.nextActions?.[0]?.action !== "RATE" && (
              <ActionBar style={{ zIndex: "19" }}>
                <SubmitBar
                  label={t(`ES_FSM_${workflowDetails?.data?.nextActions[0].action}`) || t(workflowDetails?.data?.nextActions[0].action)}
                  onSubmit={() => onActionSelect(workflowDetails?.data?.nextActions[0].action)}
                />
              </ActionBar>
            )}
          {!workflowDetails?.isLoading && workflowDetails?.data?.nextActions?.length > 1 && (
            <ActionBar style={{ zIndex: "19" }}>
              {displayMenu && workflowDetails?.data?.nextActions ? (
                <Menu
                  localeKeyPrefix={"ES_FSM"}
                  options={workflowDetails?.data?.nextActions.map((action) => action.action)}
                  t={t}
                  onSelect={onActionSelect}
                />
              ) : null}
              <SubmitBar label={t("ES_COMMON_TAKE_ACTION")} onSubmit={() => setDisplayMenu(!displayMenu)} />
            </ActionBar>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ApplicationDetails;
