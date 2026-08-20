import React from "react";
import ReactDOM from "react-dom";
import "@djb25/workbench-ui-css";


import { initLibraries } from "@djb25/workbench-ui-libraries";
// import { paymentConfigs, PaymentLinks, PaymentModule } from "@djb25/workbench-ui-module-common";
import { DigitUI } from "@djb25/workbench-ui-module-core";
import { initKeycloak } from "@djb25/workbench-ui-module-core/src/pages/employee/Login/keyCloak";
// import { initDSSComponents } from "@djb25/workbench-ui-module-dss";
import { initEngagementComponents } from "@djb25/workbench-ui-module-engagement";
import { initHRMSComponents } from "@djb25/digit-ui-module-hrms";
// import { initUtilitiesComponents } from  "@djb25/workbench-ui-module-utilities";
import { initWorkbenchComponents } from "@djb25/workbench-ui-module-workbench";
import { PGRReducers, initPGRComponents } from "@djb25/workbench-ui-module-pgr";
import "@djb25/workbench-ui-css/dist/index.css";
// import "@djb25/workbench-ui-css/example/index.css";

import { pgrCustomizations } from "./pgr";
import { UICustomizations } from "./UICustomizations";

var Digit = window.Digit || {};

const enabledModules = [
  // "DSS",
  // "HRMS",
  "Workbench",
  // "PGR",
  //  "Engagement", "NDSS","QuickPayLinks", "Payment",
  //  "Utilities",
  // "FSM"
];

/**
 * initTokens — restores session from localStorage after a page refresh.
 *
 * Rules:
 *  • Citizen sessions (OTP-based) are always restored from localStorage.
 *  • Employee sessions (Keycloak-based) are only restored when window.keycloak
 *    says the user IS authenticated.  Without this guard, a stale localStorage
 *    entry would make the app think the employee is logged in even when the KC
 *    session has expired.
 */
const initTokens = (stateCode, isKcAuthenticated) => {
  const userType =
    window.sessionStorage.getItem("userType") ||
    process.env.REACT_APP_USER_TYPE ||
    "CITIZEN";

  const isEmployee = userType !== "CITIZEN" && userType !== "QACT";
  const userTypeInfo = isEmployee ? "employee" : "citizen";

  window.Digit.SessionStorage.set("user_type", userTypeInfo);
  window.Digit.SessionStorage.set("userType", userTypeInfo);

  if (isEmployee) {
    // Only restore an employee session when Keycloak confirms authentication.
    // If KC is not authenticated, leave Digit session empty — the login.js
    // component will handle the KC login flow and set everything up.
    if (isKcAuthenticated) {
      const token =
        window.localStorage.getItem("token") ||
        process.env[`REACT_APP_${userType}_TOKEN`];
      const employeeInfo = window.localStorage.getItem("Employee.user-info");
      const employeeTenantId = window.localStorage.getItem("Employee.tenant-id");

      if (employeeInfo && token) {
        window.Digit.SessionStorage.set("User", {
          access_token: token,
          info: JSON.parse(employeeInfo),
        });
      }
      if (employeeTenantId) {
        window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
      }
    }
    // Always set tenantId regardless
    const citizenTenantId =
      window.localStorage.getItem("Citizen.tenant-id") || stateCode;
    window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);
  } else {
    // Citizen OTP session — always restore (no Keycloak dependency)
    const token =
      window.localStorage.getItem("token") ||
      process.env[`REACT_APP_${userType}_TOKEN`];
    const citizenInfo = window.localStorage.getItem("Citizen.user-info");
    const citizenTenantId =
      window.localStorage.getItem("Citizen.tenant-id") || stateCode;

    if (citizenInfo && token) {
      window.Digit.SessionStorage.set("User", {
        access_token: token,
        info: JSON.parse(citizenInfo),
      });
    }
    window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);
  }
};

const initDigitUI = (isKcAuthenticated) => {
  window.contextPath =
    window?.globalConfigs?.getConfig("CONTEXT_PATH") || "digit-ui";
  window.Digit.Customizations = {
    PGR: pgrCustomizations,
    commonUiConfig: UICustomizations,
  };
  window?.Digit.ComponentRegistryService.setupRegistry({
    // PaymentModule,
    // ...paymentConfigs,
    // PaymentLinks,
  });

  // initDSSComponents();
  // initHRMSComponents();
  // initEngagementComponents();
  // initUtilitiesComponents();
  initWorkbenchComponents();
  // initPGRComponents();

  const moduleReducers = (initData) => ({
    pgr: PGRReducers(initData),
  });

  const stateCode =
    window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || "dl.djb";

  // Pass KC authentication status so initTokens knows whether to restore
  // the employee session from localStorage.
  initTokens(stateCode, isKcAuthenticated);

  ReactDOM.render(
    <DigitUI
      stateCode={stateCode}
      enabledModules={enabledModules}
      defaultLanding="employee"
      moduleReducers={moduleReducers}
    />,
    document.getElementById("root")
  );
};

initLibraries().then(async () => {
  const kc = await initKeycloak();
  window.keycloak = kc;
  // Pass whether Keycloak authenticated successfully so initTokens can decide
  // whether to restore the employee session from localStorage.
  initDigitUI(kc?.authenticated === true);
});
