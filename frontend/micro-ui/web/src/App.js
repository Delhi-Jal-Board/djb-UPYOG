import React from "react";

import { initPGRComponents, PGRReducers } from "@djb25/digit-ui-module-pgr";
import { initFSMComponents } from "@djb25/digit-ui-module-fsm";
import { FinanceModule } from "@djb25/digit-ui-module-finance";
import {
  PTModule,
  PTLinks,
  PTComponents,
} from "@djb25/digit-ui-module-pt";
import {
  MCollectModule,
  MCollectLinks,
  initMCollectComponents,
} from "@djb25/digit-ui-module-mcollect";
import { initDSSComponents } from "@djb25/digit-ui-module-dss";
import {
  PaymentModule,
  PaymentLinks,
  paymentConfigs,
} from "@djb25/digit-ui-module-common";
import { DigitUI } from "@djb25/digit-ui-module-core";
import { initLibraries } from "@djb25/digit-ui-libraries";
import { HRMSModule, initHRMSComponents } from "@djb25/digit-ui-module-hrms";
// import { initFormioComponents } from "@djb25/digit-ui-module-formio";
// import { FormioModule } from "@djb25/digit-ui-module-formio";
import { initEkycComponents, EkycModule, EkycLinks } from "@djb25/digit-ui-module-ekyc";

// import {
//   TLModule,
//   TLLinks,
//   initTLComponents,
// } from "@djb25/digit-ui-module-tl";
import {
  initReceiptsComponents,
  ReceiptsModule,
} from "@djb25/digit-ui-module-receipts";
// import { initOBPSComponents } from "@djb25/digit-ui-module-obps";
// import { initNOCComponents } from "@djb25/digit-ui-module-noc";
import { initEngagementComponents } from "@djb25/digit-ui-module-engagement";
import { initWSComponents } from "@djb25/digit-ui-module-ws";
import { initFinanceComponents } from "@djb25/digit-ui-module-finance";
// import { initCustomisationComponents } from "./Customisations";
import {CommonPTModule,CommonPTLinks, CommonPTComponents,initCommonPTComponents } from "@djb25/digit-ui-module-commonpt";
import { initBillsComponents } from "@djb25/digit-ui-module-bills";
// import {
//   PTRModule,
//   PTRLinks,
//   PTRComponents,
// } from "@djb25/digit-ui-module-ptr";
import {
  ASSETComponents,
  ASSETLinks,
  ASSETModule,
} from "@djb25/digit-ui-module-asset";

// import {
//   EWModule,
//   EWLinks,
//   EWComponents }
//   from "@djb25/upyog-ui-module-ew";

// import { SVComponents, SVLinks, SVModule } from "@djb25/upyog-ui-module-sv";
// import {CHBModule,CHBLinks,CHBComponents} from "@djb25/upyog-ui-module-chb";
// import {ADSModule,ADSLinks,ADSComponents} from "@djb25/upyog-ui-module-ads";
import {
  WTModule,
  WTLinks,
  WTComponents,
  initWTComponents,
} from "@djb25/digit-ui-module-wt";
import {
  VENDORComponents,
  VENDORLinks,
  VENDORModule,
} from "@djb25/digit-ui-module-vendor";

import { RWHModule, RWHLinks, initRwhComponents ,RwhComponents} from "@djb25/digit-ui-module-rwh";
// import { initReportsComponents } from "@djb25/digit-ui-module-reports";

initLibraries();

const enabledModules = [
  "PGR",
  "FSM",
  "Payment",
  "PT",
  "QuickPayLinks",
  "DSS",
  "NDSS",
  "MCollect",
  "HRMS",
  // "TL",
  // "FORMIO",
  "EKYC",
  "Receipts",
  // "OBPS",
  // "NOC",
  "Engagement",
  "Finance",
  "CommonPT",
  "WS",
  "Reports",
  "Bills",
  // "SW",
  "BillAmendment",
  "FireNoc",
  "Birth",
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
window.Digit.ComponentRegistryService.setupRegistry({
  ...paymentConfigs,
  // PTModule,
  // PTLinks,
  PaymentModule,
  PaymentLinks,
  // ...PTComponents,
  MCollectLinks,
  MCollectModule,
  HRMSModule,
  FinanceModule,
  // TLModule,
  // TLLinks,
  // FormioModule,
  EkycModule,
  EkycLinks,
  ReceiptsModule,
  // PTRModule,
  // PTRLinks,
  // ...PTRComponents,
  ASSETModule,
  ASSETLinks,
  ...ASSETComponents,
  // ADSLinks,
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

initPGRComponents();
initFSMComponents();
initDSSComponents();
initMCollectComponents();
initHRMSComponents();
// initTLComponents();
// initFormioComponents();
initEkycComponents();
initReceiptsComponents();
// initOBPSComponents();
// initNOCComponents();
initEngagementComponents();
initWSComponents();
initCommonPTComponents();
initBillsComponents();
initFinanceComponents();
initWTComponents();
initRwhComponents();
// initAssetComponents();
// initReportsComponents();
// initCustomisationComponents();

const moduleReducers = (initData) => ({
  pgr: PGRReducers(initData),
});

function App() {
  window.contextPath =
    window?.globalConfigs?.getConfig("CONTEXT_PATH") || "digit-ui";
  const stateCode =
    window.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") ||
    process.env.REACT_APP_STATE_LEVEL_TENANT_ID;
  if (!stateCode) {
    return <h1>stateCode is not defined</h1>;
  }
  return (
    <DigitUI
      stateCode={stateCode}
      enabledModules={enabledModules}
      moduleReducers={moduleReducers}
    />
  );
}

export default App;
