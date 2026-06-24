import Urls from "../atoms/urls";
import { Request } from "../atoms/Utils/Request";

export const DSSService = {
  getDashboardConfig: (moduleCode) =>
    Request({
      url: Urls.dss.dashboardConfig + `/${moduleCode}`,
      useCache: false,
      userService: false,
      method: "GET",
      authHeader: true,
      params: { tenantId: Digit.ULBService.getCurrentTenantId() }
    }),
  getCharts: (data) =>
    Request({
      url: Urls.dss.getCharts,
      useCache: false,
      userService: false,
      method: "POST",
      auth: true,
            params: { tenantId: Digit.ULBService.getCurrentTenantId() },
      data,
    }),
};
