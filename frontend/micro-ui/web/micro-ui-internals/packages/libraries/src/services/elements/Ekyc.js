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
        }),
    application_list: (data, params) =>
        Request({
            url: Urls.ekyc.application_list,
            data: data,
            useCache: false,
            method: "POST",
            params,
            auth: true,
            userService: true,
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
};
