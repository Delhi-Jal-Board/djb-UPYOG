import Keycloak from "keycloak-js";

let _kc = null;

/**
 * Paths where Keycloak should be completely skipped.
 * Citizen flows use OTP-based login, not Keycloak.
 */
const SKIP_KEYCLOAK_PATHS = ["/workbench-ui/citizen", "/workbench-ui/home"];

const shouldSkipKeycloak = (path) => {
  return SKIP_KEYCLOAK_PATHS.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));
};

/**
 * Check if the current URL contains Keycloak auth response params.
 * Keycloak sends back `code` + `session_state` (PKCE flow) OR `error`.
 */
const hasKeycloakParams = () => {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || params.has("session_state") || params.has("error");
};

export const initKeycloak = async () => {
  // Return cached instance
  if (_kc) return _kc;

  const path = window.location.pathname;
  const ctx = window.contextPath || "workbench-ui";

  // Skip Keycloak entirely for citizen paths – they use OTP login
  if (shouldSkipKeycloak(path)) {
    return null;
  }

  // Save the intended destination so we can redirect back after login.
  // Only do this when on a protected route (not the login callback itself).
  const isLoginCallback = path.includes("/employee/user/login") && hasKeycloakParams();
  const isProtectedRoute =
    path.includes("/workbench-ui/employee") &&
    !path.includes("/workbench-ui/employee/user/login") &&
    !path.includes("/workbench-ui/employee/user/language-selection");

  if (isProtectedRoute) {
    sessionStorage.setItem("post_keycloak_redirect", window.location.pathname + window.location.search);
  }

  _kc = new Keycloak({
    url: "https://dev-djberp.nitcon.in/keycloak",
    realm: "DL",
    clientId: "workbench",
  });

  try {
    /**
     * Strategy:
     *
     * • On the login callback (Keycloak redirected us back with ?code=…):
     *     onLoad = "check-sso"  → KC processes the code and sets authenticated = true
     *
     * • On all other employee pages (normal navigation):
     *     No onLoad at all (undefined) → KC initialises in "not authenticated" state
     *     without doing ANY redirect.  The login.js component then explicitly calls
     *     kc.login() to start the auth flow.
     *
     * This prevents the blank-page caused by KC doing its own redirect loop on cold loads.
     */
    const initOptions = {
      pkceMethod: "S256",
      checkLoginIframe: false,
      // redirectUri: window.location.origin + `/${redirectCtx}/employee/user/login`,
      redirectUri: window.location.origin + `/${ctx}/employee/user/login`,

    };

    if (isLoginCallback) {
      // We have auth params — let KC process them
      initOptions.onLoad = "check-sso";
    }
    // Otherwise: no onLoad — KC starts without touching the session/redirecting

    await _kc.init(initOptions);
  } catch (err) {
    console.error("[Keycloak] init failed:", err);
    _kc = null;
    return null;
  }

  return _kc;
};

export const getKeycloak = () => _kc;

/**
 * Force a fresh Keycloak login for employees.
 * Called from the employee login page when kc.authenticated is false.
 */
export const triggerKeycloakLogin = () => {
  const kc = _kc;
  if (!kc) {
    // KC not initialised — do a manual redirect to KC login
    const ctx = window.contextPath || "workbench-ui";
    const kcBase = "https://dev-djberp.nitcon.in/keycloak";
    const realm = "DL";
    const clientId = "workbench";
    const redirectUri = encodeURIComponent(window.location.origin + `/${ctx}/employee/user/login`);
    window.location.href = `${kcBase}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
    return;
  }
  const ctx = window.contextPath || "workbench-ui";
  kc.login({
    redirectUri: window.location.origin + `/${ctx}/employee/user/login`,
  });
};
