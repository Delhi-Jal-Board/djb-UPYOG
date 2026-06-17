import {
  AppContainer,
  PrivateRoute,
  ModuleHeader,
  ArrowLeft,
  HomeIcon,
  CitizenHomeCard,
  PropertyHouse,
  LayoutWrapper,
} from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Switch, useRouteMatch, useLocation } from "react-router-dom";
import AddSurveyor from "../../components/RegisterSurveyor/AddSurveyor";
import EditSurveyor from "../../components/RegisterSurveyor/EditSurveyor";
import EditSupervisor from "../../components/RegisterSupervisor/EditSupervisor";

// Main Routing Page used for routing accorss the Water Tanker Module
const CitizenVendorApp = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { path } = useRouteMatch();

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    let crumbs = [
      {
        icon: HomeIcon,
        path: "/digit-ui/citizen",
      },
      {
        label: t("CITIZEN_VENDOR"),
        path: `/digit-ui/citizen/vendor`,
      },
    ];

    // Inbox / Booking Section
    if (pathname.includes("/inbox")) {
      let label = "ES_COMMON_INBOX";

      if (pathname.includes("/mt/inbox")) {
        crumbs = [
          {
            icon: HomeIcon,
            path: "/digit-ui/citizen",
          },
          {
            label: t("ACTION_TEST_MT"),
            path: `${path}/mt-Vendor`,
          },
        ];
      }

      crumbs.push({
        label: t(label),
      });
    } else if (pathname.includes("/my-bookings")) {
      let label = "WT_SEARCH_BOOKINGS";

      if (pathname.includes("/mt/my-bookings")) {
        label = "MT_SEARCH_BOOKINGS";
      }

      crumbs.push({
        label: t(label),
      });
    } else if (pathname.includes("/status")) {
      crumbs.push({
        label: t("WT_MY_APPLICATIONS"),
      });
    } else if (pathname.includes("/booking/") || pathname.includes("/booking-details") || pathname.includes("/bookingsearch/booking-details")) {
      crumbs.push({
        label: t("ES_COMMON_INBOX"),
        path: pathname.includes("/mt/") ? `${path}/mt/inbox` : `${path}/inbox`,
      });

      crumbs.push({
        label: t("WT_BOOKING_DETAILS"),
      });
    }

    // Registry Section
    const registryBreadcrumbs = [
      {
        match: "/registry/new-vendor",
        label: "ES_FSM_REGISTRY_TITLE_NEW_VENDOR",
      },
      {
        match: "/search-vendor",
        label: "SEARCH_VENDOR",
      },
      {
        match: "/registry/new-driver",
        label: "ES_FSM_REGISTRY_TITLE_NEW_DRIVER",
      },
      {
        match: ["/registry/vendor-details", "/registry/modify-vendor/"],
        label: "VENDOR_VENDOR_DETAILS",
      },
      {
        match: ["/registry/vehicle-details", "/registry/modify-vehicle/"],
        label: "VENDOR_VEHICLE_DETAILS",
      },
      {
        match: "/registry/new-vehicle",
        label: "ES_FSM_REGISTRY_TITLE_NEW_VEHICLE",
      },
      {
        match: ["/registry/driver-details", "/registry/modify-driver/"],
        label: "VENDOR_DRIVER_DETAILS",
      },
      {
        match: "/registry/additionaldetails",
        label: "VENDOR_ADDITIONAL_DETAILS",
      },
      {
        match: "/registry/new-supervisor",
        label: "ES_FSM_REGISTRY_TITLE_NEW_SUPERVISOR",
      },
      {
        match: ["/registry/supervisor-details", "/registry/modify-supervisor/"],
        label: "VENDOR_SUPERVISOR_DETAILS",
      },
      {
        match: "/registry/new-surveyor",
        label: "ES_FSM_REGISTRY_TITLE_NEW_SURVEYOR",
      },
      {
        match: ["/registry/surveyor-details", "/registry/modify-surveyor/"],
        label: "VENDOR_SURVEYOR_DETAILS",
      },
    ];

    const matchedRegistryBreadcrumb = registryBreadcrumbs.find(({ match }) => {
      if (Array.isArray(match)) {
        return match.some((item) => pathname.includes(item));
      }

      return pathname.includes(match);
    });

    if (matchedRegistryBreadcrumb) {
      crumbs.push({
        label: t(matchedRegistryBreadcrumb.label),
      });
    }

    return crumbs;
  };

  const SearchVendor = Digit.ComponentRegistryService.getComponent("SearchVendor");
  const EditVendorDetails = Digit.ComponentRegistryService.getComponent("EditVendorDetails");
  const AddSupervisor = Digit.ComponentRegistryService.getComponent("AddSupervisor");
  const SupervisorDetails = Digit.ComponentRegistryService.getComponent("SupervisorDetails");
  const SurveyorDetails = Digit.ComponentRegistryService.getComponent("SurveyorDetails");
  const VendorCreate = Digit.ComponentRegistryService.getComponent("VENDORCreate");
  const AddDriver = Digit.ComponentRegistryService.getComponent("AddDriver");
  const DriverDetails = Digit.ComponentRegistryService.getComponent("DriverDetails");
  const AddVehicle = Digit.ComponentRegistryService.getComponent("AddVehicle");
  const VehicleDetails = Digit.ComponentRegistryService.getComponent("VehicleDetails");
  const EditDriver = Digit.ComponentRegistryService.getComponent("EditDriver");
  const EditVehicle = Digit.ComponentRegistryService.getComponent("EditVehicle");

  return (
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
            path={`${path}/search-vendor`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <SearchVendor {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
            exact
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
            path={`${path}/registry/new-supervisor`}
            component={(props) => (
              <LayoutWrapper layoutClass="action">
                <AddSupervisor {...props} parentRoute={path} />
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
            path={`${path}/registry/supervisor-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="action">
                <SupervisorDetails {...props} parentRoute={path} />
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
            path={`${path}/registry/modify-surveyor/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="action">
                <EditSurveyor {...props} parentRoute={path} />
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
            path={`${path}/registry/surveyor-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="action">
                <SurveyorDetails {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />
          <PrivateRoute
            path={`${path}`}
            component={() =>
              Digit.UserService.hasAccess(["WT_VENDOR", "EKYC_VENDOR", "EKYC_SUPERVISOR"]) ? (
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", width: "100%", padding: "8px 0" }}>
                  <CitizenHomeCard
                    header={t("TITLE_VENDOR_MANAGEMENT")}
                    links={[{ i18nKey: t("SEARCH_VENDOR"), link: `/digit-ui/citizen/vendor/search-vendor` }]}
                    Icon={() => <PropertyHouse className="fill-path-primary-main" />}
                  />
                </div>
              ) : (
                <Redirect
                  to={{
                    pathname: `/digit-ui/citizen/login`,
                    state: { from: `${path}`, role: "CITIZEN_VENDOR" },
                  }}
                />
              )
            }
            exact
          />
        </div>
      </AppContainer>
    </Switch>
  );
};

export default CitizenVendorApp;
