import React from "react";
import { useHistory } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { MockDashboardData } from "./mockData";
import { DashboardConfig } from "./dashboardConfig";

// search connection
export const useSearchConnection = ({ tenantId, details }, config = {}) => {
  const client = useQueryClient();

  const { isLoading, error, data } = useQuery(
    ["ekycSearchConnection", tenantId, details?.kno, details?.name, details?.fetchType],
    () => Digit.EkycService.search_connection(details, tenantId),
    config
  );

  return {
    isLoading,
    error,
    data,
    revalidate: () => client.invalidateQueries(["ekycSearchConnection", tenantId, details?.kno, details?.name, details?.fetchType]),
  };
};

// get connection type
export const useGetPropertyType = (tenantId, config = {}) => {
  return Digit.Hooks.useCustomMDMS(tenantId, "ws-services-calculation", [{ name: "propertyTypeV2" }], config);
};

// get connection category
export const useGetConnectionTypeV2 = (tenantId, config = {}) => {
  return Digit.Hooks.useCustomMDMS(tenantId, "ws-services-calculation", [{ name: "connectionTypeV2" }], config);
};

// get user type
export const useGetUserType = (tenantId, config = {}) => {
  return Digit.Hooks.useCustomMDMS(tenantId, "ws-services-calculation", [{ name: "userTypeV2" }], config);
};

// get floor count
export const useGetFloorCount = (tenantId, config = {}) => {
  return Digit.Hooks.useCustomMDMS(tenantId, "ws-services-calculation", [{ name: "floorCount" }], config);
};

export const useEkycSurveyorDashboard = (data, params, config = {}) => {
  const { tenantId, offset, limit, status, surveyorId } = params;

  return useQuery(
    ["useEkycSurveyorDashboard", tenantId, offset, limit, status, surveyorId],
    () =>
      Digit.EkycService.dashboard(data, {
        tenantId,
        offset,
        limit,
        status,
        surveyorId,
      }),
    config
  );
};

export const useEkycApplicationReview = (params, config = {}) => {
  return useMutation((data) => Digit.EkycService.application_review(data, params), config);
};

export const useEkycSearchReview = (data, params, config = {}) => {
  return useQuery(["useEkycSearchReview", data, params], () => Digit.EkycService.application_review(data, params), config);
};

export const useEkycApplicationUpdate = (tenantId, config = {}) => {
  return useMutation((data) => Digit.EkycService.application_update(data, tenantId), config);
};

export const useEkycAPI = (type, tenantId, config = {}) => {
  const mutation = useMutation((data) => {
    if (type === "review") {
      return Digit.EkycService.application_review(data, tenantId);
    }
    // Add other types here if needed
  }, config);

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    data: mutation.data,
    getReview: mutation.mutate,
  };
};

export const useEkycApplicationApprove = (tenantId, config = {}) => {
  return useMutation((data) => Digit.EkycService.application_approve(data, tenantId), config);
};

// Migrated Hooks from EKYC Module
export const useEkycWorkflow = (tenantId, config = {}) => {
  return useMutation((data) => Digit.EkycService.application_approve(data, tenantId), config);
};

export const useEkycUpdate = (tenantId, config = {}) => {
  return useMutation((data) => Digit.EkycService.application_update(data, tenantId), config);
};

export const useEkycDashboardData = (role, filters = {}, config = {}) => {
  const isMock = true; // Default to mock mode as requested "moke hook"

  // const { data: summary, isLoading: isLoadingSummary } = useQuery(
  //   ["EKYC_DASHBOARD_SUMMARY", role, filters],
  //   () => (isMock ? Promise.resolve(MockDashboardData.getSummary(role, filters)) : Digit.EkycService.fetchSummary({ role, filters })),
  //   config
  // );

  // const { data: agencies, isLoading: isLoadingAgencies } = useQuery(
  //   ["EKYC_AGENCY_ANALYTICS", filters],
  //   () => (isMock ? Promise.resolve(MockDashboardData.getAgencies(filters)) : Digit.EkycService.fetchAgencyAnalytics({ filters })),
  //   config
  // );

  // const { data: heatmap, isLoading: isLoadingHeatmap } = useQuery(
  //   ["EKYC_CLUSTER_HEATMAP", filters],
  //   () => (isMock ? Promise.resolve(MockDashboardData.getClusterHeatmap(filters)) : Digit.EkycService.fetchClusterHeatmap({ filters })),
  //   config
  // );

  // const { data: workflow, isLoading: isLoadingWorkflow } = useQuery(
  //   ["EKYC_WORKFLOW_TRACKING", filters],
  //   () => (isMock ? Promise.resolve(MockDashboardData.getWorkflowTracking(filters)) : Digit.EkycService.fetchWorkflowTracking({ filters })),
  //   config
  // );

  return {
    summary,
    agencies,
    heatmap,
    workflow,
    isLoading: isLoadingSummary || isLoadingAgencies || isLoadingHeatmap || isLoadingWorkflow,
  };
};

export const useEkycDashboardConfigs = (roleType = "CEO") => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userRoles = Digit.UserService.getUser()?.info?.roles?.map((role) => role.code) || [];

  const config = React.useMemo(() => {
    const roleConfig = DashboardConfig.roles[roleType] || DashboardConfig.roles.CEO;
    return {
      ...roleConfig,
      globalFilters: DashboardConfig.globalFilters,
      kpis: DashboardConfig.kpis,
      tenantId,
    };
  }, [roleType, tenantId]);

  return {
    config,
    tenantId,
    userRoles,
  };
};

export const useInboxRouting = () => {
  const history = useHistory();

  const routeToInbox = (targetRoute, filters) => {
    if (!targetRoute) return;

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "ALL" && filters[key] !== undefined && filters[key] !== null) {
          queryParams.append(key, filters[key]);
        }
      });
    }

    const queryString = queryParams.toString();
    history.push(`${targetRoute}${queryString ? `?${queryString}` : ""}`);
  };

  return { routeToInbox };
};

export const useEkycAssignmentCreate = (config = {}) => {
  return useMutation((data) => Digit.EkycService.assignment_create(data), config);
};

export const useEkycAssignmentProgress = (config = {}) => {
  return useQuery(["useEkycAssignmentProgress"], () => Digit.EkycService.assignment_progress({ includeHierarchy: true }), config);
};

export const useEkycApplicationList = (data, params, config = {}) => {
  const { tenantId, offset, limit } = params;

  return useQuery(
    ["useEkycApplicationList", tenantId, offset, limit, data],
    () =>
      Digit.EkycService.application_list(
        {
          kno: null,
          ekycStatus: null,
          zoneName: null,
          assembly: null,
          ward: null,
          pincode: null,
          mrkey: null,
          surveyorId: null,
          ...data,
          tenantId,
          offset,
          limit,
        }
      ),
    config
  );
};
