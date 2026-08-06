import { AppContainer, PrivateRoute, ModuleHeader, ArrowLeft } from "@djb25/digit-ui-react-components";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import Inbox from "../../pages/citizen/SearchBill/Inbox";
import { useTranslation } from "react-i18next";

const App = () => {
  const { path, url, ...match } = useRouteMatch();
  const { t } = useTranslation();
  const inboxInitialState = {
    searchParams: {},
  };
  return (
    <span className={"bill-citizen"}>
      <AppContainer>
        <ModuleHeader
          leftContent={
            <React.Fragment>
              <ArrowLeft className="icon" />
              {t("CS_COMMON_BACK")}
            </React.Fragment>
          }
          onLeftClick={() => window.history.back()}
          breadcrumbs={[]}
        />
        <Switch>
          <PrivateRoute
            path={`${path}/billSearch`}
            component={(props) => <Inbox filterComponent="CITIZEN_SEARCH_FILTER" initialStates={inboxInitialState} isInbox={true} />}
          />
        </Switch>
      </AppContainer>
    </span>
  );
};
export default App;
