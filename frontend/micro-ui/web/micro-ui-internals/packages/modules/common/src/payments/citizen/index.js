import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import { PrivateRoute, ModuleHeader, ArrowLeft, AppContainer, HomeIcon } from "@djb25/digit-ui-react-components";
import PayersDetails from "./payers-details";
import { MyBills } from "./bills";
import { SelectPaymentType } from "./payment-type/index";
import { SuccessfulPayment, FailedPayment } from "./response";
import { useTranslation } from "react-i18next";

const CitizenPayment = ({ stateCode, cityCode, moduleCode }) => {
  const { path: currentPath } = useRouteMatch();
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
    return crumbs.filter((crumb) => crumb.show);
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
