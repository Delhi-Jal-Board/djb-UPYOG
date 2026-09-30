import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import { useRouteMatch, useLocation, useHistory, Switch, Route, Redirect } from "react-router-dom";
import { newConfig as newConfigWS } from "../../../config/wsDisconnectionConfig";

const getPath = (path, params) => {
  params && Object.keys(params).map(key => {
    path = path.replace(`:${key}`, params[key]);
  })
  return path;
}


const ReSubmitDisconnectionApplication = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const match = useRouteMatch();
  const stateId = Digit.ULBService.getStateId();


  let config = [];
  let { data: newConfig, isLoading: configLoading } = Digit.Hooks.ws.useWSConfigMDMS.getFormConfig(stateId, {});
  newConfig = newConfig?.WSDisconnectionConfig ? newConfig?.WSDisconnectionConfig : newConfigWS;
  newConfig.filter((e) => e.head === "RE_SUBMIT_DISCONNECTION_APPLICATION")?.forEach((obj) => {
    config = config.concat(obj.body.filter((a) => !a.hideInCitizen));
  });
  config.indexRoute = "application-form";

  const [isSearchComplete, setIsSearchComplete] = useState(false);
  const searchStarted = useRef(false);

  useEffect(() => {
    if (searchStarted.current) return;
    searchStarted.current = true;

    const refreshConnectionData = async () => {
      const storedData = Digit.SessionStorage.get("WS_DISCONNECTION") || {};
      const storedConnection = storedData?.applicationData || {};
      const connectionNumber = storedConnection?.connectionNo || storedData?.connectionNo;
      if (!connectionNumber) {
        setIsSearchComplete(true);
        return;
      }

      const serviceType = storedData?.serviceType || (storedConnection?.sewerage ? "SEWERAGE" : "WATER");
      const businessService = serviceType === "SEWERAGE" ? "SW" : "WS";
      try {
        const response = await Digit.WSService.search({
          tenantId: storedConnection?.tenantId || Digit.ULBService.getCurrentTenantId(),
          filters: { connectionNumber, searchType: "CONNECTION", isConnectionSearch: true },
          businessService,
        });
        const result = response?.data || response;
        const freshConnection = serviceType === "SEWERAGE" ? result?.SewerageConnections?.[0] : result?.WaterConnection?.[0];
        if (freshConnection) {
          Digit.SessionStorage.set("WS_DISCONNECTION", {
            ...storedData,
            serviceType,
            connectionNo: freshConnection?.connectionNo || connectionNumber,
            applicationData: { ...storedConnection, ...freshConnection },
          });
        }
      } finally {
        setIsSearchComplete(true);
      }
    };

    refreshConnectionData().catch(() => setIsSearchComplete(true));
  }, []);

  if (!isSearchComplete) return null;

  return (
    <Switch>
      {config.map((routeObj, index) => {
        const { component, texts, inputs, key, isSkipEnabled } = routeObj;
        const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;
        return (
          <Route path={`${getPath(match.path, match.params)}/${routeObj.route}`} key={index}>
            <Component config={{ texts, inputs, key, isSkipEnabled }} t={t} userType={"citizen"} />
          </Route>
        );
      })}
      <Route>
        <Redirect to={`${getPath(match.path, match.params)}/${config.indexRoute}`} />
      </Route>
    </Switch>
  );
};

export default ReSubmitDisconnectionApplication;