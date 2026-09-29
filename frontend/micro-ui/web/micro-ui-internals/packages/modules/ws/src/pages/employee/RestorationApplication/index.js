import React from "react";
import { useTranslation } from "react-i18next";
import { useRouteMatch, Switch, Route } from "react-router-dom";

const RestorationApplication = () => {
  const { t } = useTranslation();
  const match = useRouteMatch();
  const Component = Digit.ComponentRegistryService.getComponent("WSRestorationForm");

  return (
    <Switch>
      <Route path={`${match.path}/new-restoration`}>
        <Component config={{}} t={t} userType={"employee"} />
      </Route>
      <Route path={`${match.path}`}>
        <Component config={{}} t={t} userType={"employee"} />
      </Route>
    </Switch>
  );
};

export default RestorationApplication;
