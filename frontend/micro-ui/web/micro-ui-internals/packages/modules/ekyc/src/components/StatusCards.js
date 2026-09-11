import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Chartjs from "chart.js/auto";
import { FaChartBar, MdDownloadIcon } from "@djb25/digit-ui-react-components";
import { getEkycExcelData } from "../utils/ekycExcelData";

const getChartConstructor = () => {
  const C = Chartjs.Chart || Chartjs.default || Chartjs;
  return C;
};

const StatusCards = ({ countData }) => {
  const { t } = useTranslation();
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [customDate, setCustomDate] = useState({ from: "", to: "" });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const reportMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target)) {
        setShowReportMenu(false);
        setShowCustomPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId || tenantId === "dl") {
    tenantId = "dl.djb";
  }
  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const fullName = loggedInUser?.name || "Admin";

  const handleDownloadEkycData = async (fromDate, toDate) => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        reportDownload: true,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });

      const consumerList = response?.consumerList || [];
      if (consumerList.length === 0) {
        alert(t("NO_DATA_FOUND") || "No data found for download.");
        return;
      }

      const excelData = getEkycExcelData(consumerList, t);
      const cleanFileName = `eKYC_All_Data_Admin_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      Digit.Download.Excel(excelData, cleanFileName);
    } catch (error) {
      console.error("Error downloading eKYC Excel:", error);
    } finally {
      setEkycDownloadLoading(false);
    }
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const start = new Date(now);
    if (filter === "today") {
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (filter === "week") {
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    if (filter === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    return null;
  };

  const handlePresetDownload = async (filter) => {
    const range = getDateRange(filter);
    if (!range) return;
    setShowReportMenu(false);
    setShowCustomPicker(false);
    await handleDownloadEkycData(range.from.getTime(), range.to.getTime());
  };

  const handleCustomDownload = async () => {
    if (!customDate.from || !customDate.to) {
      alert(t("SELECT_DATE_RANGE") || "Please select both From and To dates.");
      return;
    }
    const from = new Date(customDate.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customDate.to);
    to.setHours(23, 59, 59, 999);
    setShowReportMenu(false);
    setShowCustomPicker(false);
    await handleDownloadEkycData(from.getTime(), to.getTime());
  };

  const chartRef1 = useRef(null);
  const chartInstance1 = useRef(null);

  const efficiency = countData?.total > 0 ? Math.round(((countData?.submittedCount + countData?.completed) / countData?.total) * 100) : 0;
  const formatNumber = (num) => new Intl.NumberFormat("en-IN").format(num || 0);

  useEffect(() => {
    if (chartRef1.current) {
      if (chartInstance1.current) chartInstance1.current.destroy();
      const ctx1 = chartRef1.current.getContext("2d");
      const ChartConstructor = getChartConstructor();
      chartInstance1.current = new ChartConstructor(ctx1, {
        type: "doughnut",
        data: {
          labels: [t("EKYC_PENDING"), t("EKYC_COMPLETED"), t("EKYC_SUBMITTED"), t("EKYC_INPROCESS")],
          datasets: [
            {
              data: [countData?.pending, countData?.completed, countData?.submitted, countData?.inprocess],
              backgroundColor: ["#0c2a52", "#77B6EA", "#c8ddf5", "#49a3fb"],
              borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
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
  }, [countData, t]);

  const legendItems = [
    {
      color: "#77B6EA",
      label: t("EKYC_TOTAL"),
      value: countData?.total || 0,
    },
    {
      color: "#0c2a52",
      label: t("EKYC_PENDING"),
      value: countData?.pending || 0,
    },
    {
      color: "#2E8B57",
      label: t("EKYC_COMPLETED"),
      value: countData?.completed || 0,
    },
    // {
    //   color: "#4C8BF5",
    //   label: t("EKYC_ASSIGNED"),
    //   value: countData?.totalAssignments || 0,
    // },

    {
      color: "#8B5CF6",
      label: t("EKYC_SUBMITTED_BY_VENDORS"),
      value: countData?.submittedCount || 0,
    },
    {
      color: "#F59E0B",
      label: t("EKYC_SUBMITTED_BY_CITIZEN"),
      value: countData?.selfEkycCount || 0,
    },
    {
      color: "#DC3545",
      label: t("EKYC_REJECTED"),
      value: countData?.rejected || 0,
    },
  ];

  return (
    <div className="ekyc-employee-container">
      <div className="status-panel">
        <div className="status-cards-header">
          <div className="status-card-title">
            <FaChartBar size={32} color="#fff" backgroundColor="#065297" style={{ paddingInline: "4px", borderRadius: "4px  " }} />

            <h1 className="status-cards-h1">{t("EKYC_DASHBOARD_TITLE") || "eKYC Verification Dashboard"}</h1>
          </div>
          <div className="report-download" ref={reportMenuRef}>
            <button
              className="total-applications-card download-btn"
              disabled={ekycDownloadLoading}
              onClick={() => {
                setShowReportMenu((p) => !p);
                setShowCustomPicker(false);
              }}
            >
              {t("DOWNLOAD_REPORT") || "Download Report"}

              <MdDownloadIcon />
            </button>

            {showReportMenu && (
              <div className="report-menu">
                {[
                  { label: t("TODAY") || "Today", key: "today" },
                  { label: t("THIS_WEEK") || "This Week", key: "week" },
                  { label: t("THIS_MONTH") || "This Month", key: "month" },
                ].map(({ label, key }) => (
                  <div key={key} className="menu-item" onClick={() => handlePresetDownload(key)}>
                    {label}
                  </div>
                ))}

                <div className="custom-date-trigger" onClick={() => setShowCustomPicker((p) => !p)}>
                  {t("CUSTOM_DATE") || "Custom Date"}
                </div>

                {showCustomPicker && (
                  <div className="custom-picker">
                    <div className="date-inputs">
                      <label>
                        <span>From</span>
                        <input type="date" value={customDate.from} onChange={(e) => setCustomDate({ ...customDate, from: e.target.value })} />
                      </label>
                      <label>
                        <span>To</span>
                        <input type="date" value={customDate.to} onChange={(e) => setCustomDate({ ...customDate, to: e.target.value })} />
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button
                        className="picker-cancel-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomPicker(false);
                          setCustomDate({ from: "", to: "" });
                        }}
                      >
                        {t("CANCEL") || "Cancel"}
                      </button>
                      <button
                        className="picker-apply-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomDownload();
                        }}
                      >
                        {t("APPLY") || "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="status-breakdown-content">
          {/* Chart */}
          <div className="chart-wrapper">
            <canvas ref={chartRef1} style={{ width: "100%", height: "100%" }} />

            <div className="chart-center">
              <div className="chart-percentage">{efficiency}%</div>
              <div className="chart-label">{t("EKYC_COMPLETE") || "Complete"}</div>
            </div>
          </div>

          {/* Status Boxes */}
          <div className="status-boxes">
            {legendItems.map((item) => (
              <div className="status-box" key={item.label} style={{ "--status-color": item.color }}>
                <div className="status-box-top">
                  <span className="status-indicator" style={{ backgroundColor: item.color }} />

                  <span className="status-name">{item.label}</span>
                </div>

                <div className="status-box-value">{formatNumber(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;
