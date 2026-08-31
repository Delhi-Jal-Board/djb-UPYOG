import React, { useMemo } from "react";
import StatusCards from "./StatusCards";
import { Loader } from "@djb25/digit-ui-react-components";

// Mock data removed in favor of API integration

const Dashboard = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  // 2. API Data Fetching
  const { isLoading, data: dashboardData } = Digit.Hooks.ekyc.useEkycSurveyorDashboard(
    {},
    {
      tenantId,
      offset: 0,
      limit: 10,
    },
    {
      enabled: !!tenantId,
    }
  );

  // Fetch assignment progress with hierarchy (supervisor and surveyor details)
  const { data: progressData, isLoading: isProgressLoading } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    {
      tenantId,
      allVendorsDetailed: true,
    },
    {
      enabled: true,
      keepPreviousData: true,
    }
  );

  const countData = useMemo(() => {
    const info = dashboardData?.dashboardInfo || {};
    return {
      total: info.total || 0,
      completed: progressData?.submittedKnos + progressData?.selfEkycCount || 0,
      pending: info.total - progressData?.submittedKnos - progressData?.selfEkycCount || 0,
      rejected: progressData?.rejectedKnos || 0,
      active: progressData?.active || 0,
      submittedCount: progressData?.submittedKnos || 0,
      selfEkycCount: progressData?.selfEkycCount || 0,
      overallProgressPercent: progressData?.overallProgressPercent || 0,
    };
  }, [dashboardData, progressData]);

  return isProgressLoading || isLoading ? <Loader /> : <StatusCards countData={countData} />;
};

export default Dashboard;
