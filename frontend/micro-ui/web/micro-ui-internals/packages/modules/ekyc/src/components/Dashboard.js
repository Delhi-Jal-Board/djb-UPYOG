import React, { useMemo } from "react";
import StatusCards from "./StatusCards";
import { Loader } from "@djb25/digit-ui-react-components";

// Mock data removed in favor of API integration

const Dashboard = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

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
    return {
      total: progressData?.totalKnosInSystem || 0,
      completed: progressData?.submittedKnos + progressData?.selfEkycCount || 0,
      pending: progressData?.pendingKnos || 0,
      rejected: progressData?.rejectedKnos || 0,
      totalAssignments: progressData?.totalAssignments || 0,
      submittedCount: progressData?.submittedKnos || 0,
      selfEkycCount: progressData?.selfEkycCount || 0,
      overallProgressPercent: progressData?.overallProgressPercent || 0,
    };
  }, [progressData]);

  return isProgressLoading ? <Loader /> : <StatusCards countData={countData} />;
};

export default Dashboard;
