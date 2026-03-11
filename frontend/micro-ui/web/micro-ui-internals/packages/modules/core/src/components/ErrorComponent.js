import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const ErrorConfig = {
  error: {
    imgUrl: `https://s3.ap-south-1.amazonaws.com/egov-qa-assets/error-image.png`,
    infoMessage: "CORE_SOMETHING_WENT_WRONG",
    buttonInfo: "ACTION_TEST_HOME",
  },
  maintenance: {
    imgUrl: `https://s3.ap-south-1.amazonaws.com/egov-qa-assets/maintainence-image.png`,
    infoMessage: "CORE_UNDER_MAINTENANCE",
    buttonInfo: "ACTION_TEST_HOME",
  },
  notfound: {
    imgUrl: `https://s3.ap-south-1.amazonaws.com/egov-qa-assets/PageNotFound.png`,
    infoMessage: "CORE_NOT_FOUND",
    buttonInfo: "ACTION_TEST_HOME",
  },
};

const ErrorComponent = (props) => {
  const { type = "error" } = Digit.Hooks.useQueryParams();
  const config = ErrorConfig[type] || ErrorConfig.error;
  const { t } = useTranslation();

  useEffect(() => {
    const kc = window.keycloak;
    const pathname = window.location.pathname;

    const isEmployee = pathname.includes("/employee");
    const isLoginPage = pathname.includes("/employee/user/login") || pathname.includes("/citizen");

    // Wait until keycloak is ready
    if (!kc || !kc.didInitialize) return;

    // Not authenticated → trigger login
    if (!kc.authenticated && !isLoginPage) {
      const redirectBase = isEmployee ? "/digit-ui/employee/user/select-language" : "/digit-ui/citizen";

      kc.login({
        redirectUri: window.location.origin + redirectBase + `?from=${encodeURIComponent(pathname + window.location.search)}`,
      });
      return;
    }

    // Try refreshing expired token
    if (kc.authenticated && kc.token && kc.isTokenExpired()) {
      kc.updateToken(30).catch(() => kc.logout());
    }

    // If tokens missing → logout
    if (kc.authenticated && (!kc.token || !kc.refreshToken)) {
      kc.logout();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="error-boundary">
      <div className="error-container">
        <img src={config.imgUrl} alt="error" />
        <h1>{t(config.infoMessage)}</h1>
        <button
          onClick={() => {
            props.goToHome();
          }}
        >
          {t(config.buttonInfo)}
        </button>
      </div>
    </div>
  );
};

export default ErrorComponent;
