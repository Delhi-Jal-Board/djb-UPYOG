import React, { useMemo } from "react";
import { useHistory, useParams } from "react-router-dom";
import { FaArrowLeft, FaUsers, FaCheckCircle, FaClock, FaExclamationTriangle, FaMapMarkedAlt } from "react-icons/fa";
import { ekycMockData } from "./mockData";
import ExecutiveLineChart from "./analytics/charts/ExecutiveLineChart";
import ExecutiveBarChart from "./analytics/charts/ExecutiveBarChart";
import ExecutivePieChart from "./analytics/charts/ExecutivePieChart";

const VendorDetails = () => {
  const history = useHistory();
  const { vendorId = 1 } = useParams();
  const vendor = useMemo(() => ekycMockData.vendors.find((item) => item.id === Number(vendorId)), [vendorId]);

  if (!vendor) {
    return (
      <div className="ekyc-dashboard-wrapper">
        <div className="dashboard-shell">
          <div className="detail-header">
            <button className="back-button" onClick={() => history.goBack()}>
              <FaArrowLeft /> Back
            </button>
          </div>
          <div className="empty-state">
            <h2>Vendor analytics not found</h2>
            <p>The selected vendor does not exist in the current report. Please return to the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  const zoneRows = vendor.zones.slice(0, 8);

  const performanceData = vendor.dailyPerformance.map((row) => ({
    day: row.day,
    completed: row.completed,
    pending: row.pending,
    rejected: row.rejected,
  }));

  return (
    <div className="ekyc-dashboard-wrapper">
      <div className="dashboard-shell detail-shell">
        <section className="kpi-grid detail-kpi-grid">
          {[
            {
              label: "Assigned Connections",
              value: vendor.assignedConnections,
              icon: <FaUsers />,
              variant: "primary",
            },
            {
              label: "Agency eKYC",
              value: vendor.completedEkyc,
              icon: <FaCheckCircle />,
              variant: "success",
            },
            {
              label: "Self eKYC",
              value: vendor.selfEkyc,
              icon: <FaUsers />,
              variant: "info",
            },
            {
              label: "Pending",
              value: vendor.pending,
              icon: <FaClock />,
              variant: "warning",
            },
            {
              label: "Rejected",
              value: vendor.rejected,
              icon: <FaExclamationTriangle />,
              variant: "danger",
            },
            {
              label: "Success Rate",
              value: `${vendor.successRate}%`,
              icon: <FaCheckCircle />,
              variant: "success",
            },
          ].map((item) => (
            <article key={item.label} className={`kpi-card card-${item.variant}`}>
              <div className="kpi-icon">{item.icon}</div>
              <div>
                <p className="kpi-title">{item.label}</p>
                <h2>{item.value?.toLocaleString?.() ?? item.value}</h2>
              </div>
            </article>
          ))}
        </section>

        <section className="analytics-grid detail-analytics-grid">
          <div className="analytics-panel glass-card">
            <div className="section-header">
              <h2>Daily Completion Trend</h2>
              <span className="badge success">Performance</span>
            </div>
            <ExecutiveLineChart data={performanceData} dataKey="completed" name="Completed" />
          </div>

          <div className="analytics-panel glass-card">
            <div className="section-header">
              <h2>Pending vs Completed</h2>
              <span className="badge warning">Workload</span>
            </div>
            <ExecutiveBarChart
              data={performanceData}
              categories={[
                { key: "completed", name: "Completed" },
                { key: "pending", name: "Pending" },
              ]}
              xKey="day"
            />
          </div>

          <div className="analytics-panel glass-card">
            <div className="section-header">
              <h2>Self vs Agency Split</h2>
              <span className="badge info">Adoption</span>
            </div>
            <ExecutivePieChart
              data={[
                { label: "Agency eKYC", value: vendor.completedEkyc },
                { label: "Citizen Self eKYC", value: vendor.selfEkyc },
              ]}
              dataKey="value"
              labelKey="label"
            />
          </div>
        </section>

        <section className="zone-section detail-zone-section">
          <div className="section-header">
            <div>
              <h2>
                <FaMapMarkedAlt /> Zone-wise Jurisdiction Analytics
              </h2>
              <p>Drill into the current operational load and heatmap intensity for this vendor.</p>
            </div>
          </div>
          <div className="table-wrapper glass-card">
            <table>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Cluster</th>
                  <th>Assigned</th>
                  <th>Agency eKYC</th>
                  <th>Pending</th>
                  <th>Activity Score</th>
                </tr>
              </thead>
              <tbody>
                {zoneRows.map((row, index) => (
                  <tr key={`${row.location}-${index}`}>
                    <td>{row.location}</td>
                    <td>{row.cluster || row.district}</td>
                    <td>{row.activeDemand?.toLocaleString() ?? "—"}</td>
                    <td>{row.pppZones?.toLocaleString() ?? "—"}</td>
                    <td>{row.inactiveDemand?.toLocaleString() ?? "—"}</td>
                    <td>
                      <span className={`status-badge ${row.intensityScore > 65 ? "danger" : row.intensityScore > 45 ? "warning" : "success"}`}>
                        {row.intensityScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bottom-grid detail-bottom-grid">
          <div className="cards-summary glass-card">
            <h2>Operational Efficiency</h2>
            <div className="efficiency-grid">
              <div className="efficiency-box">
                <h3>{vendor.activeSurveyors}</h3>
                <p>Active Surveyors</p>
              </div>
              <div className="efficiency-box">
                <h3>{vendor.supervisors}</h3>
                <p>Supervisors</p>
              </div>
              <div className="efficiency-box">
                <h3>{vendor.progress}%</h3>
                <p>Execution Rate</p>
              </div>
              <div className="efficiency-box">
                <h3>{vendor.dailyPerformance.slice(-1)[0]?.completed?.toLocaleString()}</h3>
                <p>Latest Day Completed</p>
              </div>
            </div>
          </div>

          <div className="cards-summary glass-card">
            <h2>Supervisor Pulse</h2>
            <div className="pulse-list">
              {vendor.jurisdictions.map((zone) => (
                <div key={zone} className="pulse-row">
                  <span>{zone}</span>
                  <span>{Math.max(12, Math.round(Math.random() * 38))} active</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VendorDetails;
