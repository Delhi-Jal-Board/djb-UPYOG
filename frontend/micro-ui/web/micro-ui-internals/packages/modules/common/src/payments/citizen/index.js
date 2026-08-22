import React from "react";
import { Switch, Route, useRouteMatch, useLocation } from "react-router-dom";
import { PrivateRoute, ModuleHeader, ArrowLeft, AppContainer, HomeIcon } from "@djb25/digit-ui-react-components";
import PayersDetails from "./payers-details";
import { MyBills } from "./bills";
import { SelectPaymentType } from "./payment-type/index";
import { SuccessfulPayment, FailedPayment } from "./response";
import { useTranslation } from "react-i18next";

const CitizenPayment = ({ stateCode, cityCode, moduleCode }) => {
  const { path: currentPath } = useRouteMatch();
  const { state: routerState } = useLocation();
  const commonProps = { stateCode, cityCode, moduleCode };
  const { t } = useTranslation();
  let isMobile = window.Digit.Utils.browser.isMobile();

  const pathname = window.location.pathname;

  const crumbs = [
    {
      path: "/digit-ui/citizen",
      show: true,
      style: isMobile ? { width: "20%" } : {},
      icon: HomeIcon,
    },
    {
      path: "/digit-ui/citizen/payment/my-bills",
      label: t("CS_PAYMENT_BILL_DETAILS"),
      show: pathname.includes("/my-bills"),
    },
    {
      path: pathname,
      label: t("PAYERS_DETAILS_HEADER"),
      show: pathname.includes("/billDetails"),
    },
    {
      path: pathname,
      label: t("PAYMENT_CS_HEADER"),
      show: pathname.includes("/collect"),
    },
    {
      path: pathname,
      label: t("CS_TITLE_PAYMENT_SUCCESS"),
      show: pathname.includes("/success"),
    },
    {
      path: pathname,
      label: t("CS_TITLE_PAYMENT_FAILURE"),
      show: pathname.includes("/failure"),
    },
  ];

  const getDynamicBreadcrumbs = () => {
    let activeCrumbs = crumbs.filter((crumb) => crumb.show);

    const isWNS = pathname.includes("/WS") || pathname.includes("/SW") || window.location.search.includes("workflow=WNS");
    if (isWNS) {
      activeCrumbs.splice(1, 0, {
        path: "/digit-ui/citizen/ws-home",
        label: t("ES_TITLE_WATER_AND_SEWERAGE"),
        show: true,
      });

      if (routerState?.fromMyApplications || routerState?.fromApplicationDetails) {
        activeCrumbs.splice(2, 0, {
          path: "/digit-ui/citizen/ws/my-applications",
          label: t("CS_HOME_MY_APPLICATIONS"),
          show: true,
        });
      }

      if (routerState?.fromApplicationDetails) {
        activeCrumbs.splice(3, 0, {
          label: t("WS_APPLICATION_DETAILS_HEADER"),
          show: true,
          onClick: () => window.history.back(),
        });
      }
    }

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
            <div className="employee-form">
              <div className="employee-form-content">
                <PrivateRoute path={`${currentPath}/my-bills/:businessService`}>
                  <MyBills stateCode={stateCode} />
                </PrivateRoute>
                <PrivateRoute path={`${currentPath}/billDetails/:businessService/:consumerCode/:paymentAmt`}>
                  <PayersDetails {...commonProps} stateCode={stateCode} basePath={currentPath} />
                </PrivateRoute>
                <PrivateRoute path={`${currentPath}/collect/:businessService/:consumerCode`}>
                  <SelectPaymentType {...commonProps} stateCode={stateCode} basePath={currentPath} />
                </PrivateRoute>
                <PrivateRoute path={`${currentPath}/success/:businessService/:consumerCode/:tenantId`}>
                  <SuccessfulPayment {...commonProps} />
                </PrivateRoute>
                <PrivateRoute path={`${currentPath}/failure`}>
                  <FailedPayment {...commonProps} />
                </PrivateRoute>
              </div>
            </div>
          </div>
        </AppContainer>
      </Switch>
    </React.Fragment>
  );
};

export default CitizenPayment;
