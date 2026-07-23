import React, { useMemo } from "react";
import StatusCards from "./StatusCards";
import { Card, Loader } from "@djb25/digit-ui-react-components";

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

  const countData = useMemo(() => {
    const info = dashboardData?.dashboardInfo || {};
    return {
      total: info.total || 0,
      completed: info.completed || 0,
      pending: info.pending || 0,
      rejected: info.rejected || 0,
      active: info.active || 0,
      submittedCount: info.submittedCount || 0,
      inProgressCount: info.inProgressCount || 0,
    };
  }, [dashboardData]);

  return isLoading ? (
    <Loader />
  ) : (
    <Card className="min-width-full">
      <StatusCards countData={countData} />
    </Card>
  );
};

export default Dashboard;
