import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouteMatch, Redirect, useLocation } from "react-router-dom";
import { CitizenHomeCard, DocumentIcon, Loader } from "@djb25/digit-ui-react-components";
import EKYCCard from "./components/EKYCCard";
import Inbox from "./components/Dashboard";
import EmployeeApp from "./pages/employee";
import CitizenApp from "./pages/citizen";
import { EKYC_PERMISSIONS } from "./config/accessControl";
import { getUserRoles, hasPermission } from "./utils/accessControl";

export const EkycModule = ({ stateCode, userType, tenants }) => {
  const { path, url } = useRouteMatch();
  const moduleCode = "EKYC";
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading } = Digit.Services.useStore({ stateCode, moduleCode, language });

  Digit.SessionStorage.set("EKYC_TENANTS", tenants);

  useEffect(
    () =>
      Digit.LocalizationService.getLocale({
        modules: [`rainmaker-${Digit.ULBService.getCurrentTenantId()}`],
        locale: Digit.StoreData.getCurrentLanguage(),
        tenantId: Digit.ULBService.getCurrentTenantId(),
      }),
    []
  );

  if (isLoading) {
    return <Loader page={true} />;
  }

  if (userType === "employee") {
    return <EmployeeApp path={path} url={url} userType={userType} tenants={tenants} />;
  } else return <CitizenApp />;
};

export const EkycLinks = ({ matchPath, userType }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const links = [];

  const user = Digit.SessionStorage.get("User");
  const isAuthenticated = !!window.keycloak?.authenticated || !!user?.access_token;
  if (!isAuthenticated) {
    return (
      <Redirect
        to={{
          pathname: "/digit-ui/citizen/login",
          state: { from: location.pathname + location.search },
        }}
      />
    );
  }

  const addLink = (permission, label, link) => {
    if (hasPermission(permission)) {
      links.push({
        label: t(label),
        link,
      });
    }
  };

  // Surveyor only
  addLink(
    EKYC_PERMISSIONS.SURVEYOR_DASHBOARD_VIEW,
    "SURVEYOR_DASHBOARD",
    "/digit-ui/citizen/ekyc/surveyor-dashboard"
  );

  // Supervisor and Vendor
  addLink(
    EKYC_PERMISSIONS.INBOX_VIEW,
    "EKYC_INBOX",
    "/digit-ui/citizen/ekyc/inbox"
  );

  // Supervisor only
  addLink(
    EKYC_PERMISSIONS.SUPERVISOR_DASHBOARD_VIEW,
    "EKYC_SUPERVISOR_DASHBOARD",
    "/digit-ui/citizen/ekyc/supervisor-dashboard"
  );

  addLink(
    EKYC_PERMISSIONS.ASSIGN_SURVEYOR,
    "EKYC_ASSIGN",
    "/digit-ui/citizen/ekyc/assign"
  );

  // Vendor only
  addLink(
    EKYC_PERMISSIONS.VENDOR_DASHBOARD_VIEW,
    "EKYC_VENDOR_DASHBOARD",
    "/digit-ui/citizen/ekyc/vendor-dashboard"
  );

  // Supervisor and Vendor
  addLink(
    EKYC_PERMISSIONS.VENDOR_MANAGEMENT_VIEW,
    "TITLE_VENDOR_MANAGEMENT",
    "/digit-ui/citizen/vendor/search-vendor"
  );

  // Citizen only
  if (getUserRoles().length === 1 && getUserRoles().includes("CITIZEN")) {
    links.push({
      label: t("EKYC_STATUS"),
      link: "/digit-ui/citizen/ekyc",
    });
  }

  const formattedLinks = links.map((link) => ({
    i18nKey: link.label,
    link: link.link,
  }));

  return (
    <CitizenHomeCard
      header={t("EKYC_MODULE_NAME")}
      links={formattedLinks}
      Icon={() => <DocumentIcon className="fill-path-primary-main" />}
    />
  );
};

const componentsToRegister = {
  EKYCModule: EkycModule,
  EKYCCard,
  EKYCInbox: Inbox,
  EkycLinks,
};

export const initEkycComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

export default EkycModule;
