import React, { useEffect } from "react";
import { useRouteMatch } from "react-router-dom";
import EmployeeApp from "./pages/employee";
import VENDORCard from "./components/VENDORCard";
import VendorDetails from "./pageComponents/VendorDetails";
import VendorDocuments from "./pageComponents/VendorDocuments";
import ServiceDoc from "./pageComponents/ServiceDoc";
import VendorSelectAddress from "./pageComponents/VendorSelectAddress";
import SelectServiceType from "./pageComponents/SelectServiceType";
import SelectVehicleType from "./pageComponents/SelectVehicleType";
import BankDetailsComponent from "./components/BankDetailsComponent";
import SupervisorAreaAssignment from "./pageComponents/SupervisorAreaAssignment";
import CitizenVendorApp from "./pages/citizen";
import CheckPage from "./components/Create/CheckPage";
import NewResponse from "./components/Create/NewResponse";
import AddDriver from "./components/RegisterDriver/AddDriver";
import DriverDetails from "./components/RegisterDriver/DriverDetails";
import AddVehicle from "./components/RegisterVehicle/AddVehicle";
import VehicleDetails from "./components/RegisterVehicle/VehicleDetails";
import SelectEkycZones from "./pageComponents/SelectEkycZones";
import SelectEkycClusters from "./pageComponents/SelectEkycClusters";
import SelectEkycDropdown from "./pageComponents/SelectEkycDropdown";

const componentsToRegister = {
  VendorDetails,
  //VENDOREMPCreate,
  // VendorAddress,
  // VendorPincode,
  VendorDocuments,
  ServiceDoc,
  VendorSelectAddress,
  SelectServiceType,
  SelectVehicleType,
  BankDetailsComponent,
  AddDriver,
  AddVehicle,
  VENDORCheckPage: CheckPage,
  NewResponse,
  DriverDetails,
  VehicleDetails,
  SupervisorAreaAssignment,
  SelectEkycZones,
  SelectEkycClusters,
  SelectEkycDropdown,
};

const addComponentsToRegistry = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};

export const VENDORModule = ({ stateCode, userType, tenants }) => {
  const { path, url } = useRouteMatch();
  const language = Digit.StoreData.getCurrentLanguage();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  // Dont remove this it is requiored for Localization

  useEffect(() => {
    Digit.LocalizationService.getLocale({
      modules: ["rainmaker-vendor"],
      locale: language,
      tenantId: "dl",
    });
  }, [language, tenantId]);
  addComponentsToRegistry();

  Digit.SessionStorage.set("VENDOR_TENANTS", tenants);

  useEffect(() => {
    userType === "employee" &&
      Digit.LocalizationService.getLocale({
        modules: [`rainmaker-${tenantId}`],
        locale: language,
        tenantId: tenantId,
      });
  }, []);

  if (userType === "employee") return <EmployeeApp path={path} url={url} userType={userType} />;
  return <CitizenVendorApp path={path} url={url} userType={userType} />;
};

export const VENDORLinks = ({ matchPath, userType }) => {
  const [, , clearParams] = Digit.Hooks.useSessionStorage("VENDOR", {});

  useEffect(() => {
    clearParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export const VENDORComponents = {
  VENDORCard,
  VENDORModule,
  VENDORLinks,
  // AST_INBOX_FILTER: (props) => <InboxFilter {...props} />,
  // ASTInboxTableConfig: TableConfig,
};
