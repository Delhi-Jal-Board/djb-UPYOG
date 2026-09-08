import React from "react";
import { Card } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Dashboard from "./Dashboard";

const VendorCardSkeleton = () => {
  return (
    <div className="vendor-perf-card vendor-perf-card-skeleton">
      {/* Header */}
      <div className="vendor-card-header">
        <div className="vendor-title">
          <div className="skeleton skeleton-icon" />

          <div className="skeleton-title-wrapper">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-subtitle" />
          </div>
        </div>

        <div className="skeleton skeleton-kno-badge" />
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="skeleton skeleton-progress-bar" />

        <div className="progress-label">
          <div className="skeleton skeleton-progress-label" />
          <div className="skeleton skeleton-progress-value" />
        </div>
      </div>

      {/* Team Stats */}
      <div className="stats-grid">
        {[1, 2, 3].map((item) => (
          <div className="stat-item" key={item}>
            <div className="skeleton skeleton-stat-value" />
            <div className="skeleton skeleton-stat-label" />
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="knos-summary">
        {[1, 2, 3].map((item) => (
          <div className="kno-stat" key={item}>
            <div className="skeleton skeleton-status-label" />
            <div className="skeleton skeleton-status-value" />
          </div>
        ))}
      </div>
    </div>
  );
};

const VendorPerformanceSkeleton = () => {
  return (
    <div className="vendors-grid">
      {[1, 2, 3].map((item) => (
        <VendorCardSkeleton key={item} />
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const history = useHistory();

  // Fetch assignment progress with hierarchy (supervisor and surveyor details)
  const { data: progressData, isLoading: isProgressLoading } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    {
      tenantId: "dl.djb",
      allVendorsDetailed: true,
    },
    {
      enabled: true,
      keepPreviousData: true,
    }
  );

  return (
    <Card className="surveyor-dashboard">
      <Dashboard isProgressLoading={isProgressLoading} progressData={progressData} />
      <div className="admin-performance-section">
        <h3 className="section-title">{t("EKYC_VENDORS_PERFORMANCE") || "eKYC Vendors Performance"}</h3>

        {isProgressLoading ? (
          <VendorPerformanceSkeleton />
        ) : (
          <div className="vendors-grid">
            {/* Self eKYC */}
            {/* Commented by Avinash This part will be uncommented when this part will be developed from backend in future */}
            {/* <div className="vendor-perf-card self-ekyc-card" onClick={() => history.push(`/digit-ui/employee/ekyc/self`)}>
              <div className="card-header">
                <div className="vendor-info">
                  <h4>{t("SELF_EKYC") || "Self eKYC"}</h4>
                  <p>{t("SELF_EKYC_BY_USERS") || "eKYC completed directly by users"}</p>
                </div>

                <span className="kno-count-badge">{11111 || 0}%</span>
              </div>

              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${11111 || 0}%` }} />
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="value completed-val">{11111 || 0}</div>
                  <div className="label">{t("COMPLETED") || "Completed"}</div>
                </div>

                <div className="stat-item">
                  <div className="value">{11111 || 0}</div>
                  <div className="label">{t("PENDING") || "Pending"}</div>
                </div>

                <div className="stat-item">
                  <div className="value">{11111 || 0}</div>
                  <div className="label">{t("TOTAL") || "Total"}</div>
                </div>
              </div>

              <div className="card-footer">
                <span>{t("SELF_EKYC") || "Self eKYC"}</span>

                <span>{t("USERS") || "Users"}</span>
              </div>
            </div> */}

            {/* Vendors */}
            {Array.isArray(progressData?.vendorReports) &&
              progressData?.vendorReports.length &&
              progressData?.vendorReports.map((vendor) => (
                <div
                  key={vendor.vendorId}
                  className="vendor-perf-card"
                  onClick={() => history.push(`/digit-ui/employee/ekyc/vendors/${vendor.vendorId}`)}
                >
                  {/* Header */}
                  <div className="vendor-card-header">
                    <div className="vendor-title">
                      <div className="vendor-icon">
                        <span>{vendor.vendorName?.[0]?.toUpperCase()}</span>
                      </div>

                      <div>
                        <h4>{vendor.vendorName}</h4>
                        <span className="vendor-subtitle">{t("EKYC_VENDOR") || "eKYC Vendor"}</span>
                      </div>
                    </div>

                    <div className="kno-count-badge">
                      <span className="kno-count-label">{t("TOTAL_KNOS") || "Total KNOs"} -</span>
                      <span className="kno-count-value">{vendor.totalKnosInZones}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="progress-section">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${vendor.progressPercent}%` }} />
                    </div>

                    <div className="progress-label">
                      <span>{t("PROGRESS") || "Progress"}</span>
                      <span>{vendor.progressPercent}%</span>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">{vendor.totalSupervisors}</span>
                      <span className="stat-label">{t("SUPERVISORS") || "Supervisors"}</span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-value">{vendor.totalSurveyors}</span>
                      <span className="stat-label">{t("SURVEYORS") || "Surveyors"}</span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-value">{vendor.totalKnos}</span>
                      <span className="stat-label">{t("TOTAL_EKYC_APPLICATIONS") || "Total KNOs"}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="knos-summary">
                    <div className="kno-stat">
                      <span className="kno-label">{t("SUBMITTED") || "Submitted"}</span>
                      <strong>{vendor.submittedKnosInZones}</strong>
                    </div>

                    <div className="kno-stat pending">
                      <span className="kno-label">{t("PENDING") || "Pending"}</span>
                      <strong>{vendor.pendingKnosInZones}</strong>
                    </div>

                    <div className="kno-stat rejected">
                      <span className="kno-label">{t("EKYC_SUBMITTED_BY_CITIZENS").toLowerCase() || "Submitted by citizen"}</span>
                      <strong>{vendor.selfEkycCountInZones}</strong>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminDashboard;
