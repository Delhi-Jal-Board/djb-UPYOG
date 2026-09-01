import Urls from "../atoms/urls";
import { Request } from "../atoms/Utils/Request";

export const EkycService = {
  search_connection: (data, tenantId) =>
    Request({
      url: Urls.ekyc.application_search,
      data: data,
      useCache: false,
      method: "POST",
      params: { tenantId },
      auth: true,
      userService: true,
    }),

  dashboard: (data, params) =>
    Request({
      url: Urls.ekyc.dashboard,
      data: data,
      useCache: false,
      method: "POST",
      params,
      auth: true,
      userService: true,
      setTimeParam: false,
    }),

  application_review: (data, params) =>
    Request({
      url: Urls.ekyc.application_review,
      data: { ...data },
      useCache: false,
      method: "POST",
      params: { tenantId: params },
      auth: true,
      userService: true,
    }),

  application_update: (data, tenantId) =>
    Request({
      url: Urls.ekyc.application_update,
      data: data,
      useCache: false,
      method: "POST",
      params: { tenantId },
      auth: true,
      userService: true,
    }),

  application_approve: async (data, tenantId) => {
    const response = await Request({
      url: Urls.ekyc.application_approve,
      data: data,
      useCache: false,
      method: "POST",
      params: { tenantId },
      auth: true,
      userService: true,
    });

    if (response?.error || response?.Errors || response?.responseInfo?.status === "failed" || response?.code) {
      throw response;
    }

    return response;
  },

  fetchSummary: (data) =>
    Request({
      url: Urls.ekyc.dashboard_summary,
      data: data,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
    }),
  fetchAgencyAnalytics: (data) =>
    Request({
      url: Urls.ekyc.agency_search,
      data: data,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
    }),
  fetchClusterHeatmap: (data) =>
    Request({
      url: Urls.ekyc.cluster_heatmap,
      data: data,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
    }),
  fetchWorkflowTracking: (data) =>
    Request({
      url: Urls.ekyc.workflow_tracking,
      data: data,
      useCache: false,
      method: "POST",
      auth: true,
      userService: true,
    }),

  application_list: ({
    tenantId = "dl.djb",
    offset = 0,
    limit = 20,
    fromDate = null,
    toDate = null,
    ...extraData
  } = {}) => {
    // Clean null and undefined values
    const data = {};
    Object.keys(extraData).forEach((key) => {
      if (extraData[key] !== null && extraData[key] !== undefined) {
        data[key] = extraData[key];
      }
    });

    return Request({
      url: Urls.ekyc.application_list,
      method: "POST",
      auth: true,
      userService: true,
      useCache: false,
      params: {
        tenantId,
        offset,
        limit,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      },
      data,
    });
  },

  assignment_create: async ({ tenantId = "dl.djb", surveyorId, assignmentType, assignmentValue, assignmentValues } = {}) => {
    const response = await Request({
      url: Urls.ekyc.assignment_create,
      method: "POST",
      auth: true,
      userService: true,
      useCache: false,
      params: { tenantId },
      data: {
        surveyorId,
        assignmentType,
        assignmentValue,
        assignmentValues,
      },
    });

    if (response?.error) {
      throw response;
    }

    return response;
  },
  assignment_progress: async ({ tenantId = "dl.djb", includeHierarchy = false, vendorId, vendorIds, ...extraData } = {}) => {
    const effectiveVendorId = vendorId || (vendorIds && vendorIds.length > 0 ? vendorIds[0] : undefined);

    const response = await Request({
      url: Urls.ekyc.assignment_progress,
      method: "POST",
      auth: true,
      userService: true,
      useCache: false,
      params: { tenantId },
      data: {
        includeHierarchy,
        ...(effectiveVendorId ? { vendorId: effectiveVendorId } : {}),
        ...(vendorIds && vendorIds.length > 0 ? { vendorIds } : {}),
        ...extraData,
      },
    });

    if (response?.error) {
      throw response;
    }

    return response;
  },
  assignment_reassign: async ({ tenantId = "dl.djb", newSurveyorId, assignmentType, assignmentValue, assignmentValues } = {}) => {
    const response = await Request({
      url: Urls.ekyc.assignment_reassign,
      method: "POST",
      auth: true,
      userService: true,
      useCache: false,
      params: { tenantId },
      data: {
        newSurveyorId,
        assignmentType,
        assignmentValue,
        assignmentValues,
      },
    });

    if (response?.error) {
      throw response;
    }

    return response;
  },
};
