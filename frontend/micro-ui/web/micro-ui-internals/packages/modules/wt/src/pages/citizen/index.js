import {
  AppContainer,
  PrivateRoute,
  ModuleHeader,
  ArrowLeft,
  HomeIcon,
  CitizenHomeCard,
  CHBIcon,
  PropertyHouse,
} from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Switch, useRouteMatch, useLocation } from "react-router-dom";
import { APPLICATION_PATH } from "../../utils";
import SearchApp from "../employee/SearchApp";

// Main Routing Page used for routing accorss the Water Tanker Module
const App = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { path } = useRouteMatch();
  const WTCreate = Digit?.ComponentRegistryService?.getComponent("WTCreate");
  const WTApplicationDetails = Digit?.ComponentRegistryService?.getComponent("WTApplicationDetails");
  const MTApplicationDetails = Digit?.ComponentRegistryService?.getComponent("MTApplicationDetails");
  const TPApplicationDetails = Digit?.ComponentRegistryService?.getComponent("TPApplicationDetails");
  const WTMyApplications = Digit?.ComponentRegistryService?.getComponent("WTMyApplications");
  const Inbox = Digit.ComponentRegistryService.getComponent("WTEmpInbox");
  const ApplicationDetails = Digit?.ComponentRegistryService?.getComponent("ApplicationDetails");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    let crumbs = [
      { icon: HomeIcon, path: "/digit-ui/citizen" },
      { label: t("WT_MODULE_NAME"), path: `${path}/wt-Vendor` },
    ];

    if (pathname.includes("/inbox")) {
      let label = "ES_COMMON_INBOX";
      if (pathname.includes("/mt/inbox")) {
        crumbs = [
          { icon: HomeIcon, path: "/digit-ui/citizen" },
          { label: t("ACTION_TEST_MT"), path: `${path}/mt-Vendor` },
        ];
      }
      crumbs.push({ label: t(label) });
    } else if (pathname.includes("/my-bookings")) {
      let label = "WT_SEARCH_BOOKINGS";
      if (pathname.includes("/mt/my-bookings")) label = "MT_SEARCH_BOOKINGS";
      crumbs.push({ label: t(label) });
    } else if (pathname.includes("/status")) {
      crumbs.push({ label: t("WT_MY_APPLICATIONS") });
    } else if (pathname.includes("/booking/") || pathname.includes("/booking-details") || pathname.includes("/bookingsearch/booking-details")) {
      crumbs.push({ label: t("ES_COMMON_INBOX"), path: pathname.includes("/mt/") ? `${path}/mt/inbox` : `${path}/inbox` });
      crumbs.push({ label: t("WT_BOOKING_DETAILS") });
    }

    return crumbs;
  };

  const getInboxInitialState = (service) => ({
    searchParams: {
      uuid: { code: "ASSIGNED_TO_ALL", name: "ES_INBOX_ASSIGNED_TO_ALL" },
      services: [service],
      applicationStatus: [],
      locality: [],
    },
  });
  // Initial state for waterTanker inbox and mobileToilet inbox
  const inboxInitialStateWT = getInboxInitialState("watertanker");
  const inboxInitialStateMT = getInboxInitialState("mobileToilet");

  return (
    <span style={{ width: "100%" }}>
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
            <div className="employee-form-content abcd">
              <PrivateRoute
                path={`${path}/inbox`}
                component={() => (
                  <Inbox
                    // Inbox component for waterTanker
                    useNewInboxAPI={true}
                    parentRoute={path}
                    moduleCode="WT"
                    businessService="watertanker"
                    filterComponent="WT_INBOX_FILTER"
                    initialStates={inboxInitialStateWT}
                    isInbox={true}
                  />
                )}
              />

              <PrivateRoute
                path={`${path}/mt/inbox`}
                component={() => (
                  <Inbox
                    // Inbox component for mobileToilet
                    useNewInboxAPI={true}
                    parentRoute={path}
                    businessService="mobileToilet"
                    moduleCode="MT"
                    filterComponent="WT_INBOX_FILTER"
                    initialStates={inboxInitialStateMT}
                    isInbox={true}
                  />
                )}
              />

              <PrivateRoute path={`${path}/request-service`} component={WTCreate} />
              <PrivateRoute path={`${path}/status`} component={WTMyApplications} />
              <PrivateRoute path={`${path}/booking/waterTanker/:acknowledgementIds/:tenantId`} component={WTApplicationDetails} />
              <PrivateRoute path={`${path}/booking/mobileToilet/:acknowledgementIds/:tenantId`} component={MTApplicationDetails} />
              <PrivateRoute path={`${path}/booking/treePruning/:acknowledgementIds/:tenantId`} component={TPApplicationDetails} />
              <PrivateRoute path={`${path}/booking-details/:id`} component={() => <ApplicationDetails parentRoute={path} />} />
              <PrivateRoute path={`${path}/bookingsearch/booking-details/:id`} component={() => <ApplicationDetails parentRoute={path} />} />
              <PrivateRoute
                path={`${path}/wt-Vendor`}
                component={() =>
                  Digit.UserService.hasAccess(["WT_VENDOR"]) ? (
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", width: "100%", padding: "8px 0" }}>
                      <CitizenHomeCard
                        header={t("WT_MODULE_NAME")}
                        links={[
                          { i18nKey: t("ES_COMMON_INBOX"), link: `${APPLICATION_PATH}/citizen/wt/inbox` },
                          { i18nKey: t("ES_COMMON_APPLICATION_SEARCH"), link: `${APPLICATION_PATH}/citizen/wt/my-bookings` },
                          { i18nKey: t("WT_REQUEST_TANKER"), link: `${APPLICATION_PATH}/citizen/wt/request-service` },
                        ]}
                        Icon={() => <CHBIcon className="fill-path-primary-main" />}
                      />
                      <CitizenHomeCard
                        header={t("TITLE_VENDOR_MANAGEMENT")}
                        links={[{ i18nKey: t("SEARCH_VENDOR"), link: `${APPLICATION_PATH}/citizen/vendor/search-vendor` }]}
                        Icon={() => <PropertyHouse className="fill-path-primary-main" />}
                      />
                    </div>
                  ) : (
                    <Redirect
                      to={{
                        pathname: `${APPLICATION_PATH}/citizen/login`,
                        state: { from: `${path}/wt-Vendor`, role: "WT_VENDOR" },
                      }}
                    />
                  )
                }
              />
              <PrivateRoute
                path={`${path}/mt-Vendor`}
                component={() =>
                  Digit.UserService.hasAccess(["MT_VENDOR"]) ? (
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", width: "100%", padding: "8px 0" }}>
                      <CitizenHomeCard
                        header={t("ACTION_TEST_MT")}
                        links={[
                          { i18nKey: t("ES_COMMON_INBOX"), link: `${APPLICATION_PATH}/citizen/wt/mt/inbox` },
                          { i18nKey: t("ES_COMMON_APPLICATION_SEARCH"), link: `${APPLICATION_PATH}/citizen/wt/mt/my-bookings` },
                          { i18nKey: t("MT_REQUEST_TANKER"), link: `${APPLICATION_PATH}/citizen/wt/request-service` },
                        ]}
                        Icon={() => <CHBIcon className="fill-path-primary-main" />}
                      />
                      <CitizenHomeCard
                        header={t("TITLE_VENDOR_MANAGEMENT")}
                        links={[{ i18nKey: t("SEARCH_VENDOR"), link: `${APPLICATION_PATH}/citizen/vendor/search-vendor` }]}
                        Icon={() => <PropertyHouse className="fill-path-primary-main" />}
                      />
                    </div>
                  ) : (
                    <Redirect
                      to={{
                        pathname: `${APPLICATION_PATH}/citizen/login`,
                        state: { from: `${path}/mt-Vendor`, role: "MT_VENDOR" },
                      }}
                    />
                  )
                }
              />
              <PrivateRoute path={`${path}/my-bookings`} component={(props) => <SearchApp {...props} parentRoute={path} moduleCode={"WT"} />} />
              <PrivateRoute path={`${path}/mt/my-bookings`} component={(props) => <SearchApp {...props} parentRoute={path} moduleCode={"MT"} />} />
            </div>
          </div>
        </AppContainer>
      </Switch>
    </span>
  );
};

export default App;
