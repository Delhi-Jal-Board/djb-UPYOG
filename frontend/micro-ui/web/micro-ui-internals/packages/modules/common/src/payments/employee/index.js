import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
import { useRouteMatch, Switch, Link } from "react-router-dom";
import { CollectPayment } from "./payment-collect";
import { SuccessfulPayment, FailedPayment } from "./response";
import { testForm } from "../../hoc/testForm-config";
import { subFormRegistry } from "@djb25/digit-ui-libraries";
import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import IFrameInterface from "./IFrameInterface";

subFormRegistry?.addSubForm("testForm", testForm);

const EmployeePayment = ({ stateCode, cityCode, moduleCode }) => {
  const userType = "employee";
  const { path: currentPath } = useRouteMatch();

  const { t } = useTranslation();

  const [link, setLink] = useState(null);

  const commonProps = { stateCode, cityCode, moduleCode, setLink };

  const isFsm = location?.pathname?.includes("fsm") || location?.pathname?.includes("FSM");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;
    let crumbs = [];
    if (pathname.includes("/payment/collect")) {
      crumbs = [
        { label: t("COMMON_PAYMENTS"), path: "/digit-ui/employee" },
        { label: t("PAYMENT_COLLECT_LABEL"), path: "" },
      ];
    } else if (pathname.includes("/payment/success")) {
      crumbs = [
        { label: t("COMMON_PAYMENTS"), path: "/digit-ui/employee" },
        { label: t("CS_PAYMENT_SUCCESSFUL"), path: "" },
      ];
    } else if (pathname.includes("/payment/failure")) {
      crumbs = [
        { label: t("COMMON_PAYMENTS"), path: "/digit-ui/employee" },
        { label: t("CS_PAYMENT_FAILED"), path: "" },
      ];
    } else {
      crumbs = [
        { icon: HomeIcon, path: "/digit-ui/employee" },
        { label: t("ES_COMMON_HOME"), path: "/digit-ui/employee" },
      ];
      if (pathname.includes("/fsm/home")) {
        crumbs.push({ label: t("ES_TITLE_FSM"), path: "/digit-ui/employee/fsm/home" });
      } else if (pathname.includes("/fsm/inbox")) {
        crumbs.push({ label: t("ES_TITLE_INBOX"), path: "/digit-ui/employee/fsm/inbox" });
      }
    }
    return crumbs;
  };


  return (
    <React.Fragment>
      {/* <p className="breadcrumb" style={{ marginLeft: "15px" }}>
        <Link to={`/digit-ui/employee`}>{t("ES_COMMON_HOME")}</Link>
        {isFsm ? <Link to={`/digit-ui/employee/fsm/home`}>/ {t("ES_TITLE_FSM")} </Link> : null}
        {isFsm ? <Link to={`/digit-ui/employee/fsm/inbox`}>/ {t("ES_TITLE_INBOX")}</Link> : null}/ {link}
      </p> */}
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
          <Switch>

            <PrivateRoute path={`${currentPath}/collect/:businessService/:consumerCode`}>
              <CollectPayment {...commonProps} basePath={currentPath} />
            </PrivateRoute>
            <PrivateRoute path={`${currentPath}/success/:businessService/:receiptNumber/:consumerCode`}>
              <SuccessfulPayment {...commonProps} />
            </PrivateRoute>
            <PrivateRoute path={`${currentPath}/integration/:moduleName/:pageName`}>
              <IFrameInterface {...commonProps} />
            </PrivateRoute>
            <PrivateRoute path={`${currentPath}/failure`}>
              <FailedPayment {...commonProps} />
            </PrivateRoute>
          </Switch>

        </div>
      </div>

    </React.Fragment>
  );
};

export default EmployeePayment;
