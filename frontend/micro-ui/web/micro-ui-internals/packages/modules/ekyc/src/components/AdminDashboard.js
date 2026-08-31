import React, { useMemo } from "react";
import { Card, Loader } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Dashboard from "./Dashboard";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const history = useHistory();
  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId || tenantId === "dl") {
    tenantId = "dl.djb";
  }

  // Fetch all vendors from DSO search
  const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId }
  );

  const allVendorIds = useMemo(() => {
    if (!vendorSearchResponse) return [];
    return vendorSearchResponse
      .map((v) => {
        const dso = v.dsoDetails || v;
        return dso.id || dso.vendorId || v.id || v.vendorId;
      })
      .filter(Boolean);
  }, [vendorSearchResponse]);

  // Fetch assignment progress with hierarchy (supervisor and surveyor details)
  const { data: progressData, isLoading: isProgressLoading } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    {
      tenantId,
      allVendorsDetailed: true,
    },
    {
      enabled: !!tenantId && allVendorIds.length > 0,
      keepPreviousData: true,
    }
  );

  return (
    <Card className="surveyor-dashboard">
      <Dashboard />
      <div className="admin-performance-section">
        <h3 className="section-title">{t("EKYC_VENDORS_PERFORMANCE") || "eKYC Vendors Performance"}</h3>

        {isVendorSearchLoading || isProgressLoading ? (
          <Loader />
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

                <span className="progress-badge">{11111 || 0}%</span>
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
                  <div className="vendor-card-header">
                    <div className="vendor-title">
                      <div className="vendor-icon">
                        <span>{vendor.vendorName[0].toUpperCase()}</span>
                      </div>

                      <div>
                        <h4>{vendor.vendorName}</h4>
                        <span className="vendor-subtitle">{t("EKYC_VENDOR") || "eKYC Vendor"}</span>
                      </div>
                    </div>

                    <div className="progress-badge">{vendor.progressPercent}%</div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${vendor.progressPercent}%` }} />
                    </div>

                    <div className="progress-label">
                      <span>{t("PROGRESS") || "Progress"}</span>
                      <span>{vendor.progressPercent}%</span>
                    </div>
                  </div>

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
                      <span className="stat-value completed-val">{vendor.submittedKnos}</span>
                      <span className="stat-label">{t("COMPLETED") || "Completed"}</span>
                    </div>
                  </div>

                  <div className="knos-summary">
                    <div className="kno-stat">
                      <span className="kno-label">{t("TOTAL") || "Total"}</span>
                      <strong>{vendor.totalKnos}</strong>
                    </div>

                    <div className="kno-stat pending">
                      <span className="kno-label">{t("PENDING") || "Pending"}</span>
                      <strong>{vendor.pendingKnos}</strong>
                    </div>

                    <div className="kno-stat rejected">
                      <span className="kno-label">{t("REJECTED") || "Rejected"}</span>
                      <strong>{vendor.rejectedKnos}</strong>
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
