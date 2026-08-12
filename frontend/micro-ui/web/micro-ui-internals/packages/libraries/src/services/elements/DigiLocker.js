import Urls from "../atoms/urls";
import { Request } from "../atoms/Utils/Request";

export const DigiLockerService = {
  authorization: ({ module, filters, tenantId } = {}) =>
    Request({
      url: Urls.digiLocker.authorization,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
      params: { module: module || "WS", tenantId: tenantId, ...filters },
    }),
  register: ({ module, filters, tenantId } = {}) =>
    Request({
      url: Urls.digiLocker.register,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
      params: { module: module || "REGISTER", tenantId: tenantId, ...filters },
    }),
  token: (data) =>
    Request({
      url: Urls.digiLocker.token,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
      data: data,
    }),
  issueDoc: (data) =>
    Request({
      url: Urls.digiLocker.issueDoc,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
      data: data,
    }),
  uri: (data) =>
    Request({
      url: Urls.digiLocker.uri,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
      data: data,
    }),
};
