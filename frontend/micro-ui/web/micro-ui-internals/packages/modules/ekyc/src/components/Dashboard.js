import React from "react";
import StatusCards from "./StatusCards";

const Dashboard = ({ progressData, isProgressLoading }) => {
  const countData = {
    total: progressData?.totalKnosInSystem || 0,
    completed: progressData?.completedKnosInZones || 0,
    pending: progressData?.pendingKnosInZones || 0,
    rejected: progressData?.rejectedKnos || 0,
    totalAssignments: progressData?.totalAssignments || 0,
    submittedCount: progressData?.submittedKnos || 0,
    selfEkycCount: progressData?.selfEkycCount || 0,
    overallProgressPercent: progressData?.overallProgressPercent || 0,
  };

  return isProgressLoading ? <EkycDashboardSkeleton /> : <StatusCards countData={countData} />;
};

export default Dashboard;

const EkycDashboardSkeleton = () => {
  return (
    <div className="ekyc-employee-container">
      <div className="status-panel ekyc-skel-panel">
        <div className="status-cards-header">
          <div className="status-card-title">
            <div className="ekyc-skel ekyc-skel-icon" />
            <div className="ekyc-skel ekyc-skel-title" />
          </div>

          <div className="ekyc-skel ekyc-skel-download-btn" />
        </div>

        <div className="status-breakdown-content">
          {/* Chart */}
          <div className="chart-wrapper">
            <div className="ekyc-skel ekyc-skel-donut" />
          </div>

          {/* Status Boxes */}
          <div className="status-boxes">
            {[1, 2, 3, 4].map((item) => (
              <div className="status-box" key={item}>
                <div className="status-box-top">
                  <div className="ekyc-skel ekyc-skel-dot" />
                  <div className="ekyc-skel ekyc-skel-name" />
                </div>
                <div className="ekyc-skel ekyc-skel-value" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
