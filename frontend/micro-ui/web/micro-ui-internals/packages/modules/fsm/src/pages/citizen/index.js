import React from "react";
import {
  BackButton,
  PrivateRoute,
  LayoutWrapper,
  ModuleHeader,
  ArrowLeft,
  HomeIcon,
  AppContainer,
} from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Redirect, Switch, useLocation } from "react-router-dom";

import NewApplicationCitizenComp from "./NewApplication/index";
import { MyApplications as MyApplicationsComp } from "./MyApplications";
import ApplicationDetailsComp from "./ApplicationDetails";
import SelectRatingComp from "./Rating/SelectRating";
import RateViewComp from "./Rating/RateView";
import ResponseComp from "../Response";

const CitizenApp = ({ path }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const isMobile = window.Digit ? Digit.Utils.browser.isMobile() : window.innerWidth <= 768;

  const NewApplicationCitizen = Digit.ComponentRegistryService.getComponent("FSMNewApplicationCitizen") || NewApplicationCitizenComp;
  const MyApplications = Digit.ComponentRegistryService.getComponent("FSMMyApplications") || MyApplicationsComp;
  const EmployeeApplicationDetails = Digit.ComponentRegistryService.getComponent("FSMEmployeeApplicationDetails");
  const ApplicationDetails = Digit.ComponentRegistryService.getComponent("FSMCitizenApplicationDetails") || ApplicationDetailsComp;
  const SelectRating = Digit.ComponentRegistryService.getComponent("FSMSelectRating") || SelectRatingComp;
  const RateView = Digit.ComponentRegistryService.getComponent("FSMRateView") || RateViewComp;
  const Response = Digit.ComponentRegistryService.getComponent("FSMResponse") || ResponseComp;
  const DsoDashboard = Digit.ComponentRegistryService.getComponent("FSMDsoDashboard");
  const FSMRegistry = Digit.ComponentRegistryService.getComponent("FSMRegistry");
  const VendorDetails = Digit.ComponentRegistryService.getComponent("VendorDetails");
  const AddVendor = Digit.ComponentRegistryService.getComponent("AddVendor");
  const VehicleDetails = Digit.ComponentRegistryService.getComponent("VehicleDetails");
  const AddVehicle = Digit.ComponentRegistryService.getComponent("AddVehicle");
  const EditVehicle = Digit.ComponentRegistryService.getComponent("EditVehicle");
  const DriverDetails = Digit.ComponentRegistryService.getComponent("DriverDetails");
  const AddDriver = Digit.ComponentRegistryService.getComponent("AddDriver");
  const EditDriver = Digit.ComponentRegistryService.getComponent("EditDriver");
  const Inbox = Digit.ComponentRegistryService.getComponent("FSMEmpInbox");
  const EditVendor = Digit.ComponentRegistryService.getComponent("EditVendor");
  const hasRegistryAccess = Digit.UserService.hasAccess(["FSM_DSO", "FSM_ADMIN", "ADMIN", "SUPERUSER"]);
  const registryPage = (Component, layoutClass = "action") => (props) =>
    hasRegistryAccess && Component ? (
      <LayoutWrapper layoutClass={layoutClass}>
        <Component {...props} parentRoute={path} />
      </LayoutWrapper>
    ) : (
      <Redirect to="/digit-ui/citizen" />
    );

  const hideBack = location.pathname.includes("/response") || location.pathname.split("/").includes("check");
  const handleBack = () => {
    if (location.pathname.includes("/street")) {
      window.history.go(-4);
    } else {
      window.history.back();
    }
  };

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    let crumbs = [
      {
        path: "/digit-ui/citizen",
        icon: HomeIcon,
        ...(isMobile ? { style: { width: "20%" } } : {}),
      },
      {
        path: "/digit-ui/citizen/fsm-home",
        label: t("CS_COMMON_FSM") !== "CS_COMMON_FSM" ? t("CS_COMMON_FSM") : t("ES_TITLE_FAECAL_SLUDGE_MGMT"),
      },
    ];

    if (pathname.includes("/inbox")) {
      crumbs.push({ label: t("ES_COMMON_INBOX") });
    } else if (pathname.includes("/search")) {
      crumbs.push({ label: t("ES_COMMON_SEARCH") });
    } else if (pathname.includes("/new-application")) {
      crumbs.push({
        path: `${path}/my-applications`,
        label:
          t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION") !== "CS_FSM_APPLICATION_TITLE_MY_APPLICATION"
            ? t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")
            : t("CS_TITLE_MY_APPLICATIONS"),
      });
      crumbs.push({
        label:
          t("CS_FSM_NEW_DESLUDGING_APPLICATION") !== "CS_FSM_NEW_DESLUDGING_APPLICATION"
            ? t("CS_FSM_NEW_DESLUDGING_APPLICATION")
            : t("ES_TITLE_NEW_DESULDGING_APPLICATION"),
      });
    } else if (pathname.includes("/my-applications")) {
      crumbs.push({
        label:
          t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION") !== "CS_FSM_APPLICATION_TITLE_MY_APPLICATION"
            ? t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")
            : t("CS_TITLE_MY_APPLICATIONS"),
      });
    } else if (pathname.includes("/application-details")) {
      crumbs.push({
        path: `${path}/my-applications`,
        label:
          t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION") !== "CS_FSM_APPLICATION_TITLE_MY_APPLICATION"
            ? t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")
            : t("CS_TITLE_MY_APPLICATIONS"),
      });
      crumbs.push({
        label:
          t("CS_FSM_APPLICATION_DETAIL_TITLE_APPLICATION_DETAILS") !== "CS_FSM_APPLICATION_DETAIL_TITLE_APPLICATION_DETAILS"
            ? t("CS_FSM_APPLICATION_DETAIL_TITLE_APPLICATION_DETAILS")
            : t("ES_TITLE_APPLICATION_DETAILS"),
      });
    } else if (pathname.includes("/dso-application-details")) {
      crumbs.push({ path: `${path}/inbox`, label: t("ES_COMMON_INBOX") });
      crumbs.push({ label: t("ES_TITLE_APPLICATION_DETAILS") });
    } else if (pathname.includes("/rate/")) {
      crumbs.push({
        path: `${path}/my-applications`,
        label:
          t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION") !== "CS_FSM_APPLICATION_TITLE_MY_APPLICATION"
            ? t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")
            : t("CS_TITLE_MY_APPLICATIONS"),
      });
      crumbs.push({
        label: t("CS_RATE_HELP_US") !== "CS_RATE_HELP_US" ? t("CS_RATE_HELP_US") : t("CS_FSM_RATE"),
      });
    } else if (pathname.includes("/rate-view/")) {
      crumbs.push({
        path: `${path}/my-applications`,
        label:
          t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION") !== "CS_FSM_APPLICATION_TITLE_MY_APPLICATION"
            ? t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")
            : t("CS_TITLE_MY_APPLICATIONS"),
      });
      crumbs.push({ label: t("CS_FSM_RATE_VIEW") });
    } else if (pathname.includes("/response")) {
      crumbs.push({
        path: `${path}/my-applications`,
        label:
          t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION") !== "CS_FSM_APPLICATION_TITLE_MY_APPLICATION"
            ? t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")
            : t("CS_TITLE_MY_APPLICATIONS"),
      });
      crumbs.push({
        label:
          t("CS_COMMON_RESPONSE") !== "CS_COMMON_RESPONSE"
            ? t("CS_COMMON_RESPONSE")
            : t("CS_APPLICATION_DETAILS_ACKNOWLEDGEMENT"),
      });
    } else if (pathname.includes("/dso-dashboard")) {
      crumbs.push({ label: t("DSO_DASHBOARD") });
    } else if (pathname.includes("/registry/new-vendor")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VENDOR` });
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_VENDOR") });
    } else if (pathname.includes("/registry/vendor-details") || pathname.includes("/registry/modify-vendor")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VENDOR` });
      crumbs.push({ label: t("VENDOR_VENDOR_DETAILS") });
    } else if (pathname.includes("/registry/new-vehicle")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VEHICLE` });
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_VEHICLE") });
    } else if (pathname.includes("/registry/vehicle-details") || pathname.includes("/registry/modify-vehicle")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VEHICLE` });
      crumbs.push({ label: t("VENDOR_VEHICLE_DETAILS") });
    } else if (pathname.includes("/registry/new-driver")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=DRIVER` });
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_DRIVER") });
    } else if (pathname.includes("/registry/driver-details") || pathname.includes("/registry/modify-driver")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=DRIVER` });
      crumbs.push({ label: t("VENDOR_DRIVER_DETAILS") });
    } else if (pathname.includes("/registry")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY") });
    }

    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1].path = "";
    }

    return crumbs;
  };

  return (
    <React.Fragment>
      <AppContainer>
        <div className="ground-container employee-app-container form-container">
          <ModuleHeader
            leftContent={
              hideBack ? null : (
                <React.Fragment>
                  <ArrowLeft className="icon" />
                  {t("CS_COMMON_BACK")}
                </React.Fragment>
              )
            }
            onLeftClick={handleBack}
            breadcrumbs={getDynamicBreadcrumbs()}
          />
          {isMobile && !hideBack && (
            location.pathname.includes("/street") ? (
              <BackButton getBackPageNumber={() => -4}>{t("CS_COMMON_BACK")}</BackButton>
            ) : (
              <BackButton>{t("CS_COMMON_BACK")}</BackButton>
            )
          )}
          <div className="fsm-citizen-wrapper">
            <Switch>
              <PrivateRoute
                path={`${path}/inbox`}
                component={(props) =>
                  Digit.UserService.hasAccess(["FSM_DSO", "FSM_ADMIN", "ADMIN", "SUPERUSER"]) ? (
                    <Inbox {...props} parentRoute={path} isInbox={true} />
                  ) : (
                    <Redirect to="/digit-ui/citizen" />
                  )
                }
              />
              <PrivateRoute
                path={`${path}/search`}
                component={(props) =>
                  Digit.UserService.hasAccess(["FSM_DSO", "FSM_ADMIN", "ADMIN", "SUPERUSER"]) ? (
                    <Inbox {...props} parentRoute={path} isSearch={true} />
                  ) : (
                    <Redirect to="/digit-ui/citizen" />
                  )
                }
              />
              <PrivateRoute path={`${path}/new-application`} component={() => <NewApplicationCitizen parentRoute={path} />} />
              <PrivateRoute path={`${path}/my-applications`} component={MyApplications} />
              <PrivateRoute
                path={`${path}/dso-application-details/:id`}
                component={() => (EmployeeApplicationDetails ? <EmployeeApplicationDetails parentRoute={path} userType="DSO" /> : null)}
              />
              <PrivateRoute
                exact
                path={`${path}/registry`}
                component={registryPage(FSMRegistry, "normal")}
              />
              <PrivateRoute path={`${path}/registry/vendor-details/:id`} component={registryPage(VendorDetails)} />
              <PrivateRoute path={`${path}/registry/new-vendor`} component={registryPage(AddVendor)} />
              <PrivateRoute path={`${path}/registry/vehicle-details/:id`} component={registryPage(VehicleDetails)} />
              <PrivateRoute path={`${path}/registry/new-vehicle`} component={registryPage(AddVehicle)} />
              <PrivateRoute path={`${path}/registry/modify-vehicle/:id`} component={registryPage(EditVehicle)} />
              <PrivateRoute path={`${path}/registry/driver-details/:id`} component={registryPage(DriverDetails)} />
              <PrivateRoute path={`${path}/registry/new-driver`} component={registryPage(AddDriver)} />
              <PrivateRoute path={`${path}/registry/modify-driver/:id`} component={registryPage(EditDriver)} />
              <PrivateRoute path={`${path}/application-details/:id`} component={() => <ApplicationDetails parentRoute={path} />} />
              <PrivateRoute path={`${path}/rate/:id`} component={() => <SelectRating parentRoute={path} />} />
              <PrivateRoute path={`${path}/rate-view/:id`} component={() => <RateView parentRoute={path} />} />
              <PrivateRoute path={`${path}/response`} component={(props) => <Response parentRoute={path} {...props} />} />
              <PrivateRoute path={`${path}/dso-dashboard`} component={() => (DsoDashboard ? <DsoDashboard parentRoute={path} /> : null)} />
              <PrivateRoute
                path={`${path}/registry/modify-vendor/:id`}
                component={(props) => (
                  <LayoutWrapper layoutClass="action">
                    {EditVendor ? <EditVendor {...props} /> : null}
                  </LayoutWrapper>
                )}
              />
              <Redirect to="/digit-ui/citizen" />
            </Switch>
          </div>
        </div>
      </AppContainer>
    </React.Fragment>
  );
};

// Citizen FSM Module
export default CitizenApp;
