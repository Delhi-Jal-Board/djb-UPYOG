import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouteMatch } from "react-router-dom";
import { CitizenHomeCard, DocumentIcon, Loader } from "@djb25/digit-ui-react-components";
import EKYCCard from "./components/EKYCCard";
import Inbox from "./components/Dashboard";
import DesktopInbox from "./components/DesktopInbox";
import MobileInbox from "./components/MobileInbox";
import Filter from "./components/Filter";
import EmployeeApp from "./pages/employee";
import CitizenApp from "./pages/citizen";
import PropertyInfo from "./components/PropertyInfo";
import MeterDetails from "./components/MeterDetails";
import AadhaarVerification from "./components/AadhaarVerification";

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
  const propsForModuleCard = {
    links: [],
  };
  const citizenInfo = Digit.SessionStorage.get("User")?.info?.roles;
  const roles = Array.isArray(citizenInfo) ? citizenInfo.map((ele) => ele.code) : [];

  if (roles.includes("EKYC_SURVEYOR")) {
    propsForModuleCard.links.push({
      label: t("SURVEYOR_DASHBOARD"),
      link: `/digit-ui/citizen/ekyc/surveyor-dashboard`,
    });
  }

  if (roles.includes("EKYC_SUPERVISOR") || roles.includes("EKYC_VENDOR")) {
    propsForModuleCard.links.push({
      label: t("EKYC_INBOX"),
      link: `/digit-ui/citizen/ekyc/inbox`,
    });
  }

  if (roles.includes("EKYC_SUPERVISOR")) {
    propsForModuleCard.links.push(
      {
        label: t("EKYC_SUPERVISOR_DASHBOARD"),
        link: `/digit-ui/citizen/ekyc/supervisor-dashboard`,
      },
      {
        label: t("EKYC_ASSIGN"),
        link: `/digit-ui/citizen/ekyc/assign`,
      }
    );
  }

  if (roles.includes("EKYC_VENDOR")) {
    propsForModuleCard.links.push({
      label: t("EKYC_VENDOR_DASHBOARD"),
      link: `/digit-ui/citizen/ekyc/vendor-dashboard`,
    });
  }

  if (roles.includes("EKYC_SUPERVISOR") || roles.includes("EKYC_VENDOR")) {
    propsForModuleCard.links.push({
      label: t("TITLE_VENDOR_MANAGEMENT"),
      link: `/digit-ui/citizen/vendor/search-vendor`,
    });
  }

  if (roles.length === 1 && roles.includes("CITIZEN")) {
    propsForModuleCard.links.push({
      label: t("EKYC_STATUS"),
      link: `/digit-ui/citizen/ekyc/:id`,
    });
  }

  const formattedLinks = propsForModuleCard.links.map((l) => ({
    i18nKey: l.label,
    link: l.link,
    count: l.count,
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
  EKYCDesktopInbox: DesktopInbox,
  EKYCMobileInbox: MobileInbox,
  EKYC_INBOX_FILTER: (props) => <Filter {...props} />,
  EkycLinks,
  AadhaarVerification,
  PropertyInfo,
  MeterDetails,
};

export const initEkycComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

export default EkycModule;
