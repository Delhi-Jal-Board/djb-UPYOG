import { Loader, LayoutWrapper } from "@djb25/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import EditPropertyForm from "../../pageComponents/editForm";
import PTAcknowledgement from "../../pageComponents/PTAcknowledgement";

const EditProperty = () => {
  const queryClient = useQueryClient();
  const match = useRouteMatch();
  const { t } = useTranslation();
  const history = useHistory();
  const [params, , clearParams] = Digit.Hooks.useSessionStorage("PT_CREATE_PROPERTY", {});

  const onSuccess = () => {
    clearParams();
    queryClient.invalidateQueries("PT_CREATE_PROPERTY");
  };

  return (
    <Switch>
      <Route exact path={`${match.path}`}>
        <LayoutWrapper layoutClass="action">
          <EditPropertyForm userType="citizen" />
        </LayoutWrapper>
      </Route>
      <Route exact path={`${match.path}/save-property`}>
        <PTAcknowledgement data={params} onSuccess={onSuccess} userType="citizen" />
      </Route>
    </Switch>
  );
};

export default EditProperty;

