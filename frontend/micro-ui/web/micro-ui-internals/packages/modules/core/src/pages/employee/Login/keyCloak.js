import Keycloak from "keycloak-js";

let _kc;

const PUBLIC_PATHS = [
  "/digit-ui/home",
  "/digit-ui/citizen/login",
  "/digit-ui/citizen/register",
  "/digit-ui/citizen/select-language",
  "/digit-ui/citizen/select-location",
  "/digit-ui/citizen",
];

const isPublicRoute = (path) => {
  return PUBLIC_PATHS.some((p) => {
    if (p === "/digit-ui/citizen") {
      return path === "/digit-ui/citizen" || path === "/digit-ui/citizen/";
    }
    return path === p || path.startsWith(p + "/");
  });
};

export const initKeycloak = async () => {
  if (_kc) return _kc;

  const path = window.location.pathname;
  if (
    !isPublicRoute(path) &&
    !path.includes("/digit-ui/citizen/home") &&
    !path.includes("/digit-ui/employee/user/login") &&
    (path.includes("/digit-ui/employee") || path.includes("/digit-ui/citizen"))
  ) {
    sessionStorage.setItem("post_keycloak_redirect", window.location.pathname + window.location.search);
  }

  _kc = new Keycloak({
    url: "https://dev-djb.nitcon.in/keycloak",
    realm: "DL",
    clientId: "upyog",
    // redirectUri: window.location.origin,
  });

  try {
    const initConfig = {
      pkceMethod: "S256",
      checkLoginIframe: false,
    };

    if (!isPublicRoute(path)) {
      initConfig.onLoad = "check-sso";
      initConfig.redirectUri = window.location.origin + "/digit-ui/citizen/home";
    }

    await _kc.init(initConfig);
  } catch (err) {
    console.error("Keycloak init failed", err);
  }

  return _kc;
};

export const getKeycloak = () => _kc;
