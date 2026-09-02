import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft, LayoutWrapper, HomeIcon } from "@djb25/digit-ui-react-components";
import React from "react";
import { Route, Switch, useRouteMatch, useLocation } from "react-router-dom";
import Inbox from "../../pages/citizen/SearchBill/Inbox";
import { useTranslation } from "react-i18next";

const App = () => {
  const { path, url, ...match } = useRouteMatch();
  const location = useLocation();
  const { t } = useTranslation();
  let isMobile = window.Digit.Utils.browser.isMobile();

  const inboxInitialState = {
    searchParams: {},
  };

  const crumbs = [
    {
      path: "/digit-ui/citizen",
      show: true,
      style: isMobile ? { width: "20%" } : {},
      icon: HomeIcon,
    },
    {
      path: "/digit-ui/citizen/bills-home",
      label: t("ACTION_TEST_BILLGENIE"),
      show: true,
    },
    {
      path: location.pathname,
      label: t("ABG_SEARCH_BILL_COMMON_HEADER"),
      show: location.pathname.includes("/billSearch"),
    },
  ];

  const getDynamicBreadcrumbs = () => {
    let activeCrumbs = crumbs.filter((crumb) => crumb.show);
    if (activeCrumbs.length > 0) {
      activeCrumbs[activeCrumbs.length - 1].path = "";
    }
    return activeCrumbs;
  };

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
            <PrivateRoute
              path={`${path}/billSearch`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <Inbox filterComponent="CITIZEN_SEARCH_FILTER" initialStates={inboxInitialState} isInbox={true} />
                </LayoutWrapper>
              )}
            />
          </div>
        </AppContainer>
      </Switch>
    </React.Fragment>
  );
};
export default App;
