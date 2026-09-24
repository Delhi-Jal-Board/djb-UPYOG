import React from "react";
import { useTranslation } from "react-i18next";
import { useRouteMatch, useLocation, Switch, Route, Redirect } from "react-router-dom";
import { newConfig as newConfigWS } from "../../../config/wsDisconnectionConfig";

const getPath = (path, params) => {
  params && Object.keys(params).map(key => {
    path = path.replace(`:${key}`, params[key]);
  })
  return path;
}


const DisconnectionApplication = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const location = useLocation();

  // Always use the static config (same as citizen flow) so that locally added
  // routes (k-number, consumer-details) are always registered as <Route>s
  // regardless of what the MDMS server returns.
  let config = [];
  newConfigWS
    .filter((e) => e.head === "NEW_DISCONNECTION")
    .forEach((obj) => {
      config = config.concat(obj.body.filter((a) => !a.hideInEmployee));
    });
  config.indexRoute = "docsrequired";

  
  return (
    <Switch>
      {config.map((routeObj, index) => {
        const { component, texts, inputs, key, isSkipEnabled } = routeObj;
        const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;
        return (
          <Route path={`${getPath(match.path, match.params)}/${routeObj.route}`} key={index}>
            <Component config={{ texts, inputs, key, isSkipEnabled }}  t={t} userType={"employee"} />
          </Route>
        );
      })}
    
      <Route>
        <Redirect to={`${getPath(match.path, match.params)}/${config.indexRoute}${location.search}`} />
      </Route>
    </Switch>
  );
};

export default DisconnectionApplication;
