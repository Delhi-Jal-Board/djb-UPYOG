import React from "react";
import ReactDOM from "react-dom";
import { initLibraries } from "@djb25/digit-ui-libraries";
import "./index.css";
import App from "./App";
import { initKeycloak } from "@djb25/digit-ui-module-core/src/pages/employee/Login/keyCloak";

window.global = window;
window.process = {
  env: {
    NODE_ENV: "development",
  },
};
// import "@upyog/digit-ui-css/dist/index.css";

// import { TLCustomisations } from './Customisations/tl/TLCustomisation';

// initLibraries();

initLibraries().then(async () => {
  const kc = await initKeycloak();
  window.keycloak = kc;

  // 👇 Protect employee routes manually
  const path = window.location.pathname;

  const publicRoutes = [
    "/digit-ui/employee/user/language-selection",
    "/digit-ui/employee/user/login",
    // "/digit-ui/citizen/select-language",
    // "/digit-ui/citizen/select-location",
    "/digit-ui/citizen",
  ];

  if ((path.startsWith("/digit-ui/employee") || path.startsWith("/digit-ui/citizen")) && !kc.authenticated) {
    const isPublic = publicRoutes.some((route) => path.startsWith(route));

    if (!isPublic) {
      window.location.href = "/digit-ui/employee/user/language-selection";
      return;
    }
  }
});
// window.Digit.Customizations = { PGR: {} ,TL:TLCustomisations};

const user = window.Digit.SessionStorage.get("User");

if (!user || !user.access_token || !user.info) {
  // login detection

  const parseValue = (value) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  };

  const getFromStorage = (key) => {
    const value = window.localStorage.getItem(key);
    return value && value !== "undefined" ? parseValue(value) : null;
  };

  const token = getFromStorage("token");

  const citizenToken = getFromStorage("Citizen.token");
  const citizenInfo = getFromStorage("Citizen.user-info");
  const citizenTenantId = getFromStorage("Citizen.tenant-id");

  const employeeToken = getFromStorage("Employee.token");
  const employeeInfo = getFromStorage("Employee.user-info");
  const employeeTenantId = getFromStorage("Employee.tenant-id");

  const userType = token === citizenToken ? "citizen" : "employee";
  window.Digit.SessionStorage.set("user_type", userType);
  window.Digit.SessionStorage.set("userType", userType);

  const getUserDetails = (access_token, info) => ({
    token: access_token,
    access_token,
    info,
  });

  const userDetails =
    userType === "citizen" ? getUserDetails(citizenToken, citizenInfo) : getUserDetails(employeeToken, employeeInfo);

  window.Digit.SessionStorage.set("User", userDetails);
  window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);
  window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
  // end
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);
