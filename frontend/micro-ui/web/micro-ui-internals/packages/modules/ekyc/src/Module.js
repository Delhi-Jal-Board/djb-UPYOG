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
        modules: [`rainmaker-ekyc`, `rainmaker-${Digit.ULBService.getCurrentTenantId()}`],
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
  const links = [
    {
      link: `${matchPath}/create-kyc`,
      i18nKey: t("EKYC_CREATE_KYC"),
    },
    {
      link: `${matchPath}/update-kyc`,
      i18nKey: t("EKYC_UPDATE_KYC"),
    },
  ];

  return <CitizenHomeCard header={t("EKYC_MODULE_NAME")} links={links} Icon={() => <DocumentIcon className="fill-path-primary-main" />} />;
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
