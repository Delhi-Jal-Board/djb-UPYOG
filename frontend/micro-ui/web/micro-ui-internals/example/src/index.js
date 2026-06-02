import React from "react";
import ReactDOM from "react-dom";
import "@djb25/digit-ui-css";

import { initLibraries } from "@djb25/digit-ui-libraries";
import { PGRReducers } from "@djb25/digit-ui-module-pgr";
// import { PTModule, PTLinks, PTComponents } from "@djb25/digit-ui-module-pt";
import { MCollectModule, MCollectLinks } from "@djb25/digit-ui-module-mcollect";
// import { TLModule, TLLinks } from "@djb25/digit-ui-module-tl";
import { initFSMComponents } from "@djb25/digit-ui-module-fsm";
import { initPGRComponents } from "@djb25/digit-ui-module-pgr";
import { initFinanceComponents } from "@djb25/digit-ui-module-finance";
import { initDSSComponents } from "@djb25/digit-ui-module-dss";
import { initHRMSComponents } from "@djb25/digit-ui-module-hrms";
import { initReceiptsComponents, ReceiptsModule } from "@djb25/digit-ui-module-receipts";
// import { initReportsComponents } from "@djb25/digit-ui-module-reports";
import { initMCollectComponents } from "@djb25/digit-ui-module-mcollect";
// import { initTLComponents } from "@djb25/digit-ui-module-tl";
import { PaymentModule, PaymentLinks, paymentConfigs } from "@djb25/digit-ui-module-common";
import { HRMSModule } from "@djb25/digit-ui-module-hrms";
import { FinanceModule } from "@djb25/digit-ui-module-finance";
// import { initOBPSComponents } from "@djb25/digit-ui-module-obps";
import { initEngagementComponents } from "@djb25/digit-ui-module-engagement";
// import { initNOCComponents } from "@djb25/digit-ui-module-noc";
import { DigitUI } from "@djb25/digit-ui-module-core";
import {CommonPTModule,CommonPTLinks, CommonPTComponents,initCommonPTComponents } from "@djb25/digit-ui-module-commonpt";
import { initBillsComponents, BillsModule } from "@djb25/digit-ui-module-bills";
// import { initFormioComponents } from "@djb25/digit-ui-module-formio";
import { initEkycComponents } from "@djb25/digit-ui-module-ekyc";
// import { initOBPSComponents } from "@upyog/digit-ui-module-obps";
// import { FormioModule } from "@djb25/digit-ui-module-formio";
import { EkycModule } from "@djb25/digit-ui-module-ekyc";
// import { initEngagementComponents } from "@upyog/digit-ui-module-engagement";
// import { initNOCComponents } from "@upyog/digit-ui-module-noc";
// import { initWSComponents } from "@upyog/digit-ui-module-ws";@nudmcdgnpm/upyog-ui-module-ads
// import {initCustomisationComponents} from "./customisations";

import { PGRModule, PGRLinks } from "@djb25/digit-ui-module-pgr";
import { RWHModule, RWHLinks, initRwhComponents, RwhComponents } from "@djb25/digit-ui-module-rwh";
// import { Body, TopBar } from "@djb25/digit-ui-react-components";
import "@djb25/digit-ui-css/dist/index.css";

// import { PTRModule, PTRLinks, PTRComponents } from "@djb25/djb25-ui-module-ptr";
import { ASSETComponents, ASSETLinks, ASSETModule, initAssetComponents } from "@djb25/digit-ui-module-asset";

// import {
//   EWModule,
//   EWLinks,
//   EWComponents }
//   from "@djb25/djb25-ui-module-ew";

// import { SVComponents, SVLinks, SVModule } from "@djb25/djb25-ui-module-sv";
// import {CHBModule,CHBLinks,CHBComponents} from "@djb25/djb25-ui-module-chb";
// import {ADSModule,ADSLinks,ADSComponents} from "@djb25/djb25-ui-module-ads";
import { WTModule, WTLinks, WTComponents, initWTComponents } from "@djb25/digit-ui-module-wt";
import { WSModule, WSLinks, WSComponents, initWSComponents } from "@djb25/digit-ui-module-ws";
import { VENDORComponents, VENDORLinks, VENDORModule } from "@djb25/digit-ui-module-vendor";

// import * as comps from "@djb25/digit-ui-react-components";

// import { subFormRegistry } from "@djb25/digit-ui-libraries";

import { pgrCustomizations, pgrComponents } from "./pgr";
import { initKeycloak } from "@djb25/digit-ui-module-core/src/pages/employee/Login/keyCloak";

var Digit = window.Digit || {};

