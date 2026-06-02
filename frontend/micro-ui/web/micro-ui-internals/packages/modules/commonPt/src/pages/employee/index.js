import { AppContainer, ArrowLeft, BreadCrumb, HomeIcon, LayoutWrapper, ModuleHeader, PrivateRoute } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Switch, useLocation } from "react-router-dom";
import { CommonPTLinks } from "../../Module";
import ViewProperty from "../pageComponents/ViewProperty";
import NewApplication from "./NewApplication";
import Search from "./Search";

const EmployeeApp = ({ path, url, userType }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const urlpropertyId = new URLSearchParams(useLocation().search).get("propertyId");
  const urltenantId = new URLSearchParams(useLocation().search).get("tenantId");
  const mobileView = innerWidth <= 640;

  const getBreadcrumbLabel = () => {
    const pathname = location.pathname;
    if (pathname.includes("/commonpt/search")) return "SEARCH_PROPERTY";
    else if (pathname.includes("/view-property")) return "PT_PROPERTY_INFORMATION";

    return "ES_COMMON_INBOX";
  };

  const breadcrumbs = [{ icon: HomeIcon, path: "/digit-ui/employee" }, { label: t(getBreadcrumbLabel()) }];

  return (
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
          breadcrumbs={breadcrumbs}
        />
        <div className="employee-form">
          <div className="employee-form-content">
            <Switch>
              <PrivateRoute exact path={`${path}/`} component={() => <CommonPTLinks matchPath={path} userType={userType} />} />
              <PrivateRoute
                path={`${path}/new-application`}
                component={() => (
                  <LayoutWrapper layoutClass="action">
                    <NewApplication path={path} />
                  </LayoutWrapper>
                )}
              />
              <PrivateRoute path={`${path}/search`} component={Search} />
              <PrivateRoute path={`${path}/view-property`} component={ViewProperty} />
            </Switch>
          </div>
        </div>
      </div>
    </AppContainer>
  );
};

export default EmployeeApp;
