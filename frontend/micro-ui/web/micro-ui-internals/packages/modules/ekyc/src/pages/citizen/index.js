import React from "react";
import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft, HomeIcon, LayoutWrapper } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Switch, useLocation, useRouteMatch, Redirect } from "react-router-dom";
import Review from "../../components/Review";
import AssignEkyc from "../../components/AssignEkyc";
import SurveyorDetailsCard from "../../components/SurveyorDetailsCard";
import SupervisorDetailsCard from "../../components/SupervisorDetailsCard";
import VendorDetailsCard from "../../components/VendorDetailsCard";
import EkycStatus from "./EkycStatus";
import Inbox from "../../components/Inbox";
import PermissionGuard from "../../components/PermissionGuard";
import { EKYC_PERMISSIONS } from "../../config/accessControl";

const CitizenApp = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { path } = useRouteMatch();
  const roles = Digit.SessionStorage.get("User")?.info?.roles?.map((ele) => ele.code) || [];

  sessionStorage.removeItem("revalidateddone");

  const getDynamicBreadcrumbs = () => {
    const pathname = location.pathname;

    // Parent crumb — always present and clickable → redirects to eKYC citizen home
    const crumbs = [
      { icon: HomeIcon, path: "/digit-ui/citizen" },
      { label: t("EKYC_MODULE_NAME"), path: `/digit-ui/citizen/ekyc` },
    ];

    // Child crumb — only appended when on a sub-page
    if (pathname.includes("/create-kyc")) {
      crumbs.push({ label: t("EKYC_CREATE_KYC") });
    } else if (pathname.includes("/aadhaar-verification")) {
      crumbs.push({ label: t("EKYC_AADHAAR_VERIFICATION") });
    } else if (pathname.includes("/address-details")) {
      crumbs.push({ label: t("EKYC_ADDRESS_DETAILS") });
    } else if (pathname.includes("/property-info")) {
      crumbs.push({ label: t("EKYC_PROPERTY_INFO") });
    } else if (pathname.includes("/meter-details")) {
      crumbs.push({ label: t("EKYC_METER_DETAILS") });
    } else if (pathname.includes("/review")) {
      crumbs.push({ label: t("EKYC_INBOX"), path: `/digit-ui/citizen/ekyc/inbox` });
      crumbs.push({ label: t("EKYC_REVIEW") });
    } else if (pathname.includes("/assign/surveyor-details")) {
      crumbs.push({ label: t("EKYC_ASSIGN"), path: `/digit-ui/citizen/ekyc/assign` });
      crumbs.push({ label: t("EKYC_SURVEYOR_DETAILS") });
    } else if (pathname.includes("/inbox")) {
      crumbs.push({ label: t("EKYC_INBOX") });
    } else if (pathname.includes("/supervisor-dashboard")) {
      crumbs.push({ label: t("EKYC_SUPERVISOR_DASHBOARD") });
    } else if (pathname.includes("/surveyor-dashboard")) {
      crumbs.push({ label: t("EKYC_SURVEYOR_DASHBOARD") });
    } else if (pathname.includes("/vendor-dashboard")) {
      crumbs.push({ label: t("EKYC_VENDOR_DASHBOARD") || "Vendor Dashboard" });
    } else if (pathname.includes("/dashboard")) {
      crumbs.push({ label: t("EKYC_DASHBOARD") });
    } else if (pathname.includes("/assign")) {
      crumbs.push({ label: t("EKYC_ASSIGN") });
    } else if (pathname.includes("/status/") || /^\/digit-ui\/citizen\/ekyc\/[^/]+$/.test(pathname)) {
      const statusLabel = t("EKYC_STATUS");
      crumbs.push({ label: statusLabel === "EKYC_STATUS" || statusLabel === "STATUS" ? "eKYC Status" : statusLabel });
    }
    // home (exact path) → no child crumb

    return crumbs;
  };

  // const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);
  // const isEkyAction = (!roles?.includes("EKYC_SURVEYOR") || roles?.includes("EMPLOYEE"))
  return (
    <AppContainer>
      <div className="ground-container form-container" style={{ flex: 1 }}>
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

        <Switch>
          <PrivateRoute path={path} exact component={() => <Redirect to="/digit-ui/citizen/ekyc-home" />} />

          <PrivateRoute
            path={`${path}/inbox`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.INBOX_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <Inbox />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/review/:kno`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.REVIEW_VIEW]}>
                <LayoutWrapper layoutClass={roles.includes("EKYC_SUPERVISOR") ? "action" : "normal"}>
                  <Review />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/assign/surveyor-details/:id`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.SURVEYOR_DETAILS_VIEW]}>
                <LayoutWrapper layoutClass={roles.includes("EKYC_SUPERVISOR") ? "action" : "normal"}>
                  <SurveyorDetailsCard />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/assign`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.ASSIGN_SURVEYOR]}>
                <LayoutWrapper layoutClass="normal">
                  <AssignEkyc />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/status/:applicationId`}
            exact
            component={() => (
              <PermissionGuard allowedRoles={["CITIZEN"]} permissions={[EKYC_PERMISSIONS.APPLICATION_STATUS_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <Review />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/vendor-dashboard`}
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.VENDOR_DASHBOARD_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <VendorDetailsCard />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/supervisor-dashboard/:id`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.SUPERVISOR_DASHBOARD_DETAILS_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <SupervisorDetailsCard />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/supervisor-dashboard`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.SUPERVISOR_DASHBOARD_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <SupervisorDetailsCard />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/surveyor-dashboard/:id`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.SURVEYOR_DASHBOARD_DETAILS_VIEW]}>
                <LayoutWrapper layoutClass={roles.includes("EKYC_SUPERVISOR") ? "action" : "normal"}>
                  <SurveyorDetailsCard />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/surveyor-dashboard`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.SURVEYOR_DASHBOARD_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <SurveyorDetailsCard />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />

          <PrivateRoute
            path={`${path}/:id`}
            exact
            component={() => (
              <PermissionGuard permissions={[EKYC_PERMISSIONS.APPLICATION_STATUS_VIEW]}>
                <LayoutWrapper layoutClass="normal">
                  <EkycStatus />
                </LayoutWrapper>
              </PermissionGuard>
            )}
          />
        </Switch>
      </div>
    </AppContainer>
  );
};

export default CitizenApp;
