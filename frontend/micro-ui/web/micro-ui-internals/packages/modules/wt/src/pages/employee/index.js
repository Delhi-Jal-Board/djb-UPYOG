import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import Inbox from "./Inbox";
import SearchApp from "./SearchApp";
import FixedPointScheduleManagement from "./FixedPointScheduleManagement";
import LiveTrackingSystem from "../../components/LiveTrackingSystem";
import AddFillingPointAddress from "../../components/AddFillingPointAddress";
import AddFixPointAddress from "../../components/AddFixPointAddress";
import WTSearchPointAddress from "../../components/SearchFillingPointAddress";
import VendorAssign from "../../components/VendorAssign";
import Reports from "../../components/Reports";

const EmployeeApp = ({ path }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const fixedPointInboxLabel = t("Emergency Inbox") !== "Emergency Inbox" ? `${t("Emergency Inbox")} ${t("ES_COMMON_INBOX")}` : "Emergency Inbox";
  const emergencyRequestLabel =
    t("WT_EMERGENCY_WATER_TANKER_REQUEST") !== "WT_EMERGENCY_WATER_TANKER_REQUEST"
      ? t("WT_EMERGENCY_WATER_TANKER_REQUEST")
      : "Emergency Water Tanker Request";

  sessionStorage.removeItem("revalidateddone");

  /* -------------------------------------------------------------------------- */
  /*                            DYNAMIC BREADCRUMBS                             */
  /* -------------------------------------------------------------------------- */

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    let moduleName = "WT";
    if (pathname.includes("/mt/")) moduleName = "MT";
    if (pathname.includes("/tp/")) moduleName = "TP";

    let crumbs = [
      { icon: HomeIcon, path: "/digit-ui/employee" },
      { label: t("WT_MODULE_NAME"), path: `/digit-ui/employee/module/details?moduleName=${moduleName}` },
    ];

    if (pathname.includes("/fixed-point/inbox")) {
      crumbs.push({ label: fixedPointInboxLabel });
    } else if (pathname.includes("/inbox")) {
      let label = "ES_COMMON_INBOX";
      if (pathname.includes("/tp/inbox")) label = "TP_INBOX";
      crumbs.push({ label: t(label) });
    } else if (pathname.includes("/my-bookings")) {
      let label = "WT_SEARCH_BOOKINGS";
      if (pathname.includes("/mt/my-bookings")) label = "MT_SEARCH_BOOKINGS";
      if (pathname.includes("/tp/my-bookings")) label = "TP_SEARCH_BOOKINGS";
      crumbs.push({ label: t(label) });
    } else if (pathname.includes("/fixed-point/request-service")) {
      crumbs.push({ label: emergencyRequestLabel });
    } else if (pathname.includes("/request-service")) {
      crumbs.push({ label: t("WT_REQUEST_SERVICE") });
    } else if (pathname.includes("/fixed-point/booking-details")) {
      crumbs.push({ label: fixedPointInboxLabel, path: `${path}/fixed-point/inbox` });
      crumbs.push({ label: t("WT_BOOKING_DETAILS") });
    } else if (pathname.includes("/booking-details") || pathname.includes("/bookingsearch/booking-details")) {
      const isSearch = pathname.includes("/bookingsearch");
      if (isSearch) {
        crumbs.push({ label: t("WT_SEARCH_BOOKINGS"), path: `${path}/my-bookings` });
      } else {
        crumbs.push({ label: t("ES_COMMON_INBOX"), path: `${path}/inbox` });
      }
      crumbs.push({ label: t("WT_BOOKING_DETAILS") });
    } else if (pathname.includes("/fixed-point-schedule")) {
      crumbs.push({ label: t("WT_FIXED_POINT_SCHEDULE_MANAGEMENT") });
    } else if (pathname.includes("/live-tracking")) {
      crumbs.push({ label: t("WT_LIVE_TRACKING_SYSTEM") });
    } else if (pathname.includes("/add-filling-point-address")) {
      crumbs.push({ label: t("WT_ADD_FILLING_POINT_ADDRESS") });
    } else if (pathname.includes("/add-fix-point-address")) {
      crumbs.push({ label: t("WT_ADD_FIX_POINT_ADDRESS") });
    } else if (pathname.includes("/search-filling-fix-point")) {
      crumbs.push({ label: t("WT_SEARCH_FIX_POINT") });
    } else if (pathname.includes("/vendor-assign")) {
      crumbs.push({ label: t("WT_VENDOR_ASSIGN") });
    }

    return crumbs;
  };

  /* -------------------------------------------------------------------------- */
  /*                               INBOX STATES                                 */
  /* -------------------------------------------------------------------------- */

  const inboxInitialState = {
    searchParams: {
      uuid: { code: "ASSIGNED_TO_ALL", name: "ES_INBOX_ASSIGNED_TO_ALL" },
      services: ["watertanker"],
      applicationStatus: [],
      locality: [],
    },
  };

  const inboxInitialStateMt = {
    searchParams: {
      uuid: { code: "ASSIGNED_TO_ALL", name: "ES_INBOX_ASSIGNED_TO_ALL" },
      services: ["mobileToilet"],
      applicationStatus: [],
      locality: [],
    },
  };

  const inboxInitialStateTp = {
    searchParams: {
      uuid: { code: "ASSIGNED_TO_ALL", name: "ES_INBOX_ASSIGNED_TO_ALL" },
      services: ["treePruning"],
      applicationStatus: [],
      locality: [],
    },
  };

  const inboxInitialStateFixedPoint = {
    searchParams: {
      uuid: { code: "ASSIGNED_TO_ALL", name: "ES_INBOX_ASSIGNED_TO_ALL" },
      services: ["watertanker-fixedpoint"],
      applicationStatus: [],
      locality: [],
    },
  };

  const ApplicationDetails = Digit?.ComponentRegistryService?.getComponent("ApplicationDetails");

  const WTCreate = Digit?.ComponentRegistryService?.getComponent("WTCreate");
  const WTEmergencyFixedPointCreate = Digit?.ComponentRegistryService?.getComponent("WTEmergencyFixedPointCreate");

  /* -------------------------------------------------------------------------- */
  /*                                   RETURN                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Switch>
      <AppContainer>
        <div className="ground-container employee-app-container form-container">
          <ModuleHeader
            leftContent={
              <React.Fragment>
                <ArrowLeft className="icon" />
                {t("CS_COMMON_BACK")}
              </React.Fragment>
            }
            onLeftClick={() => window.history.back()}
            breadcrumbs={getDynamicBreadcrumbs()}
          />
          {/* ----------------------------- ROUTES ----------------------------- */}
          <div className="employee-form">
            <div className="employee-form-content">
              {/* WT Inbox */}
              <PrivateRoute
                path={`${path}/inbox`}
                component={(props) => (
                  <Inbox
                    {...props}
                    useNewInboxAPI={true}
                    parentRoute={path}
                    businessService="watertanker"
                    moduleCode="WT"
                    filterComponent="WT_INBOX_FILTER"
                    initialStates={inboxInitialState}
                    isInbox={true}
                  />
                )}
              />
              {/* WT Fixed Point Inbox */}
              <PrivateRoute
                path={`${path}/fixed-point/inbox`}
                component={(props) => (
                  <Inbox
                    {...props}
                    useNewInboxAPI={true}
                    parentRoute={path}
                    businessService="watertanker-fixedpoint"
                    detailRoute={`${path}/fixed-point/booking-details`}
                    moduleCode="WT"
                    filterComponent="WT_INBOX_FILTER"
                    initialStates={inboxInitialStateFixedPoint}
                    isInbox={true}
                  />
                )}
              />
              {/* MT Inbox */}
              <PrivateRoute
                path={`${path}/mt/inbox`}
                component={(props) => (
                  <Inbox
                    {...props}
                    useNewInboxAPI={true}
                    parentRoute={path}
                    moduleCode="MT"
                    businessService="mobileToilet"
                    filterComponent="WT_INBOX_FILTER"
                    initialStates={inboxInitialStateMt}
                    isInbox={true}
                  />
                )}
              />
              {/* TP Inbox */}
              <PrivateRoute
                path={`${path}/tp/inbox`}
                component={(props) => (
                  <Inbox
                    {...props}
                    useNewInboxAPI={true}
                    parentRoute={path}
                    moduleCode="TP"
                    businessService="treePruning"
                    filterComponent="WT_INBOX_FILTER"
                    initialStates={inboxInitialStateTp}
                    isInbox={true}
                  />
                )}
              />
              {/* Request Service */}
              <PrivateRoute path={`${path}/request-service`} component={WTCreate} />
              <PrivateRoute path={`${path}/mt/request-service`} component={WTCreate} />
              <PrivateRoute path={`${path}/tp/request-service`} component={WTCreate} />
              {/* Fixed Point Create */}
              <PrivateRoute path={`${path}/fixed-point/request-service`} component={WTEmergencyFixedPointCreate} />
              {/* Booking Details */}
              <PrivateRoute
                path={`${path}/fixed-point/booking-details/:id`}
                component={(props) => (
                  <LayoutWrapper layoutClass="action">
                    <ApplicationDetails {...props} parentRoute={path} />
                  </LayoutWrapper>
                )}
              />
              <PrivateRoute
                path={`${path}/booking-details/:id`}
                component={(props) => (
                  <LayoutWrapper layoutClass="action">
                    <ApplicationDetails {...props} parentRoute={path} />
                  </LayoutWrapper>
                )}
              />
              <PrivateRoute
                path={`${path}/bookingsearch/booking-details/:id`}
                component={(props) => (
                  <LayoutWrapper layoutClass="normal">
                    <ApplicationDetails {...props} parentRoute={path} />
                  </LayoutWrapper>
                )}
              />
              {/* My Bookings */}
              <PrivateRoute path={`${path}/my-bookings`} component={(props) => <SearchApp {...props} parentRoute={path} moduleCode="WT" />} />
              <PrivateRoute path={`${path}/mt/my-bookings`} component={(props) => <SearchApp {...props} parentRoute={path} moduleCode="MT" />} />
              <PrivateRoute path={`${path}/tp/my-bookings`} component={(props) => <SearchApp {...props} parentRoute={path} moduleCode="TP" />} />
              {/* Fixed Point Schedule Management */}
              <PrivateRoute path={`${path}/fixed-point-schedule`} component={FixedPointScheduleManagement} />
              <PrivateRoute path={`${path}/live-tracking`} component={LiveTrackingSystem} />
              <PrivateRoute path={`${path}/add-filling-point-address`} component={AddFillingPointAddress} />
              <PrivateRoute path={`${path}/add-fix-point-address`} component={AddFixPointAddress} />
              <PrivateRoute path={`${path}/search-filling-fix-point`} component={WTSearchPointAddress} />
              <PrivateRoute path={`${path}/vendor-assignment`} component={VendorAssign} />
              <PrivateRoute
                path={`${path}/reports`}
                component={(props) => (
                  <LayoutWrapper layoutClass="normal">
                    <Reports t={t} {...props} parentRoute={path} moduleCode="WT" />
                  </LayoutWrapper>
                )}
              />
            </div>
          </div>
        </div>
      </AppContainer>
    </Switch>
  );
};

export default EmployeeApp;
