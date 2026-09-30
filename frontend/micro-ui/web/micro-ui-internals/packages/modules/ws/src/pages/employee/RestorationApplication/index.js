import React from "react";
import { useTranslation } from "react-i18next";
import { useRouteMatch, Switch, Route } from "react-router-dom";
import { Redirect } from "react-router-dom/cjs/react-router-dom.min";

const RestorationApplication = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const config = [
    { route: "k-number", component: "WSDisconnectionKNumber", key: "WSDisconnectionKNumber" },
    { route: "consumer-details", component: "WSDisconnectionConsumerDetails", key: "WSDisconnectionConsumerDetails" },
    { route: "new-restoration", component: "WSRestorationForm", key: "WSRestorationForm" },
  ];
  config.indexRoute = "k-number";
  const Component = Digit.ComponentRegistryService.getComponent("WSRestorationForm");
const getPath = (path, params) => {
  params && Object.keys(params).map(key => {
    path = path.replace(`:${key}`, params[key]);
  })
  return path;
}
  return (
    <Switch>
      {config.map((routeObj, index) => {
        const { component, texts, inputs, key, isSkipEnabled } = routeObj;
        const Component = Digit.ComponentRegistryService.getComponent(component);
        return (
          <Route path={`${getPath(match.path, match.params)}/${routeObj.route}`} key={index}>
            <Component config={{ texts, inputs, key, isSkipEnabled }} t={t} userType={"employee"} flow={"reconnection"} />
          </Route>
        );
      })}
    
      <Route>
        <Redirect to={`${getPath(match.path, match.params)}/${config.indexRoute}`} />
      </Route>
    </Switch>
  );
};

export default RestorationApplication;
