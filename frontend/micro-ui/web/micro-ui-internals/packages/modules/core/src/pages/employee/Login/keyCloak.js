import Keycloak from "keycloak-js";

let _kc;

export const initKeycloak = async () => {
  if (_kc) return _kc;

  _kc = new Keycloak({
    url: "https://dev-djb.nitcon.in/keycloak",
    realm: "DL",
    clientId: "upyog",
    // redirectUri: window.location.origin,
  });

  try {
    await _kc.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      redirectUri: window.location.origin + "/digit-ui/citizen/home",
    });
  } catch (err) {
    console.error("Keycloak init failed", err);
  }

  return _kc;
};

export const getKeycloak = () => _kc;
