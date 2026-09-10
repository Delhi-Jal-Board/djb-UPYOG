import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card, Loader, Table, MdDownloadIcon, FaDatabase, FaFileAlt } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { downloadVendorPDF } from "../utils/reportDownloader";
import { FaBuilding, FaUser, FaClock, FaChartLine } from "react-icons/fa";
import { getEkycExcelData } from "../utils/ekycExcelData";

const VendorDetailsCard = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
  const { vendorId } = useParams();

  const { data: { vendor: [vendor] = [] } = {}, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useVendorSearch({
    tenantId,
    filters: {
      status: "ACTIVE",
      ids: vendorId,
    },
    config: {
      enabled: !!tenantId,
      staleTime: 300000,
    },
  });

  // Match vendor details

  const targetVendorId = vendorId || vendor?.id || vendor?.vendorId;

  // Fetch assignment progress with hierarchy (supervisor and surveyor details) for target vendor
  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    targetVendorId ? { vendorId: targetVendorId } : {},
    {
      enabled: !!tenantId,
      keepPreviousData: true,
    }
  );

  const vendorName = vendor?.name || "N/A";
  const mobileNumber = vendor?.mobileNumber || vendor?.owner?.mobileNumber || "N/A";
  const email = vendor?.owner?.emailId || "N/A";
  // const status = vendor ? "ACTIVE" : "N/A";
  // const jurisdictions = useMemo(() => {
  //     if (Array.isArray(vendor?.jurisdictions)) {
  //         return vendor.jurisdictions.join(", ");
  //     }
  //     return "N/A";
  // }, [vendor]);
  const zoneIds = useMemo(() => {
    return vendor?.zoneIds?.length ? vendor.zoneIds.filter(Boolean).map((zone) => String(zone).trim().toUpperCase()) : [];
  }, [vendor]);

  // KPI stats calculation
  const cards = useMemo(() => {
    const totalKnos = progressData?.totalKnosInZones || 0;
    const totalAssignments = progressData?.totalKnos || 0;
    // const completedKnos = progressData?.submittedKnos || 0;
    const selfEkycCount = progressData?.selfEkycCountInZones || 0;
    const submittedKnos = progressData?.submittedKnosInZones || 0;
    const pendingKnos = progressData?.pendingKnosInZones || 0;
    const progressPercent = progressData?.overallProgressPercent || 0;

    return [
      {
        label: "TOTAL_KNOS",
        count: totalKnos,
        color: "#2563EB", // Blue
        type: "today",
        icon: <FaDatabase />,
      },
      {
        label: "TOTAL_EKYC_APPLICATIONS",
        count: totalAssignments,
        color: "#0891B2", // Cyan
        type: "today",
        icon: <FaFileAlt />,
      },
      // {
      //   label: "EKYC_SUBMITTED",
      //   count: completedKnos,
      //   color: "#10B981",
      //   type: "month",
      //   icon: <FaCheckCircle />,
      // },
      {
        label: "EKYC_SUBMITTED_BY_VENDORS",
        count: submittedKnos,
        color: "#0D9488", // Teal
        type: "month",
        icon: <FaBuilding />,
      },
      {
        label: "EKYC_SUBMITTED_BY_CITIZEN",
        count: selfEkycCount,
        color: "#7C3AED", // Purple
        type: "month",
        icon: <FaUser />,
      },
      {
        label: "PENDING_APPLICATIONS",
        count: pendingKnos,
        color: "#EA580C", // Orange
        type: "pending",
        icon: <FaClock />,
      },
      {
        label: "OVERALL_PROGRESS",
        count: `${progressPercent}%`,
        color: "#DB2777", // Pink
        type: "progress",
        icon: <FaChartLine />,
      },
    ];
  }, [vendor, progressData]);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  const handleDownloadEkycData = async (fromDate, toDate) => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        // Vendor-specific filter
        vendorId: targetVendorId,
        reportDownload: true,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });

      const consumerList = response?.consumerList || [];

      if (!consumerList || consumerList.length === 0) {
        alert(t("NO_EKYC_DATA_FOUND") || "No eKYC data found to download.");
        return;
      }
      const excelData = getEkycExcelData(consumerList, t);
      const cleanFileName = `eKYC_Data_${vendorName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      Digit.Download.Excel(excelData, cleanFileName);
    } catch (error) {
      console.error("Failed to download eKYC data:", error);
      alert(t("EKYC_DOWNLOAD_FAILED") || "Failed to download eKYC data. Please try again.");
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

  const supervisorColumns = useMemo(
    () => [
      {
        Header: t("SUPERVISOR_NAME") || "Supervisor Name",
        accessor: (row) => row?.original?.supervisorName || "N/A",
        Cell: ({ row }) => {
          const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";
          const targetPath = `/digit-ui/${userType}/ekyc/supervisor-dashboard/${row?.original?.supervisorId}`;

          return (
            <a
              href={targetPath}
              style={{ color: "#1D70B8", fontWeight: "600", textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                history.push(targetPath);
              }}
            >
              {row?.original?.supervisorName || "N/A"}
            </a>
          );
        },
      },
      {
        Header: t("MOBILE_NUMBER") || "Mobile Number",
        accessor: (row) => row?.mobileNo || "N/A",
        id: "mobileNo",
      },
      {
        Header: t("STATUS") || "Status",
        accessor: (row) => row?.status || "ACTIVE",
        id: "status",
        Cell: ({ value }) => <span className={`status-badge verified`}>{t(value) || value}</span>,
      },
      {
        Header: t("TOTAL_EKYC_APPLICATIONS") || "Total eKYC Applications",
        accessor: (row) => row?.totalKnos || 0,
        id: "totalEkycApplications",
      },
      {
        Header: t("EKYC_SUBMITTED") || "eKYC Completed",
        accessor: (row) => row?.submittedKnos || 0,
        id: "ekycCompleted",
      },
      {
        Header: t("PENDING_APPLICATIONS") || "Pending Applications",
        accessor: (row) => row?.pendingKnos || 0,
        id: "pendingApplications",
      },
      {
        Header: t("OVERALL_PROGRESS") || "Overall Progress",
        accessor: (row) => `${row?.progressPercent || 0}%`,
        id: "overallProgress",
      },
    ],
    [t, history]
  );

  // Report Download logic
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [customDate, setCustomDate] = useState({ from: "", to: "" });
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
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

  const handleDownload = () => {
    setReportLoading(true);
    try {
      const rowsWithStats = progressData?.supervisorReport.map((s) => ({
        name: s.supervisorName,
        mobileNo: s.mobileNo,
        total: s.totalKnos,
        completed: s.submittedKnos,
        pending: s.pendingKnos,
        progress: `${s.progressPercent || 0}%`,
      }));

      downloadVendorPDF({
        rows: rowsWithStats,
        vendorName,
        mobileNumber,
        email,
        dashboardInfo: {
          total: progressData?.totalKnosInZones,
          completed: progressData?.submittedKnosInZones + progressData?.selfEkycCountInZones,
          pending: progressData?.pendingKnosInZones,
          submittedCount: progressData?.submittedKnosInZones,
        },
        t,
      });
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setReportLoading(false);
    }
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

  const StatCard = ({ title, value, type, isLoading, icon }) => (
    <div className={`stat-card ${type}`}>
      {isLoading ? (
        <React.Fragment>
          <div className="stat-title skeleton skeleton-text"></div>
          <div className="stat-value skeleton skeleton-number"></div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {icon && <div className="stat-icon">{icon}</div>}
        </React.Fragment>
      )}
    </div>
  );

  const isPageLoading = isProgressLoading || isVendorSearchLoading;

  if (isPageLoading && !vendor) {
    return <Loader />;
  }

  if (!vendor) {
    return (
      <Card>
        <div style={{ padding: "24px" }}>{t("NO_VENDOR_FOUND") || "No Vendor Found"}</div>
      </Card>
    );
  }

  return (
    <Card className="surveyor-dashboard">
      {/* Header + Download Report */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-dashboard-header">
          <div className="avatar">{vendorName?.charAt(0)?.toUpperCase()}</div>

          <div className="header-content">
            <h2 className="name">{vendorName}</h2>
            <div className="designation">{t("VENDOR_AGENCY") || "Agency / Vendor"}</div>
          </div>
        </div>

        {/* Download Report — far right */}
        <div className="report-download">
          <button className="download-btn" disabled={reportLoading} onClick={handleDownload}>
            {reportLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_REPORT") || "Download Report"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-wrapper">
        {cards.map((card, idx) => (
          <StatCard key={idx} title={t(card.label)} value={card.count} type={card.type} isLoading={isPageLoading} icon={card.icon} />
        ))}
      </div>

      {/* Details */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-details-wrapper">
          {/* Top Row: Mobile, Email, and Download eKYC Data */}
          <div className="details-top-row">
            <div className="detail-item">
              <span className="label">{t("MOBILE")}</span>
              <span className="value">{mobileNumber}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("EMAIL")}</span>
              <span className="value">{email}</span>
            </div>

            <div className="download-card">
              <div>
                <h4>{t("DOWNLOAD_EKYC_DATA") || "Download eKYC Data"}</h4>
                <p>
                  {t("DOWNLOAD_EKYC_DATA_DESC") || "Export the complete eKYC verification records for your assigned jurisdiction into Excel format."}
                </p>
              </div>
              <div className="report-download" ref={reportMenuRef}>
                <button
                  className="download-excel-btn"
                  disabled={ekycDownloadLoading}
                  onClick={() => {
                    setShowReportMenu((p) => !p);
                    setShowCustomPicker(false);
                  }}
                >
                  <MdDownloadIcon />
                  {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading..." : t("DOWNLOAD_EXCEL") || "Download Excel"}
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
                            onClick={() => {
                              setShowCustomPicker(false);
                              setCustomDate({ from: "", to: "" });
                            }}
                          >
                            {t("CANCEL") || "Cancel"}
                          </button>
                          <button className="picker-apply-btn" onClick={handleCustomDownload}>
                            {t("APPLY") || "Apply"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Assigned Zones Full Width */}
          <div className="full-width-item">
            <span className="label">{t("ASSIGNED_ZONES") || "Assigned Zones"}</span>
            <span className="value">
              {zoneIds.length > 0 ? (
                <div className="selected-zones" style={{ marginTop: "4px", width: "100%", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {zoneIds.map((zone) => (
                    <span key={zone} className="selected-zone-chip">
                      {t(zone) || zone}
                    </span>
                  ))}
                </div>
              ) : (
                "N/A"
              )}
            </span>
          </div>
        </div>
      </div>

      <div>
        <Table
          t={t}
          tableTitle={t("CONNECTED_SUPERVISORS") || "Connected Supervisors"}
          tableClass="ekycTable"
          isTableScrollable={true}
          data={progressData?.supervisorReport}
          columns={supervisorColumns}
          isLoading={isProgressLoading}
          totalRecords={progressData?.supervisorReport?.length}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          isPaginationRequired={true}
          onNextPage={() => {
            if (currentPage < Math.ceil(progressData?.supervisorReport?.length / pageSize) - 1) {
              setCurrentPage((prev) => prev + 1);
            }
          }}
          onPrevPage={() => {
            if (currentPage > 0) {
              setCurrentPage((prev) => prev - 1);
            }
          }}
          onFirstPage={() => setCurrentPage(0)}
          onLastPage={() => setCurrentPage(Math.max(Math.ceil(progressData?.supervisorReport?.length / pageSize) - 1, 0))}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        />
      </div>
    </Card>
  );
};

export default VendorDetailsCard;
