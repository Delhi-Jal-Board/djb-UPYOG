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

  await _kc.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });

  return _kc;
};

export const getKeycloak = () => _kc;