const enabledModules = [
  "PGR",
  "FSM",
  "Payment",
  "PT",
  "QuickPayLinks",
  "DSS",
  "MCollect",
  "HRMS",
  // "TL",
  // "FORMIO",
  "EKYC",
  "Receipts",
  "Reports",
  // "OBPS",
  "Engagement",
  // "NOC",
  "WS",
  "CommonPT",
  "NDSS",
  "Bills",
  // "SW",
  "BillAmendment",
  "FireNoc",
  "Birth",
  "Finance",
  "Death",
  // "PTR",
  "ASSET",
  // "ADS",
  // "SV",
  // "EW",
  // "CHB",
  "WT",
  "VENDOR",
  "MT",
  "RWH",
];

const initTokens = (stateCode) => {
  const userType = window.sessionStorage.getItem("userType") || process.env.REACT_APP_USER_TYPE || "CITIZEN";

  // const token = window.keycloak?.token || null;

  const citizenInfo = window.localStorage.getItem("Citizen.user-info");
  const citizenTenantId = window.localStorage.getItem("Citizen.tenant-id") || stateCode;

  const employeeInfo = window.localStorage.getItem("Employee.user-info");
  const employeeTenantId = window.localStorage.getItem("Employee.tenant-id");

  const userTypeInfo = userType === "CITIZEN" || userType === "QACT" ? "citizen" : "employee";

  window.Digit.SessionStorage.set("user_type", userTypeInfo);
  window.Digit.SessionStorage.set("userType", userTypeInfo);

  if (userType !== "CITIZEN") {
    window.Digit.SessionStorage.set("User", { info: userType !== "CITIZEN" ? JSON.parse(employeeInfo) : citizenInfo });
  } else {
    // if (!window.Digit.SessionStorage.get("User")?.extraRoleInfo) window.Digit.SessionStorage.set("User", { access_token: token, info: citizenInfo });
  }

  window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);

  if (employeeTenantId && employeeTenantId.length) window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
};

const initDigitUI = () => {
  window?.Digit.ComponentRegistryService.setupRegistry({
    ...pgrComponents,
    PGRModule,
    PGRLinks,
    PaymentModule,
    ...paymentConfigs,
    PaymentLinks,
    // PTModule,
    // PTLinks,
    // ...PTComponents,
    MCollectLinks,
    MCollectModule,
    HRMSModule,
    FinanceModule,
    // FormioModule,
    EkycModule,
    ReceiptsModule,
    BillsModule,
    // PTRModule,
    // PTRLinks,
    // ...PTRComponents,
    // TLModule,
    // TLLinks,
    ASSETModule,
    ASSETLinks,
    ...ASSETComponents,
    //   ADSLinks,
    // ADSModule,
    // ...ADSComponents,
    // SVModule,
    // SVLinks,
    // ...SVComponents,
    // EWModule,
    // EWLinks,
    // ...EWComponents,
    // CHBModule,
    // CHBLinks,
    // ...CHBComponents,
    WSModule,
    WSLinks,
    ...WSComponents,
    WTModule,
    WTLinks,
    ...WTComponents,
    VENDORModule,
    VENDORLinks,
    ...VENDORComponents,
    RWHModule,
    RWHLinks,
    ...RwhComponents,
    CommonPTModule,
    CommonPTLinks,
    ...CommonPTComponents,
  });

  initFSMComponents();
  initPGRComponents();
  initDSSComponents();
  initMCollectComponents();
  initHRMSComponents();
  // initTLComponents();
  // initFormioComponents();
  initEkycComponents();
  initReceiptsComponents();
  // initReportsComponents();
  // initOBPSComponents();
  initEngagementComponents();
  // initNOCComponents();
  initWSComponents();
  initCommonPTComponents();
  initBillsComponents();
  initFinanceComponents();
  initAssetComponents();
  initWTComponents();
  initRwhComponents();

  // initCustomisationComponents();

  const moduleReducers = (initData) => ({
    pgr: PGRReducers(initData),
  });

  window.Digit.Customizations = {
    PGR: pgrCustomizations,
    TL: {
      customiseCreateFormData: (formData, licenceObject) => licenceObject,
      customiseRenewalCreateFormData: (formData, licenceObject) => licenceObject,
      customiseSendbackFormData: (formData, licenceObject) => licenceObject,
    },
  };

  const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || "pb";
  initTokens(stateCode);

  const registry = window?.Digit.ComponentRegistryService.getRegistry();
  ReactDOM.render(<DigitUI stateCode={stateCode} enabledModules={enabledModules} moduleReducers={moduleReducers} />, document.getElementById("root"));
};

initLibraries().then(async () => {
  const kc = await initKeycloak();
  window.keycloak = kc;

  initDigitUI();
});
