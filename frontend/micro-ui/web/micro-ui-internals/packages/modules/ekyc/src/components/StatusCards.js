import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as Chartjs from "chart.js/auto";

const getChartConstructor = () => {
  const C = Chartjs.Chart || Chartjs.default || Chartjs;
  return C;
};

const StatusCards = ({ countData }) => {
  const { t } = useTranslation();
  const chartRef1 = useRef(null);
  const chartInstance1 = useRef(null);

  const total = countData?.total || 0;
  const pending = countData?.pending || 0;
  const active = countData?.completed || 0;
  const completed = 0;

  const actualCompleted = countData?.completed || 0;
  const approved = actualCompleted;

  const efficiency = total > 0 ? Math.round((actualCompleted / total) * 100) : 0;
  const healthPct = total > 0 ? Math.round((approved / total) * 100) : 0;

  const formatNumber = (num) => new Intl.NumberFormat("en-IN").format(num || 0);

  useEffect(() => {
    if (chartRef1.current) {
      if (chartInstance1.current) chartInstance1.current.destroy();
      const ctx1 = chartRef1.current.getContext("2d");
      const ChartConstructor = getChartConstructor();
      chartInstance1.current = new ChartConstructor(ctx1, {
        type: "doughnut",
        data: {
          labels: [t("EKYC_ACTIVE"), t("EKYC_PENDING"), t("EKYC_COMPLETED")],
          datasets: [
            {
              data: [active, pending, completed],
              backgroundColor: ["#0c2a52", "#77B6EA", "#c8ddf5"],
              borderColor: ["#ffffff", "#ffffff", "#ffffff"],
              borderWidth: 2,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          cutout: "75%",
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          responsive: true,
        },
      });
    }

    return () => {
      if (chartInstance1.current) chartInstance1.current.destroy();
    };
  }, [pending, completed, active, t]);

  const legendItems = [
    { color: "#0c2a52", label: t("EKYC_ACTIVE"), value: active },
    { color: "#77B6EA", label: t("EKYC_PENDING"), value: pending },
    { color: "#c8ddf5", label: t("EKYC_COMPLETED"), value: completed },
  ];

  return (
    <div className="ekyc-employee-container">
      <div className="status-cards-wrapper">
        {/* Header */}
        <div className="status-cards-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              {t("EKYC_INSTITUTIONAL_OVERVIEW") || "Institutional Performance Overview"}
            </div>
            <h1 className="status-cards-h1">{t("EKYC_DASHBOARD_TITLE") || "eKYC Verification Dashboard"}</h1>
            <p className="status-cards-subtitle">
              {t("EKYC_DASHBOARD_SUBTITLE") || "Real-time monitoring of consumer verification workflows across all administrative zones."}
            </p>
          </div>
          <div className="total-applications-card">
            <div className="total-label">{t("EKYC_TOTAL_APPLICATIONS") || "Total Applications Processed"}</div>
            <div className="total-number">{formatNumber(total)}</div>
            <div className="total-badge">↗ +12.4% {t("EKYC_FROM_LAST_QUARTER") || "from last quarter"}</div>
          </div>
        </div>

        {/* Panels */}
        <div className="status-panels-grid">
          {/* Panel 1: Status Breakdown */}
          <div className="status-panel">
            <div className="panel-title">{t("EKYC_STATUS_BREAKDOWN") || "Status Breakdown"}</div>
            <div className="panel-subtitle">{t("EKYC_VERIFICATION_LIFECYCLE") || "Verification lifecycle distribution"}</div>
            <div className="breakdown-body">
              <div className="status-legend">
                {legendItems.map((item) => (
                  <div key={item.label} className="legend-row">
                    <span className="legend-label">
                      <span className="indicator-dot" style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <span className="legend-value">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
              <div className="chart-wrapper">
                <canvas ref={chartRef1} style={{ width: "100%", height: "100%" }} />
                <div className="chart-center">
                  <div className="chart-percentage">{efficiency}%</div>
                  <div className="chart-label">{t("EKYC_COMPLETE") || "Complete"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Submission Health */}
          <div className="status-panel">
            <div className="panel-title">
              {t("EKYC_SUBMISSION_HEALTH") || "Submission Health"}
              <span className="optimal-badge">{t("EKYC_OPTIMAL") || "Optimal"}</span>
            </div>
            <div className="panel-subtitle">{t("EKYC_PLATFORM_EFFICIENCY") || "Platform operational efficiency"}</div>
            <div className="health-metrics-row">
              <div className="health-percentage">{healthPct}%</div>
              <div className="health-trend">↗ +2.1%</div>
            </div>
            <div className="status-progress-bar">
              <div className="progress-fill" style={{ width: `${healthPct}%` }} />
            </div>
            <div className="mini-metrics-grid">
              <div className="metric-box">
                <div className="metric-label">{t("EKYC_AVG_LATENCY") || "Avg Latency"}</div>
                <div className="metric-value">1.2s</div>
              </div>
              <div className="metric-box">
                <div className="metric-label">{t("EKYC_ERROR_RATE") || "Error Rate"}</div>
                <div className="metric-value">0.04%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;
