import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
// import { useQueryClient } from "react-query";
import { Redirect, Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { VerticalTimeline } from "@djb25/digit-ui-react-components";
import { ekycConfig } from "../../config/config";

const EKYCForm = ({ path: passedPath }) => {
  // const queryClient = useQueryClient();
  const match = useRouteMatch();
  const { t } = useTranslation();
  const location = useLocation();
  const { pathname } = location;
  const history = useHistory();

  let config = [];
  const [params, setParams] = Digit.Hooks.useSessionStorage("EKYC_CREATE", {});

  useEffect(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      const { edits, ...rest } = location.state;
      setParams({ ...params, ...rest, ...edits });
    }
  }, [location.state]);

  const goNext = (skipStep, index, isAddMultiple, key) => {
    let currentPath = pathname.split("/").pop();
    let routeObj = config.find((routeObj) => (key ? routeObj.key === key : routeObj.route === currentPath));
    if (!routeObj) routeObj = config.find((routeObj) => routeObj.route === currentPath);

    let nextStep = null;
    const currentIndex = config.findIndex((c) => c.route === routeObj.route);
    if (currentIndex > -1 && currentIndex < config.length - 1) {
      nextStep = config[currentIndex + 1].route;
    }

    let redirectWithHistory = history.push;
    if (skipStep) {
      redirectWithHistory = history.replace;
    }

    const base = passedPath || match.path.split("/").slice(0, -1).join("/");
    if (nextStep === null) {
      return redirectWithHistory(`${base}/review`, { ...params, edits: params });
    }

    redirectWithHistory(`${base}/${nextStep}`, { ...params });
  };

  function handleSelect(key, data, skipStep, index, isAddMultiple = false, silent = false) {
    setParams((prev) => ({ ...prev, [key]: { ...params[key], ...data } }));
    if (!silent) {
      goNext(skipStep, index, isAddMultiple, key);
    }
  }

  // const onSuccess = () => {
  //   clearParams();
  //   queryClient.invalidateQueries("EKYC_CREATE");
  // };

  ekycConfig.forEach((obj) => {
    config = config.concat(obj.body);
  });

  config.indexRoute = "consumer-details";

  const formStepRoutes = config.map((c) => c.route);
  const isFormStep = formStepRoutes.some((route) => pathname.includes(route));

  const sectionRefs = useRef({});

  useEffect(() => {
    if (isFormStep) {
      const currentRoute = pathname.split("/").pop();
      if (sectionRefs.current[currentRoute]) {
        sectionRefs.current[currentRoute].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [pathname, isFormStep]);

  return (
    <React.Fragment>
      <div className="employee-form-section-wrapper">
        <VerticalTimeline config={config} showFinalStep={true} />
        <div className="employee-form-section">
          <Switch>
            <Route path={formStepRoutes.map((route) => `${passedPath || match.path.split("/").slice(0, -1).join("/")}/${route}`)}>
              <div className="single-page-form-container">
                {config.map((routeObj, index) => {
                  const { component } = routeObj;
                  const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;

                  return (
                    <div key={index} ref={(el) => (sectionRefs.current[routeObj.route] = el)} className="form-section-unit">
                      <Component
                        config={{ ...routeObj, isCollapsible: true, defaultOpen: true }}
                        onSelect={handleSelect}
                        t={t}
                        formData={params}
                      // formData={{ ...params, address: params.addressDetails }}
                      />
                    </div>
                  );
                })}
              </div>
            </Route>
            <Route>
              <Redirect to={`${passedPath || match.path.split("/").slice(0, -1).join("/")}/${config.indexRoute}`} />
            </Route>
          </Switch>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EKYCForm;
