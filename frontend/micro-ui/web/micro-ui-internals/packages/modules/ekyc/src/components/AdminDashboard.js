import React, { useMemo } from "react";
import { Card, Loader } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Dashboard from "./Dashboard";

const parseAdditionalDetails = (additionalDetails) => {
  if (!additionalDetails) return {};
  if (typeof additionalDetails === "object") return additionalDetails;
  if (typeof additionalDetails !== "string") return {};
  try {
    return JSON.parse(additionalDetails);
  } catch (error) {
    return {};
  }
};

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

  const vendorsList = useMemo(() => {
    if (vendorSearchResponse && vendorSearchResponse.length > 0) {
      const filteredVendors = vendorSearchResponse.filter((v) => {
        const dso = v.dsoDetails || v;
        const additionalDetails = parseAdditionalDetails(dso.additionalDetails || v.additionalDetails);
        return additionalDetails?.serviceType?.toLowerCase() === "ekyc";
      });

      return filteredVendors.map((v) => {
        const dso = v.dsoDetails || v;
        const supervisorsList = dso.supervisors || [];
        const surveyorsList = dso.surveyors || [];

        // Extract supervisor IDs for this vendor
        const supervisorIds = supervisorsList.map((s) => s.id || s.owner?.uuid).filter(Boolean);

        // Find supervisor reports in progressData matching these IDs
        const matchedReports = progressData?.supervisorReport?.filter((r) => supervisorIds.includes(r.supervisorId)) || [];

        const completed = matchedReports.reduce((acc, r) => acc + (r.submittedKnos || 0), 0);
        const pending = matchedReports.reduce((acc, r) => acc + (r.pendingKnos || 0), 0);
        const total = matchedReports.reduce((acc, r) => acc + (r.totalKnos || 0), 0);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const rejected = 0; // Default to 0 or calculate if data exists

        return {
          id: dso.id || dso.vendorId || v.id || v.vendorId,
          name: dso.name || dso.displayName || v.name || "N/A",
          ownerName: dso.owner?.name || v.owner?.name || "N/A",
          mobileNumber: dso.mobileNumber || dso.owner?.mobileNumber || v.mobileNumber || "N/A",
          supervisors: supervisorsList.length,
          surveyors: surveyorsList.length,
          completed: completed,
          progress: progress,
          pending: pending,
          rejected: rejected,
        };
      });
    }
    return [];
  }, [vendorSearchResponse, progressData]);

  return (
    <Card className="surveyor-dashboard">
      <Dashboard />
      <div className="admin-performance-section">
        <h3 className="section-title">{t("EKYC_VENDORS_PERFORMANCE") || "eKYC Vendors Performance"}</h3>

        {isVendorSearchLoading || isProgressLoading ? (
          <Loader />
        ) : (
          <div className="vendors-grid">
            {vendorsList.length === 0 ? (
              <div className="no-vendors">{t("NO_VENDORS_FOUND") || "No vendors found."}</div>
            ) : (
              vendorsList.map((vendor) => (
                <div key={vendor.id} className="vendor-perf-card" onClick={() => history.push(`/digit-ui/employee/ekyc/vendors/${vendor.id}`)}>
                  <div className="card-header">
                    <div className="vendor-info">
                      <h4>{vendor.name}</h4>
                      <p>
                        {t("MOBILE") || "Mobile"}: {vendor.mobileNumber}
                      </p>
                    </div>
                    <span className="progress-badge">{vendor.progress}%</span>
                  </div>

                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${vendor.progress}%` }}></div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="value">{vendor.supervisors}</div>
                      <div className="label">{t("SUPERVISORS") || "Supervisors"}</div>
                    </div>
                    <div className="stat-item">
                      <div className="value">{vendor.surveyors}</div>
                      <div className="label">{t("SURVEYORS") || "Surveyors"}</div>
                    </div>
                    <div className="stat-item">
                      <div className="value completed-val">{vendor.completed}</div>
                      <div className="label">{t("COMPLETED") || "Completed"}</div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <span>
                      {t("PENDING") || "Pending"}: <span className="pending-count">{vendor.pending}</span>
                    </span>
                    <span>
                      {t("REJECTED") || "Rejected"}: <span className="rejected-count">{vendor.rejected}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminDashboard;
