import React, { useEffect, useState } from "react";
import { AppContainer, BreadCrumb, PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import FstpAddVehicle from "./FstpAddVehicle";
import FstpOperations from "./FstpOperations";
import FstpServiceRequest from "./FstpServiceRequest";

export const FsmBreadCrumb = ({ location }) => {
  const { t } = useTranslation();
  const DSO = Digit.UserService.hasAccess(["FSM_DSO"]);
  const FSTPO = Digit.UserService.hasAccess(["FSM_EMP_FSTPO"]);
  const isApplicationDetails = location?.pathname?.includes("application-details");
  const isVehicleLog = location?.pathname?.includes("fstp-operator-details");
  const isInbox = location?.pathname?.includes("inbox");
  const isFsm = location?.pathname?.includes("fsm");
  const isSearch = location?.pathname?.includes("search");
  const isRegistry = location?.pathname?.includes("registry");
  const isVendorDetails = location?.pathname?.includes("vendor-details");
  const isVendorEdit = location?.pathname?.includes("modify-vendor");
  const isNewApplication = location?.pathname?.includes("new-application");
  const isVehicleDetails = location?.pathname?.includes("vehicle-details");
  const isVehicleEdit = location?.pathname?.includes("modify-vehicle");
  const isDriverDetails = location?.pathname?.includes("driver-details");
  const isDriverEdit = location?.pathname?.includes("modify-driver");
  const isModifyApplication = location?.pathname?.includes("modify-application");
  const isNewVendor = location?.pathname?.includes("new-vendor");
  const isNewVehicle = location?.pathname?.includes("new-vehicle");
  const isNewDriver = location?.pathname?.includes("new-driver");

  const [search, setSearch] = useState(false);
  const [id, setId] = useState(false);

  useEffect(() => {
    if (!search) {
      setSearch(isSearch);
    } else if (isFsm || (isInbox && search)) {
      setSearch(false);
    }
    if (location?.pathname) {
      let path = location?.pathname.split("/");
      let id = path[path.length - 1];
      setId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const crumbs = [
    {
      path: DSO ? "/digit-ui/citizen/fsm/dso-dashboard" : "/digit-ui/employee",
      content: t("ES_COMMON_HOME"),
      show: isFsm,
    },
    {
      path: isRegistry ? "/digit-ui/employee/fsm/registry?selectedTabs=VENDOR" : FSTPO ? "/digit-ui/employee/fsm/fstp-inbox" : "/digit-ui/employee",
      content: isVehicleLog ? t("ES_TITLE_INBOX") : "FSM",
      show: isFsm,
    },
    {
      path: isNewApplication ? "/digit-ui/employee/fsm/new-application" : "",
      content: t("FSM_NEW_DESLUDGING_APPLICATION"),
      show: isFsm && isNewApplication,
    },
    {
      path: "",
      content: `${t("FSM_SUCCESS")}`,
      show: location.pathname.includes("/employee/fsm/response") ? true : false,
    },
    {
      path: isInbox || isSearch || isApplicationDetails ? "/digit-ui/employee/fsm/inbox" : "",
      content: t("ES_TITLE_INBOX"),
      show: (isFsm && isInbox) || isSearch || isApplicationDetails,
    },
    {
      path: "/digit-ui/employee/fsm/search",
      content: t("ES_TITILE_SEARCH_APPLICATION"),
      show: search,
    },
    { content: t("ES_TITLE_APPLICATION_DETAILS"), show: isApplicationDetails },
    { content: t("ES_TITLE_VEHICLE_LOG"), show: isVehicleLog },
    {
      path: "/digit-ui/employee/fsm/registry/vendor-details/" + id,
      content: t("ES_TITLE_VENDOR_DETAILS"),
      show: isRegistry && (isVendorDetails || isVendorEdit),
    },
    {
      path: "/digit-ui/employee/fsm/registry/vehicle-details/" + id,
      content: t("ES_TITLE_VEHICLE_DETAILS"),
      show: isRegistry && (isVehicleDetails || isVehicleEdit),
    },
    {
      path: "/digit-ui/employee/fsm/registry/driver-details/" + id,
      content: t("ES_TITLE_DRIVER_DETAILS"),
      show: isRegistry && (isDriverDetails || isDriverEdit),
    },
    { content: t("ES_TITLE_VENDOR_EDIT"), show: isRegistry && (isVendorEdit || isVehicleEdit || isDriverEdit) },
    {
      path: "digit-ui/employee/fsm/modify-application/" + id,
      content: t("ES_FSM_APPLICATION_UPDATE"),
      show: isModifyApplication,
    },
    {
      content: isNewVendor
        ? t("ES_FSM_ACTION_CREATE_VENDOR")
        : isNewVehicle
        ? t("ES_FSM_REGISTRY_DETAILS_TYPE_VEHICLE")
        : isNewDriver
        ? t("ES_FSM_REGISTRY_DETAILS_TYPE_DRIVER")
        : null,
      show: isRegistry && (isNewVendor || isNewVehicle || isNewDriver),
    },
  ];

  return <BreadCrumb crumbs={crumbs} />;
};

const EmployeeApp = ({ path, url, userType }) => {
  const { t } = useTranslation();
  const location = useLocation();
  // const DSO = Digit.UserService.hasAccess(["FSM_DSO"]);
  // const COLLECTOR = Digit.UserService.hasAccess("FSM_COLLECTOR") || false;
  // const FSM_ADMIN = Digit.UserService.hasAccess("FSM_ADMIN") || false;
  // const FSM_EDITOR = Digit.UserService.hasAccess("FSM_EDITOR_EMP") || false;
  // const FSM_CREATOR = Digit.UserService.hasAccess("FSM_CREATOR_EMP") || false;

  // const moduleForSomeFSMEmployees =
  //   !DSO && !COLLECTOR && !FSM_EDITOR
  //     ? [
  //         {
  //           link: "/digit-ui/employee/fsm/new-application",
  //           name: "FSM_NEW_DESLUDGING_APPLICATION",
  //           icon: <AddNewIcon />,
  //         },
  //       ]
  //     : [];

  // const moduleForSomeFSMAdmin = FSM_ADMIN
  //   ? [
  //       {
  //         link: "/digit-ui/employee/fsm/registry",
  //         name: "ES_TITLE_FSM_REGISTRY",
  //         icon: <AddNewIcon />,
  //       },
  //     ]
  //   : [];

  // const module = [
  //   ...moduleForSomeFSMEmployees,
  //   {
  //     link: "/digit-ui/employee/fsm/inbox",
  //     name: "ES_COMMON_INBOX",
  //     icon: <InboxIcon />,
  //   },
  //   {
  //     link: "/employee/report/fsm/FSMDailyDesludingReport",
  //     hyperlink: true,
  //     name: "ES_FSM_VIEW_REPORTS_BUTTON",
  //     icon: <ViewReportIcon />,
  //   },
  //   ...moduleForSomeFSMAdmin,
  // ];

  useEffect(() => {
    if (!location?.pathname?.includes("application-details")) {
      if (!location?.pathname?.includes("inbox")) {
        Digit.SessionStorage.del("fsm/inbox/searchParams");
      } else if (!location?.pathname?.includes("search")) {
        Digit.SessionStorage.del("fsm/search/searchParams");
      }
    }
  }, [location]);

  const Inbox = Digit.ComponentRegistryService.getComponent("FSMEmpInbox");
  const FstpInbox = Digit.ComponentRegistryService.getComponent("FSMFstpInbox");
  const NewApplication = Digit.ComponentRegistryService.getComponent("FSMNewApplicationEmp");
  const EditApplication = Digit.ComponentRegistryService.getComponent("FSMEditApplication");
  const EmployeeApplicationDetails = Digit.ComponentRegistryService.getComponent("FSMEmployeeApplicationDetails");
  const FstpOperatorDetails = Digit.ComponentRegistryService.getComponent("FSMFstpOperatorDetails");
  const Response = Digit.ComponentRegistryService.getComponent("FSMResponse");
  const ApplicationAudit = Digit.ComponentRegistryService.getComponent("FSMApplicationAudit");
  const RateView = Digit.ComponentRegistryService.getComponent("FSMRateView");
  const FSMLinks = Digit.ComponentRegistryService.getComponent("FSMLinks");
  // const FSTPO = Digit.UserService.hasAccess(["FSM_EMP_FSTPO"]);
  const FSMRegistry = Digit.ComponentRegistryService.getComponent("FSMRegistry");
  const VendorDetails = Digit.ComponentRegistryService.getComponent("VendorDetails");
  const AddVendor = Digit.ComponentRegistryService.getComponent("AddVendor");
  const EditVendor = Digit.ComponentRegistryService.getComponent("EditVendor");
  const VehicleDetails = Digit.ComponentRegistryService.getComponent("VehicleDetails");
  const AddVehicle = Digit.ComponentRegistryService.getComponent("AddVehicle");
  const EditVehicle = Digit.ComponentRegistryService.getComponent("EditVehicle");
  const DriverDetails = Digit.ComponentRegistryService.getComponent("DriverDetails");
  const AddDriver = Digit.ComponentRegistryService.getComponent("AddDriver");
  const EditDriver = Digit.ComponentRegistryService.getComponent("EditDriver");
  // const BreadCrumbComp = Digit.ComponentRegistryService.getComponent("FsmBreadCrumb");

  // const locationCheck =
  //   window.location.href.includes("/employee/fsm/inbox") ||
  //   window.location.href.includes("/employee/fsm/registry") ||
  //   window.location.href.includes("/employee/fsm/application-details/");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    let crumbs = [
      { icon: HomeIcon, path: "/digit-ui/employee" },
      { label: t("ES_TITLE_FAECAL_SLUDGE_MGMT"), path: `/digit-ui/employee/fsm/inbox` },
    ];

    if (pathname.includes("/inbox")) {
      crumbs.push({ label: t("ES_COMMON_INBOX") });
    } else if (pathname.includes("/new-application")) {
      crumbs.push({ label: t("ES_COMMON_INBOX"), path: `${path}/inbox` });
      crumbs.push({ label: t("ES_TITLE_NEW_DESULDGING_APPLICATION") });
    } else if (pathname.includes("/modify-application")) {
      crumbs.push({ label: t("ES_COMMON_INBOX"), path: `${path}/inbox` });
      crumbs.push({ label: t("ES_TITLE_MODIFY_DESULDGING_APPLICATION") });
    } else if (pathname.includes("/application-details") || pathname.includes("/dso-application-details")) {
      crumbs.push({ label: t("ES_COMMON_INBOX"), path: `${path}/inbox` });
      crumbs.push({ label: t("CS_FSM_APPLICATION_DETAIL_TITLE") });
    } else if (pathname.includes("/registry/new-vendor")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VENDOR` });
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_VENDOR") });
    } else if (pathname.includes("/search-vendor")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VENDOR` });
      crumbs.push({ label: t("SEARCH_VENDOR") });
    } else if (pathname.includes("/registry/new-driver")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=DRIVER` });
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_DRIVER") });
    } else if (pathname.includes("/registry/vendor-details") || pathname.includes("/registry/modify-vendor")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VENDOR` });
      crumbs.push({ label: t("VENDOR_VENDOR_DETAILS") });
    } else if (pathname.includes("/registry/vehicle-details") || pathname.includes("/registry/modify-vehicle")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VEHICLE` });
      crumbs.push({ label: t("VENDOR_VEHICLE_DETAILS") });
    } else if (pathname.includes("/registry/new-vehicle")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VEHICLE` });
      crumbs.push({ label: t("ES_FSM_REGISTRY_TITLE_NEW_VEHICLE") });
    } else if (pathname.includes("/registry/driver-details") || pathname.includes("/registry/modify-driver")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=DRIVER` });
      crumbs.push({ label: t("VENDOR_DRIVER_DETAILS") });
    } else if (pathname.includes("/registry/additionaldetails")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY"), path: `${path}/registry?selectedTabs=VENDOR` });
      crumbs.push({ label: t("VENDOR_ADDITIONAL_DETAILS") });
    } else if (pathname.includes("/registry")) {
      crumbs.push({ label: t("ES_TITLE_FSM_REGISTRY") });
    } else if (pathname.includes("/fstp-add-vehicle")) {
      crumbs.push({ label: t("ES_COMMON_FSTP_OPERATION"), path: `${path}/fstp-operations` });
      crumbs.push({ label: t("ES_FSM_ADD_NEW_BUTTON") });
    } else if (pathname.includes("/fstp-inbox")) {
      crumbs.push({ label: t("ES_COMMON_FSTP_OPERATION"), path: `${path}/fstp-operations` });
      crumbs.push({ label: t("ES_TITLE_VEHICLE_LOG") });
    } else if (pathname.includes("/fstp-operations")) {
      crumbs.push({ label: t("ES_COMMON_FSTP_OPERATION") });
    }

    return crumbs;
  };

  // const desludgingApplicationCheck =
  //   window.location.href.includes("/employee/fsm/new-application") || window.location.href.includes("/employee/fsm/modify-application");
  return (
    <Switch>
      <AppContainer>
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
          {/* {FSTPO ? (
            <BackButton
              isCommonPTPropertyScreen={location.pathname.includes("new") ? true : false}
              getBackPageNumber={location.pathname.includes("new") ? () => -2 : null}
            >
              {t("CS_COMMON_BACK")}
            </BackButton>
          ) : (
            <div style={locationCheck ? { marginLeft: "-4px" } : desludgingApplicationCheck ? { marginLeft: "12px" } : { marginLeft: "20px" }}>
              <BreadCrumbComp location={location} />
            </div>
          )} */}
          <PrivateRoute
            exact
            path={`${path}/`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <FSMLinks matchPath={path} userType={userType} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/inbox`}
            component={(props) => <Inbox {...props} parentRoute={path} isInbox={true} />}
          />

          <PrivateRoute
            path={`${path}/fstp-inbox`}
            component={(props) => <FstpInbox {...props} parentRoute={path} />}
          />

          <PrivateRoute
            path={`${path}/new-application`}
            component={() => (
              <LayoutWrapper layoutClass="action">
                <NewApplication parentUrl={url} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/modify-application/:id`}
            component={() => (
              <LayoutWrapper layoutClass="action">
                <EditApplication />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/application-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <EmployeeApplicationDetails {...props} parentRoute={path} userType="EMPLOYEE" />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/fstp-operator-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <FstpOperatorDetails {...props} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/response`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <Response {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/application-audit/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <ApplicationAudit {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/search`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <Inbox {...props} parentRoute={path} isSearch={true} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/rate-view/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <RateView {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/mark-for-disposal`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <div />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            exact
            path={`${path}/registry`}
            component={(props) => <FSMRegistry {...props} parentRoute={path} />}
          />

          <PrivateRoute
            path={`${path}/registry/vendor-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <VendorDetails {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/registry/new-vendor`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <AddVendor {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/registry/modify-vendor/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="action">
                <EditVendor {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/registry/vehicle-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <VehicleDetails {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/registry/new-vehicle`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <AddVehicle {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          {/* 🔥 ACTION BAR ROUTE */}
          <PrivateRoute
            path={`${path}/registry/modify-vehicle/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="action">
                <EditVehicle {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/registry/driver-details/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <DriverDetails {...props} parentRoute={path} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            path={`${path}/registry/new-driver`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <AddDriver {...props} parentRoute={path} />
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
            exact
            path={`${path}/fstp-operations`}
            component={(props) => <FstpOperations {...props} parentRoute={path} />}
          />

          <PrivateRoute
            exact
            path={`${path}/fstp-add-vehicle`}
            component={() => (
              <LayoutWrapper layoutClass="normal">
                <FstpAddVehicle />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            exact
            path={`${path}/fstp-fsm-request/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <FstpServiceRequest {...props} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            exact
            path={`${path}/fstp/new-vehicle-entry`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <FstpOperatorDetails {...props} />
              </LayoutWrapper>
            )}
          />

          <PrivateRoute
            exact
            path={`${path}/fstp/new-vehicle-entry/:id`}
            component={(props) => (
              <LayoutWrapper layoutClass="normal">
                <FstpOperatorDetails {...props} />
              </LayoutWrapper>
            )}
          />
        </div>
      </AppContainer>
    </Switch>
  );
};

export default EmployeeApp;
