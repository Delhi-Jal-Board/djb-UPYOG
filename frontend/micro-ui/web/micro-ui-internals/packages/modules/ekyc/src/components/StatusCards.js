import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Chartjs from "chart.js/auto";
import { FaChartBar, MdDownloadIcon, Toast, DateRange } from "@djb25/digit-ui-react-components";
import EkycFilterModal from "./EkycFilterModal";
import { downloadEkycReport } from "../utils/ekycExcelData"

const getChartConstructor = () => {
  const C = Chartjs.Chart || Chartjs.default || Chartjs;
  return C;
};

const StatusCards = ({ countData, customDate, setCustomDate }) => {
  const { t } = useTranslation();
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [ekycStatus, setEkycStatus] = useState("ALL");

  const [toast, setToast] = useState({
    show: false,
    label: "",
    error: false,
  });

  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId || tenantId === "dl") {
    tenantId = "dl.djb";
  }
  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const fullName = loggedInUser?.name || "Admin";

  const showToast = ({ label, error = false }) => {
    setToast({
      show: true,
      label,
      error,
    });
  };

  const hideToast = () => {
    setToast({
      show: false,
      label: "",
      error: false,
    });
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

  const handleApplyFilters = async () => {
    setShowFilterModal(false);

    downloadEkycReport({
      tenantId,
      ekycStatus,
      fromDate: customDate?.startDate?.getTime(),
      toDate: customDate?.endDate?.getTime(),
      fileName: `eKYC_All_Data_Admin_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`,
      t,
      setLoading: setEkycDownloadLoading,
      showToast,
    });
  };

  return (
    <div className="ekyc-employee-container">
      <div className="status-panel">
        <div className="status-cards-header">
          <div className="status-card-title">
            <FaChartBar size={32} color="#fff" backgroundColor="#065297" style={{ paddingInline: "4px", borderRadius: "4px" }} />

            <h1 className="status-cards-h1">{t("EKYC_DASHBOARD_TITLE") || "eKYC Verification Dashboard"}</h1>
          </div>

          <div className="report-download relative">
            <DateRange
              values={customDate}
              t={t}
              hideLabel
              onFilterChange={(data) => {
                setCustomDate(data.range);
              }}
              emptyInitialDate={true}
            />
            <button
              className={`download-btn relative ${ekycDownloadLoading ? "disabled" : ""}`}
              disabled={ekycDownloadLoading}
              onClick={() => setShowFilterModal(true)}
            >
              <MdDownloadIcon />

              {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading" : t("DOWNLOAD_REPORT") || "Download Report"}
            </button>
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

      {showFilterModal && (
        <EkycFilterModal
          t={t}
          onClose={() => setShowFilterModal(false)}
          onApply={handleApplyFilters}
          customDate={customDate}
          setCustomDate={setCustomDate}
          ekycStatus={ekycStatus}
          setEkycStatus={setEkycStatus}
        />
      )}

      {toast.show && <Toast label={toast.label} error={toast.error} isDleteBtn duration={5000} onClose={hideToast} />}
    </div>
  );
};

export default StatusCards;
