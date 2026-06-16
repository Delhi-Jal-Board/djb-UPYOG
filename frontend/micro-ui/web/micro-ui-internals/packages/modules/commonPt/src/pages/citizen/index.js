import { AppContainer, ArrowLeft, BackButton, HomeIcon, ModuleHeader, PrivateRoute, LayoutWrapper } from "@djb25/digit-ui-react-components";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import CreateProperty from "./Create";
import SearchPropertyComponent from "./SearchProperty";
import SearchResultsComponent from "./SearchResults";
import PropertyLinkSuccess from "./LinkSuccess";
import CitizenOtp from "./Otp";
import ViewProperty from "../pageComponents/ViewProperty";
import { useTranslation } from "react-i18next";



const App = ({ stateCode }) => {
  const { t } = useTranslation();
  const { path, url, ...match } = useRouteMatch();
  
  const getBreadcrumbLabel = () => {
    const pathname = location.pathname;
    if (pathname.includes("/commonpt/search")) return "SEARCH_PROPERTY";
    else if (pathname.includes("/view-property")) return "PT_PROPERTY_INFORMATION";
    if (pathname.includes("/property/new-application")) return "PT_CREATE_PROPERTY";

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
            <span className={"pt-citizen"} style={{ width: "100%" }}>
              <Switch>
                <PrivateRoute path={`${path}/search`} component={SearchPropertyComponent} />
                <PrivateRoute path={`${path}/property/citizen-search`} component={SearchPropertyComponent} />
                <PrivateRoute path={`${path}/property/search-results`} component={(props) => <SearchResultsComponent {...props} stateCode={stateCode} />} />
                <Route path={`${path}/property/citizen-otp`}>
                  <CitizenOtp stateCode={stateCode} />
                </Route>
                <PrivateRoute path={`${path}/property/link-success/:propertyIds`} component={PropertyLinkSuccess}></PrivateRoute>
                <PrivateRoute 
                  path={`${path}/property/new-application`} 
                  component={CreateProperty} 
                />
                <PrivateRoute path={`${path}/view-property`} component={ViewProperty} />
              </Switch>
            </span>
          </div>
        </div>
      </div>
    </AppContainer>
  );
};

export default App;
