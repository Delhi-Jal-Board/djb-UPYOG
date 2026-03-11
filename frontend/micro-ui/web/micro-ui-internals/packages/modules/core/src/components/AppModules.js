import React, { useContext, useEffect } from "react";
import { Route, Switch, useRouteMatch, Redirect, useLocation } from "react-router-dom";

import { AppHome } from "./Home";
import Login from "../pages/citizen/Login";
import EmployeeLogin from "../pages/employee/Login/index";
import ChangePassword from "../pages/employee/ChangePassword/index";
import ForgotPassword from "../pages/employee/ForgotPassword/index";
import LanguageSelection from "../pages/employee/LanguageSelection";
import { ExpandedViewContext, ExpandedViewPage } from "@djb25/digit-ui-react-components";
// import UserProfile from "./userProfile";

const getTenants = (codes, tenants) => {
  return tenants.filter((tenant) => codes?.map?.((item) => item.code).includes(tenant.code));
};

export const AppModules = ({ stateCode, userType, modules, appTenants }) => {
  const ComponentProvider = Digit.Contexts.ComponentProvider;
  const { path } = useRouteMatch();
  const location = useLocation();

  const user = Digit.UserService.getUser();

  if (!user || !user?.access_token || !user?.info) {
    return <Redirect to={{ pathname: "/digit-ui/employee/user/login", state: { from: location.pathname + location.search } }} />;
  }

  const appRoutes = modules.map(({ code, tenants }, index) => {
    const Module = Digit.ComponentRegistryService.getComponent(`${code}Module`);
    return Module ? (
      <Route key={index} path={`${path}/${code.toLowerCase()}`}>
        <Module stateCode={stateCode} moduleCode={code} userType={userType} tenants={getTenants(tenants, appTenants)} />
      </Route>
    ) : (
      <Route key={index} path={`${path}/${code.toLowerCase()}`}>
        <Redirect to={{ pathname: "/digit-ui/employee/user/error?type=notfound", state: { from: location.pathname + location.search } }} />
      </Route>
    );
  });

  const renderSidebar = () => {
    const pathname = location.pathname;
    const isTopLevelPage =
      pathname.includes("/login") ||
      pathname.includes("/forgot-password") ||
      pathname.includes("/change-password") ||
      pathname.endsWith("/employee") ||
      pathname.includes("/module/details");

    if (isTopLevelPage) return null;

    const modulePrefix = `/digit-ui/employee/`;
    const modulePathPart = pathname.replace(modulePrefix, "").split("/")[0];
    const activeModule = modules.find((m) => m.code.toLowerCase() === modulePathPart.toLowerCase());

    if (!activeModule) return null;

    let CardComponent = Digit.ComponentRegistryService.getComponent(`${activeModule.code}Card`);

    if (CardComponent) {
      return (
        <div className="collapsible-sidebar-container">
          <ExpandedViewContext.Provider value={{ isModuleSidebar: true }}>
            <CardComponent />
          </ExpandedViewContext.Provider>
        </div>
      );
    }
    return null;
  };

  const sidebarContent = renderSidebar();

  return (
    <div style={{ display: "flex", width: "100vw", height: "100%" }}>
      {sidebarContent}
      <div className="app-wrapper">
        <Switch>
          {appRoutes}
          <Route path={`${path}/login`}>
            <Redirect to={{ pathname: "/digit-ui/employee/user/login", state: { from: location.pathname + location.search } }} />
          </Route>
          <Route path={`${path}/forgot-password`}>
            <ForgotPassword />
          </Route>
          <Route path={`${path}/change-password`}>
            <ChangePassword />
          </Route>
          <Route path={`${path}/module/details`}>
            <ExpandedViewPage modules={modules} />
          </Route>

          <Route>
            <AppHome userType={userType} modules={modules} />
          </Route>
          {/* <Route path={`${path}/user-profile`}> <UserProfile /></Route> */}
        </Switch>
      </div>
    </div>
  );
};
