import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { fetchUserDetails } from "../../../../../../libraries/src/services/elements/UserDetails";

// Helper to set user details in localStorage
const setUserDetail = (userObject, token, userType) => {
  const locale = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || "en_IN";

  const prefix = userType === "CITIZEN" ? "Citizen" : "Employee";

  localStorage.setItem(`${prefix}.tenant-id`, userObject?.tenantId);
  localStorage.setItem("tenant-id", userObject?.tenantId);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));
  localStorage.setItem("locale", locale);
  localStorage.setItem(`${prefix}.locale`, locale);
  localStorage.setItem("token", token);
  localStorage.setItem(`${prefix}.token`, token);
  localStorage.setItem("user-info", JSON.stringify(userObject));
  localStorage.setItem(`${prefix}.user-info`, JSON.stringify(userObject));
};

const Login = () => {
  const history = useHistory();

  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const kc = window.keycloak;

    if (!kc) {
      const isEmployee = window.location.pathname.includes("employee");

      const redirectPath = isEmployee ? "/digit-ui/employee/user/language-selection" : "/digit-ui/citizen";

      const from = encodeURIComponent(window.location.pathname + window.location.search);

      window.location.href = `${redirectPath}?from=${from}`;
    }
  }, []);

  // Step 2: Fetch user details
  useEffect(() => {
    const loadUser = async () => {
      try {
        const kc = window.keycloak;

        if (!kc?.authenticated) {
          kc.login({
            redirectUri: window.location.origin + "/digit-ui/citizen",
          });
          return;
        }

        // Single API call: Fetch user details using fetchUserDetails
        const userDetailsResponse = await fetchUserDetails(kc);

        // Extract user info from API response
        const userInfo = userDetailsResponse?.user || userDetailsResponse?.UserRequest || userDetailsResponse || {};

        setUser({
          access_token: kc.token,
          info: userInfo,
        });
      } catch (err) {
        console.error("User details fetch failed:", err);
        setError("Failed to load user details");
      }
    };

    loadUser();
  }, []);

  // Step 3: Setup Digit session & redirect based on user type
  useEffect(() => {
    if (!user?.info) return;

    try {
      Digit.SessionStorage.set("User", user);
      // Digit.UserService.setUser(user); // To be checked by Arsh commented by Avinash

      const tenantId = user.info.tenantId || Digit.ULBService.getCurrentTenantId();

      if (user.info.roles?.length) {
        user.info.roles = user.info.roles.filter((r) => r.tenantId === tenantId);
      }

      setUserDetail(user.info, user.access_token, user.info.type);

      // Redirect based on user type from API response
      const userType = (user.info.type || "").toUpperCase();
      let redirectPath = userType === "CITIZEN" ? "/digit-ui/citizen" : "/digit-ui/employee";

      // Override with "from" query param if present
      if (window.location.href.includes("from=")) {
        redirectPath = decodeURIComponent(window.location.href.split("from=")[1]) || redirectPath;
      }

      // National Admin override
      if (user.info.roles?.length && user.info.roles.every((r) => r.code === "NATADMIN")) {
        redirectPath = "/digit-ui/employee/dss/landing/NURT_DASHBOARD";
      }

      // State Admin override
      if (user.info.roles?.length && user.info.roles.every((r) => r.code === "STADMIN")) {
        redirectPath = "/digit-ui/employee/dss/landing/home";
      }

      history.replace(redirectPath);
    } catch (err) {
      console.error("Citizen session setup failed:", err);
      setError("Failed to setup user session");
    }
  }, [user, history]);

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Loading user details...</p>
      </div>
    );
  }

  return null;
};

export default Login;
