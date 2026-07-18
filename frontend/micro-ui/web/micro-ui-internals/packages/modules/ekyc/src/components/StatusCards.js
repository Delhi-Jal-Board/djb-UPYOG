import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Chartjs from "chart.js/auto";

const getChartConstructor = () => {
  const C = Chartjs.Chart || Chartjs.default || Chartjs;
  return C;
};
const StatusCards = ({ countData }) => {
  const { t } = useTranslation();
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId || tenantId === "dl") {
    tenantId = "dl.djb";
  }
  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const fullName = loggedInUser?.name || "Admin";

  const { data: dashboardData } = Digit.Hooks.ekyc.useEkycSurveyorDashboard(
    {},
    {
      tenantId,
      offset: 0,
      limit: 10,
      ekycStatus: "submitted"
    },
    {
      enabled: !!tenantId,
    }
  );

  const apiCountData = React.useMemo(() => {
    const info = dashboardData?.dashboardInfo || {};
    return {
      total: info.total || 0,
      completed: info.completed || 0,
      pending: info.pending || 0,
      rejected: info.rejected || 0,
      active: info.active || 0,
    };
  }, [dashboardData]);

  const handleDownloadEkycData = async () => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        reportDownload: true,
      });

      const consumerList = response?.consumerList || [];
      if (consumerList.length === 0) {
        alert(t("NO_DATA_FOUND") || "No data found for download.");
        return;
      }

      const excludedKeys = [
        "status", "source", "submittedAt", "assignedAt", "connectionType", "approvedAt",
        "alternateMobileNo", "city", "state", "addressType", "addressProofType", "mrcode",
        "areacode", "verificationStatus", "surveyorId", "supervisorId", "vendorId",
        "assignmentType", "assignmentValue", "assignedTime", "isSelfAssigned", "userType",
        "tenantName", "tenantMobile"
      ];

      const headerMapping = {
        kno: t("KNO") || "KNO",
        firstName: t("FIRST_NAME") || "First Name",
        middleName: t("MIDDLE_NAME") || "Middle Name",
        lastName: t("LAST_NAME") || "Last Name",
        gender: t("GENDER") || "Gender",
        mobileNumber: t("MOBILE_NUMBER") || "Mobile Number",
        emailId: t("EMAIL_ID") || "Email ID",
        fatherOrHusbandName: t("FATHER_HUSBUND_NAME") || "Father/Husband Name",
        relationship: t("RELATIONSHIP") || "Relationship",
        dob: t("DOB") || "Date of Birth",
        ekycStatus: t("EKYC_STATUS") || "eKYC Status",
        zoneName: t("ZONE") || "Zone",
        assembly: t("ASSEMBLY") || "Assembly",
        ward: t("WARD") || "Ward",
        pincode: t("PINCODE") || "Pincode",
        mrkey: t("MR_KEY") || "MR Key",
        consumerType: t("CONSUMER_TYPE") || "Consumer Type",
        createdTime: t("CREATED_TIME") || "Created Time",
        lastModifiedTime: t("LAST_MODIFIED_TIME") || "Last Modified Time",
      };

      const toTitleCase = (str) => {
        if (!str) return "";
        // Handle dot-notation values like "CONSUMERTYPE.INDIVIDUAL" → "Individual"
        const cleanStr = String(str).includes(".") ? String(str).split(".").pop() : String(str);
        return cleanStr
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      };

      // Fields where original value must be preserved (identifiers, numbers, emails, dates)
      const skipTitleCase = ["kno", "mobileNumber", "emailId", "pincode", "mrkey", "dob", "createdTime", "lastModifiedTime"];

      const excelData = consumerList.map((item) => {
        const cleanObj = {};

        const name = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
        if (name) {
          cleanObj[t("CONSUMER_NAME") || "Consumer Name"] = toTitleCase(name);
        }

        Object.keys(item).forEach(key => {
          if (excludedKeys.includes(key)) return;

          const val = item[key];
          if (typeof val === "object" && val !== null) {
            return;
          }

          const friendlyHeader = headerMapping[key] || t(key.toUpperCase()) || key;

          // Apply Title Case to ALL string fields except identifiers/numbers/dates
          if (typeof val === "string" && !skipTitleCase.includes(key)) {
            cleanObj[friendlyHeader] = toTitleCase(val);
          } else {
            cleanObj[friendlyHeader] = val;
          }
        });

        return cleanObj;
      });

      const cleanFileName = `eKYC_All_Data_Admin_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      Digit.Download.Excel(excelData, cleanFileName);
    } catch (error) {
      console.error("Error downloading eKYC Excel:", error);
    } finally {
      setEkycDownloadLoading(false);
    }
  };

  const chartRef1 = useRef(null);
  const chartInstance1 = useRef(null);
  const total = apiCountData?.total || countData?.total || countData?.totalCount || 0;
  const pending = apiCountData?.pending || countData?.pending || 0;
  const active = apiCountData?.active || countData?.active || 0;
  const completed = apiCountData?.completed || countData?.completed || 0;

  const actualCompleted = completed;
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
            <button
              className="download-excel-btn"
              disabled={ekycDownloadLoading}
              onClick={handleDownloadEkycData}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_EXCEL") || "Download Excel"}
            </button>
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
