import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation, Route } from "react-router-dom";
import { PrivateRoute, BackButton, LayoutWrapper, ModuleHeader, ArrowLeft, AppContainer } from "@djb25/digit-ui-react-components";
import TestAcknowledgment from "./TestAcknowledgment";
import { WSMyApplications } from "./WSMyApplications";
import WSResponse from "../employee/WSResponse";
import { HomeIcon } from "@djb25/digit-ui-react-components";

const App = ({ path }) => {
  const location = useLocation();
  const { t } = useTranslation();
  let isMobile = window.Digit.Utils.browser.isMobile();
  let isCommonPTPropertyScreen = window.location.href.includes("/ws/create-application/property-details");
  let isAcknowledgement = window.location.href.includes("/acknowledgement") || window.location.href.includes("/disconnect-acknowledge");
  const WSDisconnectAcknowledgement = Digit?.ComponentRegistryService?.getComponent("WSDisconnectAcknowledgement");
  const WSRestorationAcknowledgement = Digit?.ComponentRegistryService?.getComponent("WSRestorationAcknowledgement");
  const getBackPageNumber = () => {
    let goBacktoFromProperty = -1;
    if (sessionStorage.getItem("VisitedCommonPTSearch") === "true" && isCommonPTPropertyScreen) {
      goBacktoFromProperty = -4;
      return goBacktoFromProperty;
    }
    return goBacktoFromProperty;
  };

  const user = window.Digit.UserService.getUser();
  const tenantId = "dl.djb";
  const userMobileNumber = user?.info?.userName?.match(/^[0-9]{10}$/) ? user?.info?.userName : user?.info?.mobileNumber;
  const isMyApps = location.pathname.includes("/my-applications");

  const { data: wsData } = window.Digit.Hooks.ws.useMyApplicationSearch(
    { filters: { tenantId, mobileNumber: userMobileNumber } },
    { filters: { tenantId, mobileNumber: userMobileNumber }, enabled: isMyApps }
  );
  const { data: swData } = window.Digit.Hooks.ws.useMyApplicationSearch(
    { filters: { tenantId, mobileNumber: userMobileNumber }, BusinessService: "SW" },
    { filters: { tenantId, mobileNumber: userMobileNumber }, enabled: isMyApps }
  );

  let wsCount = wsData?.WaterConnection?.filter((ob) => ob?.applicationType !== "MODIFY_WATER_CONNECTION")?.length || 0;
  let swCount = swData?.SewerageConnections?.filter((ob) => ob?.applicationType !== "MODIFY_SEWERAGE_CONNECTION")?.length || 0;
  let totalAppsCount = wsCount + swCount;

  useEffect(() => {
    const fetchToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          const TokenReq = {
            module: "WS",
            code: code,
            dlReqRef: sessionStorage.getItem("code_verfier_register"),
          };
          const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
          const res = await Digit.DigiLockerService.token({ TokenReq }, tenantId);
          const accessToken = res?.TokenRes?.access_token || res?.access_token;
          if (accessToken) {
            sessionStorage.setItem("DigiLocker.token1", accessToken);
          }

          // Clean up the URL by removing code and state
          urlParams.delete("code");
          urlParams.delete("state");
          const search = urlParams.toString();
          const newUrl = window.location.pathname + (search ? "?" + search : "");
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error("Error fetching DigiLocker token", error);
        }
      }
    };

    fetchToken();
  }, []);

  const crumbs = [
    // {
    //   path: "/digit-ui/citizen",
    //   label: t("CS_COMMON_HOME"),
    //   show: true,
    // },
    {
      path: "/digit-ui/employee",
      show: true,
      style: isMobile ? { width: "20%" } : {},
      icon: HomeIcon,
    },
    {
      path: "/digit-ui/citizen/ws/create-application",
      label: t("WS_COMMON_APPL_NEW_CONNECTION"),
      show: location.pathname.includes("/create-application") || location.pathname.includes("/info"),
    },
    {
      path: "/digit-ui/citizen/ws/search",
      label: t("CS_WS_SEARCH_CONNECTION"),
      show: location.pathname.includes("/search"),
    },
    {
      path: "/digit-ui/citizen/ws/my-applications",
      label: `${t("CS_HOME_MY_APPLICATIONS")} ${totalAppsCount ? `(${totalAppsCount})` : ""}`,
      show: location.pathname.includes("/my-applications"),
    },
    {
      path: "/digit-ui/citizen/ws/my-connections",
      label: t("WS_MYCONNECTIONS_HEADER"),
      show: location.pathname.includes("/my-connections") || location.pathname.includes("/connection/details"),
    },
    {
      path: "/digit-ui/citizen/ws/my-bills",
      label: t("CS_WS_MY_BILLS"),
      show: location.pathname.includes("/my-bills"),
    },
    {
      path: "/digit-ui/citizen/ws/my-payments",
      label: t("CS_WS_MY_PAYMENTS"),
      show: location.pathname.includes("/my-payments"),
    },
    {
      path: "/digit-ui/citizen/ws/old-application",
      label: t("WS_COMMON_APPL_NEW_CONNECTION"),
      show: location.pathname.includes("/old-application"),
    },
    {
      path: location.pathname,
      label: t("WS_APPLICATION_DETAILS_HEADER"),
      show: location.pathname.includes("/connection/application"),
    },
    {
      path: location.pathname,
      label: t("WS_COMMON_CONNECTION_DETAIL"),
      show: location.pathname.includes("/connection/details"),
    },
    {
      path: location.pathname,
      label: t("WS_APPLICATION_DETAILS_HEADER"),
      show: location.pathname.includes("ws-response"),
    },
  ];

  const getDynamicBreadcrumbs = () => {
    return crumbs.filter((crumb) => crumb.show);
  };

  const WSCreate = Digit?.ComponentRegistryService?.getComponent("WSCreate");
  const WSDisconnection = Digit?.ComponentRegistryService?.getComponent("WSDisconnection");
  const WSRestoration = Digit?.ComponentRegistryService?.getComponent("WSRestoration");
  const WSSearchConnectionComponent = Digit?.ComponentRegistryService?.getComponent("WSSearchConnectionComponent");
  const WSSearchResultsComponent = Digit?.ComponentRegistryService?.getComponent("WSSearchResultsComponent");
  const WSCitizenApplicationDetails = Digit?.ComponentRegistryService?.getComponent("WSCitizenApplicationDetails");
  const WSAdditionalDetails = Digit?.ComponentRegistryService?.getComponent("WSAdditionalDetails");
  const WSCitizenConnectionDetails = Digit?.ComponentRegistryService?.getComponent("WSCitizenConnectionDetails");
  const WSCitizenConsumptionDetails = Digit?.ComponentRegistryService?.getComponent("WSCitizenConsumptionDetails");
  const WSMyPayments = Digit?.ComponentRegistryService?.getComponent("WSMyPayments");
  const WSCitizenEditApplication = Digit?.ComponentRegistryService?.getComponent("WSCitizenEditApplication");
  const WSReSubmitDisconnectionApplication = Digit?.ComponentRegistryService?.getComponent("WSReSubmitDisconnectionApplication");
  const WSMyConnections = Digit?.ComponentRegistryService?.getComponent("WSMyConnections");
  const WNSMyBillsComponent = Digit?.ComponentRegistryService?.getComponent("WNSMyBillsComponent");
  const WSOLDApplication = Digit?.ComponentRegistryService?.getComponent("WSOLDApplication");
  const WSInfoPage = Digit?.ComponentRegistryService?.getComponent("WSInfoPage");
  const WSMutationApplication = Digit?.ComponentRegistryService?.getComponent("WSMutationApplication");
  return (
    <React.Fragment>
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
            <div className="employee-form">
              <div className="employee-form-content">
                <PrivateRoute path={`${path}/create-application`} component={WSCreate} />
                <PrivateRoute path={`${path}/disconnect-application`} component={WSDisconnection} />
                <PrivateRoute path={`${path}/restore-application`} component={WSRestoration} />
                <PrivateRoute path={`${path}/disconnect-acknowledge`} component={WSDisconnectAcknowledgement} />
                <PrivateRoute path={`${path}/restoration-acknowledge`} component={WSRestorationAcknowledgement} />
                <PrivateRoute path={`${path}/resubmit-disconnect-application`} component={WSReSubmitDisconnectionApplication} />
                <Route path={`${path}/search`} component={WSSearchConnectionComponent} />
                <PrivateRoute path={`${path}/my-bills`} component={WNSMyBillsComponent} />
                <Route path={`${path}/search-results`} component={WSSearchResultsComponent} />
                <Route path={`${path}/test-acknowledgment`} component={TestAcknowledgment} />
                <PrivateRoute path={`${path}/my-payments`} component={WSMyPayments} />
                <PrivateRoute path={`${path}/my-applications`} component={WSMyApplications} />
                <PrivateRoute path={`${path}/my-connections`} component={WSMyConnections} />
                <PrivateRoute path={`${path}/connection/application/:acknowledgementIds`} component={WSCitizenApplicationDetails} />
                <PrivateRoute path={`${path}/connection/additional/:acknowledgementIds`} component={WSAdditionalDetails} />
                <PrivateRoute path={`${path}/connection/details/:acknowledgementIds`} component={WSCitizenConnectionDetails} />
                <PrivateRoute path={`${path}/consumption/details`} component={WSCitizenConsumptionDetails} />
                <PrivateRoute path={`${path}/edit-application/:tenantId`} component={WSCitizenEditApplication} />
                <PrivateRoute path={`${path}/modify-connection/:tenantId`} component={WSCitizenEditApplication} />
                <PrivateRoute
                  path={`${path}/old-application`}
                  component={() => (
                    <LayoutWrapper layoutClass="action">
                      <WSOLDApplication />
                    </LayoutWrapper>
                  )}
                />
                <PrivateRoute path={`${path}/info`} component={WSInfoPage} />
                <PrivateRoute path={`${path}/ws-response`} component={WSResponse} />
                <PrivateRoute path={`${path}/mutation-application`} component={WSMutationApplication} />
              </div>
            </div>
          </div>
        </AppContainer>
      </Switch>
    </React.Fragment>
  );
};

export default App;
