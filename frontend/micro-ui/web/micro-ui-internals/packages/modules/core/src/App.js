import React, { useEffect } from "react";
import { Redirect, Route, Switch, useHistory, useLocation } from "react-router-dom";
import EmployeeApp from "./pages/employee";
import CitizenApp from "./pages/citizen";
import AccessDenied from "./components/AccessDenied";
import LandingPage from "./pages/LandingPage/LandingPage";
import About from "./pages/LandingPage/About";
import ContactUs from "./pages/LandingPage/ContactUs";
import PrivacyPolicy from "./pages/LandingPage/PrivacyPolicy";

export const DigitApp = ({ stateCode, modules, appTenants, logoUrl, initData }) => {
  const history = useHistory();
  const { pathname } = useLocation();
  const innerWidth = window.innerWidth;
  const cityDetails = Digit.ULBService.getCurrentUlb();
  const userDetails = Digit.UserService.getUser();
  const { data: storeData } = Digit.Hooks.useStore.getInitData();
  const { stateInfo } = storeData || {};
  const DSO = Digit.UserService.hasAccess(["FSM_DSO"]);

  // ✅ Derive CITIZEN flag from actual user type in session
  const userType = (userDetails?.info?.type || "").toUpperCase();
  let CITIZEN = userType === "CITIZEN";

  // Fallback: if no user type yet, infer from URL
  if (!userType) {
    CITIZEN = !window.location.pathname.split("/").includes("employee");
  }

  // Explicit employee URL always overrides
  if (window.location.pathname.split("/").includes("employee")) {
    CITIZEN = false;
  }

  useEffect(() => {
    if (!pathname?.includes("application-details")) {
      if (!pathname?.includes("inbox")) {
        Digit.SessionStorage.del("fsm/inbox/searchParams");
      }
      if (pathname?.includes("search")) {
        Digit.SessionStorage.del("fsm/search/searchParams");
      }
    }
    if (!pathname?.includes("dss")) {
      Digit.SessionStorage.del("DSS_FILTERS");
    }
    if (pathname?.toString() === "/digit-ui/employee") {
      Digit.SessionStorage.del("SEARCH_APPLICATION_DETAIL");
      Digit.SessionStorage.del("WS_EDIT_APPLICATION_DETAILS");
      Digit.SessionStorage.del("WS_DISCONNECTION");
    }
  }, [pathname]);

  useEffect(() => {
    const unlisten = history.listen(() => {
      window?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
    // ✅ Cleanup listener on unmount to prevent memory leaks
    return () => unlisten();
  }, [history]);

  const handleUserDropdownSelection = (option) => {
    option.func();
  };

  const mobileView = innerWidth <= 640;
  const sourceUrl = `${window.location.origin}/employee`;

  const commonProps = {
    stateInfo,
    userDetails,
    CITIZEN,
    cityDetails,
    mobileView,
    handleUserDropdownSelection,
    logoUrl,
    DSO,
    stateCode,
    modules,
    appTenants,
    sourceUrl,
    pathname,
    initData,
  };

  // ✅ Determine default redirect path based on logged-in user type
  const getDefaultRedirect = () => {
    if (!userDetails?.info) {
      // No user in session yet — default to the new landing page
      return "/digit-ui/home";
    }
    return userType === "CITIZEN" ? "/digit-ui/citizen" : "/digit-ui/employee";
  };

  return (
    <Switch>
      <Route path="/digit-ui/employee">
        <EmployeeApp {...commonProps} />
      </Route>
      {/* ✅ Sub-routes of /digit-ui/home must come BEFORE the parent route.
          Switch matches top-to-bottom; without this order the parent would swallow them. */}
      <Route path="/digit-ui/home/about">
        <About {...commonProps} />
      </Route>
      <Route path="/digit-ui/home/contact">
        <ContactUs {...commonProps} />
      </Route>
      <Route path="/digit-ui/home/privacy-policy">
        <PrivacyPolicy {...commonProps} />
      </Route>
      <Route exact path="/digit-ui/home">
        <LandingPage {...commonProps} />
      </Route>
      {/* ⚠️ CRITICAL: Keycloak SSO only has /digit-ui/citizen/home whitelisted. Keycloak redirects here during check-sso initialization, so we must redirect it back to /digit-ui/home or their previous page if they are authenticated. */}
      <Route path="/digit-ui/citizen/home">
        {(() => {
          const user = Digit.UserService.getUser();
          if (user?.info) {
            const redirectPath = sessionStorage.getItem("post_keycloak_redirect");
            sessionStorage.removeItem("post_keycloak_redirect");
            if (redirectPath) {
              return <Redirect to={redirectPath} />;
            }
            return <Redirect to={user.info.type === "CITIZEN" ? "/digit-ui/citizen" : "/digit-ui/employee"} />;
          }
          return <Redirect to="/digit-ui/home" />;
        })()}
      </Route>
      <Route path="/digit-ui/citizen/about">
        <About {...commonProps} />
      </Route>
      <Route path="/digit-ui/citizen/contact">
        <ContactUs {...commonProps} />
      </Route>
      <Route path="/digit-ui/citizen/privacy-policy">
        <PrivacyPolicy {...commonProps} />
      </Route>
      <Route path="/digit-ui/citizen">
        <CitizenApp {...commonProps} />
      </Route>
      <Route path="/digit-ui/access-denied">
        <AccessDenied props={(props) => props} />
      </Route>
      {/* ✅ Smart default redirect based on user type */}
      <Route>
        <Redirect to={getDefaultRedirect()} />
      </Route>
    </Switch>
  );
};

