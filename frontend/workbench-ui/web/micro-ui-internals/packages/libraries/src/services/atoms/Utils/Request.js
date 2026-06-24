import Axios from "axios";

/**
 * Custom Request to make all api calls
 *
 * @author jagankumar-egov
 *
 *
 */

Axios.interceptors.request.use(
  async (config) => {
    const kc = window.keycloak;
    const url = config.url || "";

    // Public endpoints that are called before login and must NEVER trigger a logout.
    // The MDMS init and localization calls are needed to bootstrap the app.
    const PUBLIC_ENDPOINTS = [
      "/egov-mdms-service",
      "/mdms-v2",
      "/localization/messages",
      "/user-otp",
      "/user/oauth/token",
      "/user/citizen/_create",
      "/user/password/nologin",
    ];
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some((p) => url.includes(p));
    const isCitizenPath = window.location.pathname.includes(
      `/${window.contextPath || "digit-ui"}/citizen`
    );

    // Only auto-logout if:
    //  • Keycloak is fully initialised (not null/undefined)
    //  • kc.authenticated is explicitly false (not just falsy)
    //  • We are NOT on a citizen path
    //  • This is NOT a public endpoint used for app bootstrap
    if (
      kc != null &&
      kc.authenticated === false &&
      !isCitizenPath &&
      !isPublicEndpoint
    ) {
      // Only redirect – do not call kc.logout() here to avoid race conditions
      // during page load when KC has just been initialised without a session.
      // The login.js component handles the auth redirect.
      return Promise.reject(new Error("User not authenticated"));
    }

    if (kc && kc.authenticated && kc.token) {
      try {
        await kc.updateToken(5);
        config.headers.Authorization = `Bearer ${kc.token}`;
      } catch (error) {
        console.error(error);
        kc.logout({
          idTokenHint: kc.idToken,
        });
        return Promise.reject(error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);


Axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const isEmployee = window.location.pathname.split("/").includes("employee");
    const kc = window.keycloak;
    if (err?.response?.data?.Errors) {
      for (const error of err.response.data.Errors) {
        // console.error("🚀🚀🚀🚀 API ERROR:", error);

        if (error?.message?.includes("InvalidAccessTokenException")) {
          localStorage.clear();
          sessionStorage.clear();
          if (kc) {
            kc.logout({
              // redirectUri: window.location.origin + "/digit-ui/employee/user/language-selection",
              idTokenHint: kc.idToken,
            });
          } else {
            window.location.href =
              (isEmployee ? `/${window.contextPath || "digit-ui"}/employee/user/login` : `/${window.contextPath || "digit-ui"}/citizen/login`) +
              `?from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          }
        } else if (
          error?.message?.toLowerCase()?.includes("internal server error") ||
          error?.message?.toLowerCase()?.includes("some error occured")
        ) {
          window.location.href =
            (isEmployee ? `/${window.contextPath || "digit-ui"}/employee/user/error` : `/${window.contextPath || "digit-ui"}/citizen/error`) +
            `?type=maintenance&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        } else if (error.message?.includes("ZuulRuntimeException")) {
          window.location.href =
            (isEmployee ? `/${window.contextPath || "digit-ui"}/employee/user/error` : `/${window.contextPath || "digit-ui"}/citizen/error`) +
            `?type=notfound&from=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      }
    }
    throw err;
  }
);

const requestInfo = (token) => ({
  authToken: token || null,
});

const authHeaders = (token) => ({
  "auth-token": token || null,
});

const userServiceData = () => ({ userInfo: Digit.UserService.getUser()?.info });

window.Digit = window.Digit || {};
window.Digit = { ...window.Digit, RequestCache: window.Digit.RequestCache || {} };
export const Request = async ({
  method = "POST",
  url,
  data = {},
  headers = {},
  useCache = false,
  params = {},
  auth,
  urlParams = {},
  userService,
  locale = true,
  authHeader = false,
  setTimeParam = true,
  userDownload = false,
  noRequestInfo = false,
  multipartFormData = false,
  multipartData = {},
  reqTimestamp = false,
  plainAccessRequest = null,
}) => {
  // Prefer Keycloak token (most up-to-date), then fall back to:
  //  1. localStorage token (set by login.js after KC auth)
  //  2. env REACT_APP_EMPLOYEE_TOKEN (for dev/initial bootstrap before login)
  //  3. env REACT_APP_CITIZEN_TOKEN
  const token =
    window.keycloak?.token ||
    window.localStorage.getItem("token") ||
    process.env.REACT_APP_EMPLOYEE_TOKEN ||
    process.env.REACT_APP_CITIZEN_TOKEN ||
    null;
  if (method.toUpperCase() === "POST") {
    const ts = new Date().getTime();
    data.RequestInfo = {
      apiId: "Rainmaker",
    };
    if (auth || token) {
      data.RequestInfo = { ...data.RequestInfo, ...requestInfo(token) };
    }
    if (userService) {
      data.RequestInfo = { ...data.RequestInfo, ...userServiceData() };
    }
    if (locale) {
      data.RequestInfo = { ...data.RequestInfo, msgId: `${ts}|${Digit.StoreData.getCurrentLanguage()}` };
    }
    if (noRequestInfo) {
      delete data.RequestInfo;
    }
    if (reqTimestamp) {
      data.RequestInfo = { ...data.RequestInfo, ts: Number(ts) };
    }

    if (auth && token) {
      headers = {
        ...headers,
        Authorization: `Bearer ${token}`,
      };
    }

    /* 
    Feature :: Privacy
    
    Desc :: To send additional field in HTTP Requests inside RequestInfo Object as plainAccessRequest
    */
    const privacy = Digit.Utils.getPrivacyObject();
    if (privacy && !url.includes("/edcr/rest/dcr/") && !noRequestInfo) {
      data.RequestInfo = { ...data.RequestInfo, plainAccessRequest: { ...privacy } };
    }

    if (plainAccessRequest) {
      data.RequestInfo = { ...data.RequestInfo, plainAccessRequest };
    }
  }

  const headers1 = {
    "Content-Type": "application/json",
    Accept: window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE") ? "application/pdf,application/json" : "application/pdf",
  };

  if (authHeader && token) headers = { ...headers, ...authHeaders(token) };

  if (userDownload) headers = { ...headers, ...headers1 };

  let key = "";
  if (useCache) {
    key = `${method.toUpperCase()}.${url}.${btoa(escape(JSON.stringify(params, null, 0)))}.${btoa(escape(JSON.stringify(data, null, 0)))}`;
    const value = window.Digit.RequestCache[key];
    if (value) {
      return value;
    }
  } else if (setTimeParam) {
    params._ = Date.now();
  }

  let _url = url
    .split("/")
    .map((path) => {
      let key = path.split(":")?.[1];
      return urlParams[key] ? urlParams[key] : path;
    })
    .join("/");

  if (multipartFormData) {
    const multipartFormDataRes = await Axios({
      method,
      url: _url,
      data: multipartData.data,
      params,
      headers: { "Content-Type": "multipart/form-data", "auth-token": token || null },
    });
    return multipartFormDataRes;
  }
  /* 
  Feature :: Single Instance
 
  Desc :: Fix for central instance to send tenantID in all query params
  */
  const tenantInfo =
    Digit.SessionStorage.get("userType") === "citizen"
      ? Digit.ULBService.getStateId()
      : Digit.ULBService.getCurrentTenantId() || Digit.ULBService.getStateId();
  if (!params["tenantId"] && window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
    params["tenantId"] = tenantInfo;
  }

  let res;

  try {
    // ✅ TRY BLOCK:
    // Attempt to make the API request.
    // If the API responds with 2xx → execution continues normally.
    // If API returns 4xx/5xx → Axios throws error → control goes to catch block.
    res = userDownload
      ? await Axios({ method, url: _url, data, params, headers, responseType: "arraybuffer" })
      : await Axios({ method, url: _url, data, params, headers });
  } catch (error) {
    // ❌ CATCH BLOCK:
    // Handles all failed API responses (400, 401, 500, network errors, etc.)
    // Prevents app crash and ensures function ALWAYS returns something usable.

    console.error("API Error:", error?.response);

    //  return meaningful data instead of breaking flow
    return {
      error: true, // ❗ tells UI this failed
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    };
  }

  if (userDownload) return res;

  const returnData = res?.data || res?.response?.data || {};
  if (useCache && res?.data && Object.keys(returnData).length !== 0) {
    window.Digit.RequestCache[key] = returnData;
  }
  return returnData;
};

/**
 *
 * @param {*} serviceName
 *
 * preHook:
 * ({params, data}) => ({params, data})
 *
 * postHook:
 * ({resData}) => ({resData})
 *
 *
 */

export const PublicRequest = async ({ method = "POST", url, data = {}, params = {}, headers = {}, locale = true, plainAccessRequest = null }) => {
  if (method.toUpperCase() === "POST") {
    const ts = new Date().getTime();
    data.RequestInfo = {
      apiId: "Rainmaker",
    };

    if (locale) {
      data.RequestInfo = { ...data.RequestInfo, msgId: `${ts}|${Digit.StoreData.getCurrentLanguage()}` };
    }

    if (plainAccessRequest) {
      data.RequestInfo = { ...data.RequestInfo, plainAccessRequest };
    }
  }
  try {
    const res = await Axios({
      method,
      url,
      data,
      params,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    return res?.data || {};
  } catch (error) {
    console.error("Public API Error:", error?.response);

    return {
      error: true,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    };
  }
};

export const ServiceRequest = async ({
  serviceName,
  method = "POST",
  url,
  data = {},
  headers = {},
  useCache = false,
  params = {},
  auth,
  userService,
  ...extra
}) => {
  const preHookName = `${serviceName}Pre`;
  const postHookName = `${serviceName}Post`;

  let reqParams = params;
  let reqData = data;
  if (window[preHookName] && typeof window[preHookName] === "function") {
    let preHookRes = await window[preHookName]({ params, data });
    reqParams = preHookRes.params;
    reqData = preHookRes.data;
  }
  const resData = await Request({
    method,
    url,
    data: reqData,
    headers,
    useCache,
    params: reqParams,
    auth,
    userService,
    ...extra,
  });

  if (window[postHookName] && typeof window[postHookName] === "function") {
    return await window[postHookName](resData);
  }
  return resData;
};
