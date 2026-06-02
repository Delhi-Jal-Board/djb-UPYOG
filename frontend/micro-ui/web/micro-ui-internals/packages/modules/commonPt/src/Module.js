import { CitizenHomeCard, PTIcon } from "@djb25/digit-ui-react-components";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouteMatch } from "react-router-dom";

import CitizenApp from "./pages/citizen";
import EmployeeApp from "./pages/employee";

import CPTPropertyAssemblyDetails from "./pages/components/PropertyAssemblyDetails";
import CPTPropertyLocationDetails from "./pages/components/PropertyLocationDetails";
import CPTPropertyOwnerDetails from "./pages/components/PropertyOwnerDetails";
import PropertyWaterConnection from "./pages/components/PropertyWaterConnection";
import CPTSearchProperty from "./pages/citizen/SearchProperty";
import CPTPropertySearchForm from "./components/search/CPTPropertySearchForm";
import CPTPropertySearchResults from "./components/search/CPTPropertySearchResults";
import CPTKnowYourProperty from "./pages/pageComponents/KnowYourProperty";
import CPTPropertyDetails from "./pages/pageComponents/PropertyDetails";
import CPTPropertySearchNSummary from "./pages/pageComponents/PropertySearchNSummary";
import CPTSearchResults from "./pages/citizen/SearchResults";
import CPTCreateProperty from "./pages/pageComponents/createForm";
import CPTAcknowledgement from "./pages/pageComponents/PTAcknowledgement";
import CommonPTCard from "./components/CommonPTCard";
export const CommonPTModule = ({ userType, tenants }) => {
  const { path, url } = useRouteMatch();

  const moduleCode = ["PT", "CommonPT"];
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({ moduleCode, language });

  Digit.SessionStorage.set("PT_TENANTS", tenants);

  useEffect(
    () =>
      userType === "employee" &&
      Digit.LocalizationService.getLocale({
        modules: [`rainmaker-${Digit.ULBService.getCurrentTenantId()}`],
        locale: Digit.StoreData.getCurrentLanguage(),
        tenantId: Digit.ULBService.getCurrentTenantId(),
      }),
    []
  );

  if (userType === "employee") {
    return <EmployeeApp path={path} url={url} userType={userType} tenants={tenants} />;
  } else return <CitizenApp />;
};

export const CommonPTLinks = ({ matchPath, userType }) => {
  const { t } = useTranslation();

  const links = [
    {
      link: `${matchPath}/property/citizen-search`,
      i18nKey: t("PT_SEARCH_AND_PAY"),
    },

    {
      link: `${matchPath}/property/new-application`,
      i18nKey: t("PT_CREATE_PROPERTY"),
    },
  ];

  return <CitizenHomeCard header={t("ACTION_TEST_COMMON_PROPERTY_TAX")} links={links} Icon={() => <PTIcon className="fill-path-primary-main" />} />;
};

export const CommonPTComponents = {
  CommonPTCard,
  CommonPTModule,
  CommonPTLinks,
};

const componentsToRegister = {
  CommonPTModule,
  CommonPTCard,
  CommonPTLinks,
  CPTPropertySearchForm,
  CPTPropertySearchResults,
  CPTSearchProperty,
  CPTPropertyAssemblyDetails,
  CPTPropertyLocationDetails,
  CPTPropertyOwnerDetails,
  PropertyWaterConnection,
  CPTKnowYourProperty,
  CPTPropertyDetails,
  CPTPropertySearchNSummary,
  CPTSearchResults,
  CPTCreateProperty,
  CPTAcknowledgement,
};

export const initCommonPTComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
