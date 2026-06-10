import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation, Route } from "react-router-dom";
import { PrivateRoute, BackButton, LayoutWrapper, ModuleHeader, ArrowLeft, AppContainer } from "@djb25/digit-ui-react-components";
import TestAcknowledgment from "./TestAcknowledgment";
import { WSMyApplications } from "./WSMyApplications";

const App = ({ path }) => {
  const location = useLocation();
  const { t } = useTranslation();
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

  const crumbs = [
    {
      path: "/digit-ui/citizen",
      content: t("CS_COMMON_HOME"),
      show: true,
    },
    {
      path: "/digit-ui/citizen/ws/create-application",
      content: t("CS_WS_CREATE_APPLICATION"),
      show: location.pathname.includes("/create-application"),
    },
    {
      path: "/digit-ui/citizen/ws/search",
      content: t("CS_WS_SEARCH_CONNECTION"),
      show: location.pathname.includes("/search"),
    },
    {
      path: "/digit-ui/citizen/ws/my-applications",
      content: t("CS_WS_MY_APPLICATIONS"),
      show: location.pathname.includes("/my-applications"),
    },
    {
      path: "/digit-ui/citizen/ws/my-connections",
      content: t("CS_WS_MY_CONNECTIONS"),
      show: location.pathname.includes("/my-connections"),
    },
    {
      path: "/digit-ui/citizen/ws/my-bills",
      content: t("CS_WS_MY_BILLS"),
      show: location.pathname.includes("/my-bills"),
    },
    {
      path: "/digit-ui/citizen/ws/my-payments",
      content: t("CS_WS_MY_PAYMENTS"),
      show: location.pathname.includes("/my-payments"),
    },
    {
      path: "/digit-ui/citizen/ws/old-application",
      content: t("WS_OLD_APPLICATION"),
      show: location.pathname.includes("/old-application"),
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
  return (
    <React.Fragment>
      <Switch>
        <AppContainer>
          <div className="ground-container employee-app-container form-container">
            <ModuleHeader
              leftContent={
                <React.Fragment>
                  <ArrowLeft className="icon" />
                  Back
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
                <PrivateRoute path={`${path}/old-application`} component={WSOLDApplication} />
              </div>
            </div>
          </div>
        </AppContainer>
      </Switch>
    </React.Fragment>
  );
};

export default App;
