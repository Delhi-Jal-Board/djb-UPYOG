import { Header, MultiLink, Button, SubmitBar, EditIcon } from "@djb25/digit-ui-react-components";
import WTEditApplicationModal from "../../components/WTEditApplicationModal";
import TripImages from "../../components/TripImages";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "react-router-dom";
import ApplicationDetailsTemplate from "../../../../templates/ApplicationDetails";
import WorkflowTimeline from "../../components/WorkflowTimeline";

/*
    The ApplicationDetails component fetches and displays details of an application 
    (either Water Tanker or Mobile Toilet) based on a booking number from the URL parameter. 
    It includes functionality for displaying download options like receipt and permission letter, 
    managing workflow details, and handling PDF generation for receipts/letters. 
    The component integrates with hooks for data fetching and mutation, 
    and provides a UI for interacting with the application details.
*/

const ApplicationDetails = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [hideTimeline, setHideTimeline] = React.useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  // const { data: storeData } = Digit.Hooks.useStore.getInitData();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  // const { tenants } = storeData || {};
  const { id: bookingNo } = useParams();
  const [showToast, setShowToast] = useState(null);
  const [appDetailsToShow, setAppDetailsToShow] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  // const [showOptions, setShowOptions] = useState(false);
  const [BusinessService, setBusinessService] = useState("watertanker"); // Default to water tanker service
  // Determine business service dynamically
  const isFixedPoint = location.pathname.includes("/fixed-point/");
  const isWaterTanker = bookingNo?.startsWith("WT"); // Water Tanker
  const isTreePruning = bookingNo?.startsWith("TP"); // Tree Pruning
  const businessService = isFixedPoint ? "watertanker-fixedpoint" : (isWaterTanker ? "watertanker" : isTreePruning ? "treePruning" : "mobileToilet");
  const user = Digit.UserService.getUser().info;

  // Store the booking number in session storage with key based on service type
  const storageKey = isWaterTanker ? "wt" : isTreePruning ? "tp" : "mt";
  sessionStorage.setItem(storageKey, bookingNo);

  // Fetch application details based on service type
  const { isLoading, isError, data: applicationDetails, error } = isWaterTanker
    ? Digit.Hooks.wt.useWTApplicationDetail(t, tenantId, bookingNo)
    : isTreePruning
      ? Digit.Hooks.wt.useTPApplicationDetail(t, tenantId, bookingNo)
      : Digit.Hooks.wt.useMTApplicationDetail(t, tenantId, bookingNo);

  // Fetch application action hooks based on service type
  const { isLoading: updatingApplication, isError: updateApplicationError, data: updateResponse, error: updateError, mutate } = isWaterTanker
    ? Digit.Hooks.wt.useWTApplicationAction(tenantId)
    : isTreePruning
      ? Digit.Hooks.wt.useTPApplicationAction(tenantId)
      : Digit.Hooks.wt.useMTApplicationAction(tenantId);

  // Fetch workflow details for the application
  let workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId: applicationDetails?.applicationData?.tenantId || tenantId,
    id: applicationDetails?.applicationData?.applicationData?.bookingNo,
    moduleCode: businessService,
    role: isWaterTanker ? ["WT_CEMP"] : isTreePruning ? ["TP_CEMP"] : ["MT_CEMP"],
  });

  const closeToast = () => {
    setShowToast(null);
  };
  useEffect(() => {
    if (applicationDetails) {
      let details = _.cloneDeep(applicationDetails);

      const bookingStatus =
        details?.applicationData?.applicationData?.bookingStatus;

      const isDelivered =
        bookingStatus === "DELIVERED" ||
        bookingStatus === "TANKER_DELIVERED";

      if (details?.applicationDetails?.length > 0 && !isDelivered && isFixedPoint) {
        details.applicationDetails[0].Component = () => (
          <div
            onClick={() => setShowEditModal(true)}
            style={{
              float: "right",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: "#f47738",
              gap: "8px",
              padding: "4px 12px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #f47738",
              transition: "all 0.2s ease",
            }}
          >
            <EditIcon style={{ fill: "#f47738", width: "16px", height: "16px" }} />
            <span style={{ fontWeight: "600", fontSize: "14px" }}>
              {t("WT_EDIT_FIELDS")}
            </span>
          </div>
        );
        if (details?.applicationData?.applicationDetails?.length > 0) {
          details.applicationData.applicationDetails[0].Component = details.applicationDetails[0].Component;
        }
      } else if (details?.applicationDetails?.length > 0) {
        delete details.applicationDetails[0].Component;
        if (details?.applicationData?.applicationDetails?.length > 0) {
          delete details.applicationData.applicationDetails[0].Component;
        }
      }

      const tripReport = details?.applicationData?.applicationData?.driverTripReport?.[0];
      if (tripReport && bookingStatus === "TANKER_DELIVERED") {
        const newSection = {
          title: "WT_DRIVER_TRIP_REPORT",
          asSectionHeader: true,
          values: [
            { title: "WT_START_LATITUDE", value: tripReport?.startLatitude?.toString() || t("CS_NA") },
            { title: "WT_START_LONGITUDE", value: tripReport?.startLongitude?.toString() || t("CS_NA") },
            { title: "WT_END_LATITUDE", value: tripReport?.endLatitude?.toString() || t("CS_NA") },
            { title: "WT_END_LONGITUDE", value: tripReport?.endLongitude?.toString() || t("CS_NA") }
          ],
          belowComponent: () => <TripImages startFileStoreId={tripReport?.startFileStoreId} endFileStoreId={tripReport?.endFileStoreId} />
        };
        
        if (details?.applicationDetails) {
          const vehicleIndex = details.applicationDetails.findIndex(sec => sec.title === "WT_VEHICLE_DETAILS");
          if (vehicleIndex !== -1) {
            details.applicationDetails.splice(vehicleIndex + 1, 0, newSection);
          } else {
            details.applicationDetails.push(newSection);
          }
        }

        if (details?.applicationData?.applicationDetails) {
          const vehicleIndex = details.applicationData.applicationDetails.findIndex(sec => sec.title === "WT_VEHICLE_DETAILS");
          if (vehicleIndex !== -1) {
            details.applicationData.applicationDetails.splice(vehicleIndex + 1, 0, newSection);
          } else {
            details.applicationData.applicationDetails.push(newSection);
          }
        }
      }

      setAppDetailsToShow(details);
    }
  }, [applicationDetails, isFixedPoint]);

  useEffect(() => {
    if (
      workflowDetails?.data?.applicationBusinessService &&
      !(
        (workflowDetails?.data?.applicationBusinessService === "watertanker" && businessService === "watertanker") ||
        (workflowDetails?.data?.applicationBusinessService === "mobileToilet" && businessService === "mobileToilet") ||
        (workflowDetails?.data?.applicationBusinessService === "treePruning" && businessService === "treePruning")
      )
    ) {
      setBusinessService(workflowDetails?.data?.applicationBusinessService);
    }
  }, [workflowDetails.data]);

  // const [showTimeline, setShowTimeline] = useState(true);
  // let dowloadOptions = [];
  return (
    <React.Fragment>
      {/* <div className="employee-application-details" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <Header styles={{ margin: "0px", fontSize: "32px" }}>{t("BOOKING_DETAILS")}</Header>
      </div> */}
      {showEditModal && (
        <WTEditApplicationModal
          t={t}
          applicationData={appDetailsToShow?.applicationData?.applicationData}
          closeModal={() => setShowEditModal(false)}
        />
      )}

      {/* Left Column: Workflow Timeline */}
      <div className={`workflow-timeline-wrapper no-scrollbar ${hideTimeline ? "hide-workflow" : ""}`} style={{ flex: "1 1 300px", maxWidth: hideTimeline ? "fit-content" : "400px", transition: "max-width 0.3s" }}>
        <WorkflowTimeline workflowDetails={workflowDetails} />
      </div>

      {/* Right Column: Application Details */}
      <div style={{ flex: "2 1 500px", minWidth: "300px", overflowY: "auto" }}>
        <ApplicationDetailsTemplate
          applicationDetails={appDetailsToShow?.applicationData}
          isLoading={isLoading}
          isDataLoading={isLoading}
          applicationData={appDetailsToShow?.applicationData?.applicationData}
          mutate={mutate}
          workflowDetails={workflowDetails}
          businessService={businessService}
          moduleCode={isFixedPoint ? "request-service.water_tanker" : "request-service"}
          showToast={showToast}
          setShowToast={setShowToast}
          closeToast={closeToast}
          timelineStatusPrefix={""}
          forcedActionPrefix={"RS"}
          statusAttribute={"state"}
          MenuStyle={{ color: "#FFFFFF", fontSize: "18px" }}
          showTimeLine={false} // Hide default timeline
        />
      </div>
    </React.Fragment>
  );
};

export default React.memo(ApplicationDetails);
