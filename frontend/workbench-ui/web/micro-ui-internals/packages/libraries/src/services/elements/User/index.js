import Urls from "../../atoms/urls";
import { PublicRequest, Request, ServiceRequest } from "../../atoms/Utils/Request";
import { Storage } from "../../atoms/Utils/Storage";

export const UserService = {
  authenticate: (details) => {
    const data = new URLSearchParams();
    Object.entries(details).forEach(([key, value]) => data.append(key, value));
    data.append("scope", "read");
    data.append("grant_type", "password");
    return ServiceRequest({
      serviceName: "authenticate",
      url: Urls.Authenticate,
      data,
      headers: {
        authorization: `Basic ${window?.globalConfigs?.getConfig("JWT_TOKEN") || "ZWdvdi11c2VyLWNsaWVudDo="}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },
  logoutUser: async (userType) => {
    const kc = window.keycloak;
    const ctx = window.contextPath || "digit-ui";
    const isEmployee = userType ? userType !== "citizen" : !window.location.pathname.includes("/citizen");
    const loginRedirectUri = isEmployee
      ? `/${ctx}/employee/user/login`
      : `/${ctx}/citizen/login`;

    // 1️⃣ Call backend logout (fire-and-forget, don't block)
    if (kc?.authenticated) {
      try {
        const user = UserService.getUser();
        await ServiceRequest({
          serviceName: "logoutUser",
          url: Urls.UserLogout,
          data: { access_token: kc.token },
          auth: true,
          params: {
            tenantId: isEmployee
              ? Digit.ULBService.getCurrentTenantId()
              : Digit.ULBService.getStateId(),
          },
        });
      } catch (e) {
        console.warn("[logoutUser] Backend logout failed (continuing):", e);
      }
    }

    // 2️⃣ Clear all client-side storage BEFORE navigating
    try {
      Digit.SessionStorage.del("User");
      Digit.SessionStorage.del("userType");
      Digit.SessionStorage.del("user_type");
    } catch (_) {}
    sessionStorage.clear();
    localStorage.clear();

    // 3️⃣ Navigate away
    if (kc?.authenticated) {
      // Keycloak handles the redirect – do NOT also call window.location.replace()
      kc.logout({
        redirectUri: window.location.origin + loginRedirectUri,
      });
    } else {
      // No active KC session – navigate manually
      window.location.replace(loginRedirectUri);
    }

    return true;
  },
  getType: () => {
    return Storage.get("userType") || localStorage.getItem("Digit.userType") || "citizen";
  },
  setType: (userType) => {
    Storage.set("userType", userType);
    Storage.set("user_type", userType);
    localStorage.setItem("Digit.userType", userType);
  },
  getUser: () => {
    // If Keycloak is fully initialised (not just undefined) and says NOT authenticated,
    // that is authoritative for employee sessions. Clear any stale localStorage user
    // so the app doesn't show a phantom logged-in state.
    const kc = window.keycloak;
    const isEmployeePath = window.location.pathname.includes("/employee");
    if (kc !== undefined && kc !== null && kc.authenticated === false && isEmployeePath) {
      return null;
    }

    let user = Digit.SessionStorage.get("User");

    // 🔄 Fallback to localStorage if sessionStorage is lost or corrupted
    if (!user || !user.info) {
      const localUser = JSON.parse(localStorage.getItem("Digit.User") || "null");
      const infoOnly =
        JSON.parse(localStorage.getItem("user-info") || "null") ||
        JSON.parse(localStorage.getItem("Citizen.user-info") || "null") ||
        JSON.parse(localStorage.getItem("Employee.user-info") || "null");

      if (localUser && localUser.info) {
        user = localUser;
      } else if (infoOnly) {
        user = { info: infoOnly };
      }

      if (user && user.info) {
        Digit.SessionStorage.set("User", user);
      }
    }
    return user;
  },
  logout: async () => {
    const userType = UserService.getType(); // capture BEFORE storage is cleared
    try {
      // logoutUser() clears storage and redirects (via kc.logout or window.location.replace).
      // Do NOT call window.location.replace() again here — that causes a race condition
      // when Keycloak is doing its own redirect.
      await UserService.logoutUser(userType);
    } catch (e) {
      console.error("[logout] Unexpected error:", e);
      // Last-resort fallback navigation (logoutUser should have already navigated)
      const ctx = window.contextPath || "digit-ui";
      const isCitizen = userType === "citizen";
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.replace(
        isCitizen ? `/${ctx}/citizen/login` : `/${ctx}/employee/user/login`
      );
    }
  },
  sendOtp: (details, stateCode) =>
    PublicRequest({
      serviceName: "sendOtp",
      url: Urls.OTP_Send,
      data: details,
      auth: false,
      params: { tenantId: stateCode },
    }),
  setUser: (data) => {
    Digit.SessionStorage.set("User", data);
    localStorage.setItem("Digit.User", JSON.stringify(data));
    if (data?.info) {
      const prefix = data.info.type === "CITIZEN" ? "Citizen" : "Employee";
      localStorage.setItem("user-info", JSON.stringify(data.info));
      localStorage.setItem(`${prefix}.user-info`, JSON.stringify(data.info));
    }
  },
  setExtraRoleDetails: (data) => {
    const userDetails = UserService.getUser();
    const updatedUser = { ...userDetails, extraRoleInfo: data };
    UserService.setUser(updatedUser);
  },
  getExtraRoleDetails: () => {
    return Digit.SessionStorage.get("User")?.extraRoleInfo;
  },
  registerUser: (details, stateCode) =>
    ServiceRequest({
      serviceName: "registerUser",
      url: Urls.RegisterUser,
      data: {
        User: details,
      },
      params: { tenantId: stateCode },
    }),
  updateUser: async (details, stateCode) =>
    ServiceRequest({
      serviceName: "updateUser",
      url: Urls.UserProfileUpdate,
      auth: true,
      data: {
        user: details,
      },
      params: { tenantId: stateCode },
    }),

  hasAccess: (accessTo) => {
    const user = Digit.UserService.getUser();
    if (!user || !user.info) return false;
    const { roles } = user.info;
    return roles && Array.isArray(roles) && roles.filter((role) => accessTo.includes(role.code)).length;
  },

  changePassword: (details, stateCode) =>
    ServiceRequest({
      serviceName: "changePassword",
      url: Digit.SessionStorage.get("User")?.info ? Urls.ChangePassword1 : Urls.ChangePassword,
      data: {
        ...details,
      },
      auth: true,
      params: { tenantId: stateCode },
    }),

  employeeSearch: (tenantId, filters) => {
    return Request({
      url: Urls.EmployeeSearch,
      params: { tenantId, ...filters },
      auth: true,
    });
  },
  //GET captcha for user
  userCaptchaSearch: async (tenantId, data) => {
    return Request({
      url: Urls.UserCaptcha,
      method: "GET",
    });
  },
  userSearch: async (tenantId, data, filters) => {
    return Request({
      url: Urls.UserSearch,
      params: { ...filters },
      method: "POST",
      auth: true,
      userService: true,
      data: data.pageSize ? { tenantId, ...data } : { tenantId, ...data, pageSize: "100" },
    });
  },
  // user search for user profile
  userSearchNewV2: async (tenantId, data, filters) => {
    return Request({
      url: Urls.UserSearchNewV2,
      params: { ...filters },
      method: "POST",
      auth: true,
      userService: true,
      data: data.pageSize ? { tenantId, ...data } : { tenantId, ...data, pageSize: "100" },
    });
  },
  fetchUserDetails: async (kc) => {
    if (!kc) {
      throw new Error("Keycloak instance (kc) is required");
    }

    if (!kc?.token) {
      throw new Error("Keycloak token not available");
    }

    const requestData = {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uuid: kc?.uuid,
      userName: kc?.userName,
      userInfo: {
        email: kc?.email || "",
        name: kc?.userName || "",
        tenantId: Digit.ULBService.getCurrentTenantId() || "",
      },
    };

    return Request({
      url: Urls.UserDetails,
      method: "POST",
      auth: true,
      userService: true,
      params: {
        access_token: kc.token,
      },
      data: requestData,
    });
  },
};
