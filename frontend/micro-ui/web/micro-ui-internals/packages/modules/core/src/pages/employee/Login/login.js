import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const history = useHistory();

  // const [ready, setReady] = useState(false);
  // const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Helper function to set employee details in localStorage
  const setEmployeeDetail = (userObject, userType) => {
    const locale = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || "en_IN";

    const prefix = userType === "CITIZEN" ? "Citizen" : "Employee";

    localStorage.setItem(`${prefix}.tenant-id`, userObject?.tenantId);
    localStorage.setItem("tenant-id", userObject?.tenantId);

    localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));

    localStorage.setItem("locale", locale);
    localStorage.setItem("Employee.locale", locale);
    localStorage.setItem("user-info", JSON.stringify(userObject));
    localStorage.setItem(`${prefix}.user-info`, JSON.stringify(userObject));
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const kc = window.keycloak;

        // Redirect if keycloak missing
        if (!kc) {
          const isEmployee = window.location.pathname.includes("employee");

          const redirectPath = isEmployee ? "/digit-ui/employee/user/login" : "/digit-ui/citizen";

          const from = encodeURIComponent(window.location.pathname + window.location.search);

          window.location.href = `${redirectPath}?from=${from}`;
          return;
        }

        // Login if not authenticated
        if (!kc.authenticated) {
          kc.login({
            redirectUri: window.location.origin + "/digit-ui/employee",
          });
          return;
        }
        
        const tenantId = kc?.idTokenParsed?.tenantId;

        // First API
        const userDetailsResponse = await await Digit.UserService.fetchUserDetails(kc);

        if (!isMounted) return;

        const userInfoFromFirstCall = userDetailsResponse?.user || userDetailsResponse?.UserRequest || userDetailsResponse || {};

        // Second API
        const response = await axios.post(
          "/user/_search",
          {
            tenantId,
            uuid: [userInfoFromFirstCall.uuid || kc.tokenParsed?.sub],
            pageSize: "100",
            RequestInfo: {
              apiId: "Rainmaker",
              authToken: kc.token,
              userInfo: userInfoFromFirstCall,
              msgId: `${Date.now()}|en_IN`,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${kc.token}`,
            },
          }
        );

        if (!isMounted) return;

        const finalUser = response?.data?.user?.[0] || userInfoFromFirstCall;

        setUser({
          info: finalUser,
        });
      } catch (err) {
        if (!isMounted) return;

        console.error("User load failed:", err);
        setError("Failed to load user details");
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.info) return;

    try {
      Digit.SessionStorage.set("User", user);
      Digit.UserService.setUser(user);

      setEmployeeDetail(user?.info, user?.info?.type);

      history.replace("/digit-ui/employee");
    } catch (err) {
      console.error("Session setup failed:", err);
      setError("Failed to setup session");
    }
  }, [user, history]);

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <p>Loading user details...</p>
    </div>
  );
};

export default Login;
