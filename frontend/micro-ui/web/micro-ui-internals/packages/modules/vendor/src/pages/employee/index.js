import { PrivateRoute, AppContainer, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import AddSurveyor from "../../components/RegisterSurveyor/AddSurveyor";
import SearchVendor from "../../components/SearchVendor/Index";

const EmployeeApp = ({ path, url, userType }) => {
  const { t } = useTranslation();
  const location = useLocation();
  sessionStorage.removeItem("revalidateddone");
  // const isMobile = window.Digit.Utils.browser.isMobile();

  // const inboxInitialState = {
  //   searchParams: {
  //     uuid: { code: "ASSIGNED_TO_ALL", name: "ES_INBOX_ASSIGNED_TO_ALL" },
  //     services: ["asset-create"],
  //     applicationStatus: [],
  //     locality: [],

  //   },
  // };

  // const AssetBreadCrumbs = ({ location }) => {
  //   const { t } = useTranslation();
  //   const search = useLocation().search;
  //   const fromScreen = new URLSearchParams(search).get("from") || null;
  //   const { from : fromScreen2 } = Digit.Hooks.useQueryParams();
  //   const crumbs = [
  //     {
  //       path: "/digit-ui/employee",
  //       content: t("ES_COMMON_HOME"),
  //       show: true,
  //     },
  //     {
  //       path: "/digit-ui/employee/asset/assetservice/inbox",
  //       content: t("ES_TITLE_INBOX"),
  //       show: location.pathname.includes("asset/assetservice/inbox") ? false : false,
  //     },
  //   ];
  //   return <BreadCrumb style={isMobile?{display:"flex"}:{margin: "0 0 4px", color:"#000000" }}  spanStyle={{maxWidth:"min-content"}} crumbs={crumbs} />;
  // }

  //const Create = Digit?.ComponentRegistryService?.getComponent("VENDOREMPCreate");
  const AddVendor = Digit.ComponentRegistryService.getComponent("AddVendor");
  const SearchApp = Digit.ComponentRegistryService.getComponent("SearchApp");
  const AddDriver = Digit.ComponentRegistryService.getComponent("AddDriver");
  const EditVendorDetails = Digit.ComponentRegistryService.getComponent("EditVendorDetails");
  const AddVehicle = Digit.ComponentRegistryService.getComponent("AddVehicle");
  const VendorCreate = Digit.ComponentRegistryService.getComponent("VENDORCreate");
  const DriverDetails = Digit.ComponentRegistryService.getComponent("DriverDetails");
  const VehicleDetails = Digit.ComponentRegistryService.getComponent("VehicleDetails");
  const AddSupervisor = Digit.ComponentRegistryService.getComponent("AddSupervisor");
  const SupervisorDetails = Digit.ComponentRegistryService.getComponent("SupervisorDetails");
  const EditSupervisor = Digit.ComponentRegistryService.getComponent("EditSupervisor");
  const SurveyorDetails = Digit.ComponentRegistryService.getComponent("SurveyorDetails");
  const EditSurveyor = Digit.ComponentRegistryService.getComponent("EditSurveyor");
  const EditDriver = Digit.ComponentRegistryService.getComponent("EditDriver");
  const EditVehicle = Digit.ComponentRegistryService.getComponent("EditVehicle");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    let crumbs = [
      { icon: HomeIcon, path: "/digit-ui/employee" },
      { label: t("TITLE_VENDOR_MANAGEMENT"), path: `/digit-ui/employee/vendor/search-vendor` },
    ];

    if (pathname.includes("/registry/new-vendor")) {
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_VENDOR") });
    } else if (pathname.includes("/search-vendor")) {
      crumbs.push({ label: t("SEARCH_VENDOR") });
    } else if (pathname.includes("/registry/new-driver")) {
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_DRIVER") });
    } else if (pathname.includes("/registry/vendor-details") || pathname.includes("/registry/modify-vendor/")) {
      crumbs.push({ label: t("VENDOR_VENDOR_DETAILS") });
    } else if (pathname.includes("/registry/vehicle-details") || pathname.includes("/registry/modify-vehicle/")) {
      crumbs.push({ label: t("VENDOR_VEHICLE_DETAILS") });
    } else if (pathname.includes("/registry/new-vehicle")) {
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_VEHICLE") });
    } else if (pathname.includes("/registry/driver-details") || pathname.includes("/registry/modify-driver/")) {
      crumbs.push({ label: t("VENDOR_DRIVER_DETAILS") });
    } else if (pathname.includes("/registry/additionaldetails")) {
      crumbs.push({ label: t("VENDOR_ADDITIONAL_DETAILS") });
    } else if (pathname.includes("/registry/new-supervisor")) {
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_SUPERVISOR") });
    } else if (pathname.includes("/registry/supervisor-details") || pathname.includes("/registry/modify-supervisor/")) {
      crumbs.push({ label: t("VENDOR_SUPERVISOR_DETAILS") });
    } else if (pathname.includes("/registry/new-surveyor")) {
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_SURVEYOR") });
    } else if (pathname.includes("/registry/surveyor-details") || pathname.includes("/registry/modify-surveyor/")) {
      crumbs.push({ label: t("VENDOR_SURVEYOR_DETAILS") });
    }

    return crumbs;
  };

  return (
    <Switch>
      <AppContainer>
        <React.Fragment>
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
            {/* {!isRes ?
                <div style={isNewRegistration ? { marginLeft: "12px", display: "flex", alignItems: "center" } : { marginLeft: "-4px", display: "flex", alignItems: "center" }}>
                  <BackButton location={location} />
                  <span style={{ margin: "0 5px 16px", display: "inline-block" }}>|</span>
                  <AssetBreadCrumbs location={location} />
                </div>
                : null}
              <PrivateRoute exact path={`${path}/`} component={() => <ASSETLinks matchPath={path} userType={userType} />} /> */}

            {/* <PrivateRoute path={`${path}/additional`} component={Create} /> */}
            {/* <PrivateRoute path={`${path}/new-application`} component={(props) => <Create {...props} parentRoute={path} />} /> */}

            <PrivateRoute
              path={`${path}/search-vendor`}
              component={(props) => (
                <LayoutWrapper layoutClass="normal">
                  <SearchVendor {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/new-driver`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <AddDriver {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/new-vehicle`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <AddVehicle {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/additionaldetails`}
              component={(props) => {
                const isInfoPage = props.location.pathname.includes("/info");

                return (
                  <LayoutWrapper layoutClass={isInfoPage ? "action" : "normal"}>
                    <VendorCreate {...props} parentRoute={path} />
                  </LayoutWrapper>
                );
              }}
            />

            <PrivateRoute
              path={`${path}/registry/driver-details/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <DriverDetails {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />
            <PrivateRoute
              path={`${path}/registry/modify-driver/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <EditDriver {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/common-search/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="normal">
                  <SearchApp {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/new-vendor`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <AddVendor {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/vendor-details/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <EditVendorDetails {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/vehicle-details/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <VehicleDetails {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />
            <PrivateRoute
              path={`${path}/registry/modify-vehicle/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <EditVehicle {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/new-supervisor`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <AddSupervisor {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/supervisor-details/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <SupervisorDetails {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/modify-supervisor/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <EditSupervisor {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/new-surveyor`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <AddSurveyor {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/surveyor-details/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <SurveyorDetails {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />

            <PrivateRoute
              path={`${path}/registry/modify-surveyor/:id`}
              component={(props) => (
                <LayoutWrapper layoutClass="action">
                  <EditSurveyor {...props} parentRoute={path} />
                </LayoutWrapper>
              )}
            />
          </div>
        </React.Fragment>
      </AppContainer>
    </Switch>
  );
};

export default EmployeeApp;
