import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { triggerKeycloakLogin } from "./keyCloak";

/**
 * Employee Keycloak Callback Handler
 *
 * This component is mounted at /digit-ui/employee/user/login.
 * It is the redirectUri target that Keycloak redirects back to after login.
 *
 * Responsibilities:
 *  1. Wait for Keycloak to finish initialisation (window.keycloak).
 *  2. If not authenticated → redirect to Keycloak login page.
 *  3. If authenticated → fetch DIGIT user details using the KC token.
 *  4. Store the user in Digit.SessionStorage & localStorage (same contract
 *     as OTP-based citizen login so the rest of the app keeps working).
 *  5. Navigate to the employee dashboard (or the saved post-login path).
 */
const Login = () => {
  const history = useHistory();
  const [error, setError] = useState(null);
  const ctx = window.contextPath || "digit-ui";

  useEffect(() => {
    let isMounted = true;

    const handleLogin = async () => {
      try {
        const kc = window.keycloak;

        // Keycloak not initialised — shouldn't normally happen, but guard against it.
        if (!kc) {
          console.warn("[EmployeeLogin] Keycloak not initialised, redirecting…");
          window.location.replace(`/${ctx}/employee/user/login`);
          return;
        }

        // Not authenticated → send user to Keycloak login page
        if (!kc.authenticated) {
          triggerKeycloakLogin();
          return;
        }

        // ── Authenticated ──────────────────────────────────────────────

        const tenantId = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || "dl.djb";

        // 1. Call /user/_details with the Keycloak access token
        let userInfo;
        try {
          const detailsRes = await Digit.UserService.fetchUserDetails(kc);
          userInfo = detailsRes?.user || detailsRes?.UserRequest || detailsRes || {};
        } catch (detailsErr) {
          console.warn("[EmployeeLogin] /user/_details failed, falling back to token claims:", detailsErr);
          // Fallback: build a minimal user object from the KC token
          userInfo = {
            uuid: kc.tokenParsed?.sub,
            name: kc.tokenParsed?.name || kc.tokenParsed?.preferred_username,
            userName: kc.tokenParsed?.preferred_username,
            mobileNumber: kc.tokenParsed?.phone_number || "",
            tenantId,
            type: "EMPLOYEE",
            roles: [],
          };
        }

        if (!isMounted) return;

        // 2. Call /user/_search to get full roles, tenantId etc.
        let finalUser = userInfo;
        try {
          const searchRes = await Digit.UserService.userSearch(
            tenantId,
            {
              uuid: [userInfo.uuid || kc.tokenParsed?.sub],
              pageSize: "100",
            },
            {}
          );
          if (searchRes?.user?.[0]) {
            finalUser = searchRes.user[0];
          }
        } catch (searchErr) {
          console.warn("[EmployeeLogin] /user/_search failed, using details response:", searchErr);
        }

        if (!isMounted) return;

        // 3. Build the user object in the same shape the app expects
        const user = {
          access_token: kc.token,
          refresh_token: kc.refreshToken,
          id_token: kc.idToken,
          info: {
            ...finalUser,
            type: finalUser.type || "EMPLOYEE",
            tenantId: finalUser.tenantId || tenantId,
          },
        };

        // 4. Persist tokens & user info
        setEmployeeDetails(user, tenantId);

        // 5. Navigate to the intended destination (or employee dashboard)
        const redirectTo =
          sessionStorage.getItem("post_keycloak_redirect") || `/${ctx}/employee`;
        sessionStorage.removeItem("post_keycloak_redirect");

        history.replace(redirectTo);
      } catch (err) {
        if (!isMounted) return;
        console.error("[EmployeeLogin] Login failed:", err);
        setError("Failed to load employee details. Please try again.");
      }
    };

    handleLogin();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "red", marginBottom: 16 }}>{error}</p>
        <button
          style={{
            padding: "8px 24px",
            background: "#F47738",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => {
            setError(null);
            triggerKeycloakLogin();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid #F47738",
          borderTop: "4px solid transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#444" }}>Signing you in…</p>
    </div>
  );
};

export default Login;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Persist employee user data in all the places the Digit app reads from.
 * Mirrors what the citizen OTP login does so existing hooks keep working.
 */
function setEmployeeDetails(user, tenantId) {
  try {
    // Digit session storage (primary source)
    Digit.SessionStorage.set("User", user);
    Digit.UserService.setUser(user);
    Digit.UserService.setType("employee");

    // localStorage mirrors (for page-refresh survival)
    const locale =
      JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || "en_IN";

    localStorage.setItem("Employee.tenant-id", tenantId);
    localStorage.setItem("tenant-id", tenantId);
    localStorage.setItem("locale", locale);
    localStorage.setItem("Employee.locale", locale);
    localStorage.setItem("token", user.access_token);
    localStorage.setItem("Employee.token", user.access_token);
    localStorage.setItem("user-info", JSON.stringify(user.info));
    localStorage.setItem("Employee.user-info", JSON.stringify(user.info));
    localStorage.setItem("citizen.userRequestObject", JSON.stringify(user.info));
    localStorage.setItem("Digit.User", JSON.stringify(user));
    localStorage.setItem("Digit.userType", "employee");
  } catch (e) {
    console.error("[setEmployeeDetails] Storage write failed:", e);
  }
}
