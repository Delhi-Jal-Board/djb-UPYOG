import React, { useEffect } from "react";
import { Switch, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PrivateRoute, AppContainer, DynamicBreadCrumb, HomeIcon } from "@djb25/digit-ui-react-components"
import LocalisationSearch from "./LocalisationSearch";
import ApplyWorkflow from "./ApplyWorkflow";
import MDMSSearch from "./MDMSSearch";
import MDMSAdd from "./MDMSAdd";
import MDMSAddV2 from "./MDMSAddV2";
import MDMSEdit from "./MDMSEdit";
import MDMSView from "./MDMSView";
import MDMSSearchv2 from "./MDMSSearchv2";
import MDMSManageMaster from "./MDMSManageMaster";
import LocalisationAdd from "./LocalisationAdd";
import SchemaAdd from "./SchemaAdd";

const WorkbenchBreadCrumb = ({ location, defaultPath }) => {
  const { t } = useTranslation();
  const search = useLocation().search;
  const fromScreen = new URLSearchParams(search).get("from") || null;
  const pathVar = location.pathname.replace(defaultPath + '/', "").split("?")?.[0];
  const { masterName, moduleName, uniqueIdentifier } = Digit.Hooks.useQueryParams()

  const customConfig = {
    // Map workbench-ui to just the Home icon
    "workbench-ui": { icon: HomeIcon, content: "", show: true, path: `/${window?.contextPath}/employee` },
    // Map employee to the WORKBENCH_HOME text
    "employee": { content: "WORKBENCH_HOME", show: true, path: `/${window?.contextPath}/employee` },
    "workbench": { show: false },
    "manage-master-data": { content: "WBH_MANAGE_MASTER_DATA", show: true },
    "localisation-search": { content: "LOCALISATION_SEARCH", show: true, isBack: true },
    "mdms-search-v2": { content: Digit.Utils.workbench.getMDMSLabel(pathVar, masterName, moduleName), show: true, isBack: true },
    "mdms-view": { content: "MDMS_VIEW", show: true }
  };

  return <DynamicBreadCrumb customConfig={customConfig} />;
};

const App = ({ path }) => {
  const location = useLocation();
  const MDMSCreateSession = Digit.Hooks.useSessionStorage("MDMS_add", {});
  const [sessionFormData, setSessionFormData, clearSessionFormData] = MDMSCreateSession;

  const MDMSViewSession = Digit.Hooks.useSessionStorage("MDMS_view", {});
  const [sessionFormDataView, setSessionFormDataView, clearSessionFormDataView] = MDMSViewSession

  useEffect(() => {
    // Function to clear session storage for keys with specific prefixes
    const clearSessionStorageWithPrefix = (prefix) => {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(`Digit.${prefix}`)) {
          sessionStorage.removeItem(key);
        }
      });
    };
    const currentUrl = window.location.href;
    if (!currentUrl.includes("mdms-add-v2") && !currentUrl.includes("mdms-add-v4") && !currentUrl.includes("mdms-view")) {
      clearSessionStorageWithPrefix('MDMS_add');
    }
    if (!currentUrl.includes("mdms-view")) {
      clearSessionStorageWithPrefix('MDMS_view');
    }
    if (!currentUrl.includes("mdms-edit")) {
      clearSessionStorageWithPrefix('MDMS_edit');
    }
  }, [window.location.href]);

  useEffect(() => {
    if (!window.location.href.includes("mdms-add-v2") && sessionFormData && Object.keys(sessionFormData) != 0) {
      clearSessionFormData();
    }
    if (!window.location.href.includes("mdms-view") && sessionFormDataView) {
      clearSessionFormDataView();
    }
  }, [location]);

  return (
    <React.Fragment>
      <WorkbenchBreadCrumb location={location} defaultPath={path} />
      <Switch>
        <AppContainer className="workbench">
          <PrivateRoute path={`${path}/sample`} component={() => <div>Sample Screen loaded</div>} />
          <PrivateRoute path={`${path}/localisation-search`} component={() => <LocalisationSearch />} />
          <PrivateRoute path={`${path}/mdms-search`} component={() => <MDMSSearch />} />
          <PrivateRoute path={`${path}/mdms-add`} component={() => <MDMSAdd FormSession={MDMSCreateSession} parentRoute={path} />} />
          <PrivateRoute path={`${path}/mdms-add-v2`} component={() => <MDMSAddV2 parentRoute={path} />} />
          <PrivateRoute path={`${path}/mdms-view`} component={() => <MDMSView parentRoute={path} />} />
          <PrivateRoute path={`${path}/mdms-edit`} component={() => <MDMSEdit parentRoute={path} />} />
          <PrivateRoute path={`${path}/manage-master-data`} component={() => <MDMSManageMaster parentRoute={path} />} />
          <PrivateRoute path={`${path}/mdms-search-v2`} component={() => <MDMSSearchv2 parentRoute={path} />} />
          <PrivateRoute path={`${path}/localisation-add`} component={() => <LocalisationAdd parentRoute={path} />} />
          <PrivateRoute path={`${path}/schema-add`} component={() => <SchemaAdd parentRoute={path} />} />
          <PrivateRoute path={`${path}/apply-workflow`} component={() => <ApplyWorkflow parentRoute={path} />} />

        </AppContainer>
      </Switch>
    </React.Fragment>
  );
};

export default App;
