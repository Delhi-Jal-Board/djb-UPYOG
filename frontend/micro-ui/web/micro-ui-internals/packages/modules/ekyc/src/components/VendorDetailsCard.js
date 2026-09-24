import React, { useMemo, useState, useRef, useEffect, Fragment } from "react";
import { Card, Loader, Table, MdDownloadIcon, FaDatabase, FaFileAlt } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { FaBuilding, FaUser, FaClock, FaChartLine } from "react-icons/fa";
import { getEkycExcelData } from "../utils/ekycExcelData";
import EkycFilterModal from "./EkycFilterModal";

const VendorDetailsCard = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
  const { vendorId } = useParams();
  const loggedInUser = Digit.SessionStorage.get("User")?.info;

  const targetVendorId = vendorId || loggedInUser?.uuid;
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [ekycStatus, setEkycStatus] = useState("ALL");

  const { data: { vendor: [vendor] = [] } = {}, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useVendorSearch({
    tenantId,
    filters: {
      status: "ACTIVE",
      ids: targetVendorId,
    },
    config: {
      enabled: !!tenantId,
      staleTime: 300000,
    },
  });

  // Fetch assignment progress with hierarchy (supervisor and surveyor details) for target vendor
  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    { vendorId: targetVendorId },
    {
      enabled: !!tenantId,
      keepPreviousData: true,
    }
  );

  const vendorName = vendor?.name || "N/A";
  const mobileNumber = vendor?.mobileNumber || vendor?.owner?.mobileNumber || "N/A";
  const email = vendor?.owner?.emailId || "N/A";
  const gender = vendor?.owner?.gender || "N/A";
  const ownerName = vendor?.owner?.name || "N/A";
  
  const zoneIds = useMemo(() => {
    return vendor?.zoneIds?.length ? vendor.zoneIds.filter(Boolean).map((zone) => String(zone).trim().toUpperCase()) : [];
  }, [vendor]);

  // KPI stats calculation
  const cards = [
    {
      label: "TOTAL_KNOS",
      count: progressData?.totalKnosInZones || 0,
      color: "#2563EB", // Blue
      type: "today",
      icon: <FaDatabase />,
    },
    {
      label: "TOTAL_EKYC_APPLICATIONS",
      count: progressData?.totalAssignments || 0,
      color: "#0891B2", // Cyan
      type: "today",
      icon: <FaFileAlt />,
    },
    // {
    //   label: "EKYC_SUBMITTED",
    //   count: progressData?.submittedKnos || 0,
    //   color: "#10B981",
    //   type: "month",
    //   icon: <FaCheckCircle />,
    // },
    {
      label: "EKYC_SUBMITTED_BY_VENDORS",
      count: progressData?.submittedKnosInZones || 0,
      color: "#0D9488", // Teal
      type: "month",
      icon: <FaBuilding />,
    },
    {
      label: "EKYC_SUBMITTED_BY_CITIZEN",
      count: progressData?.selfEkycCountInZones || 0,
      color: "#7C3AED", // Purple
      type: "month",
      icon: <FaUser />,
    },
    {
      label: "PENDING_APPLICATIONS",
      count: progressData?.pendingKnosInZones || 0,
      color: "#EA580C", // Orange
      type: "pending",
      icon: <FaClock />,
    },
    {
      label: "OVERALL_PROGRESS",
      count: `${progressData?.overallProgressPercent || 0}%`,
      color: "#DB2777", // Pink
      type: "progress",
      icon: <FaChartLine />,
    },
  ];

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);

  const handleDownloadEkycData = async (fromDate, toDate) => {
    console.log(ekycStatus, fromDate, toDate);
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        // Vendor-specific filter
        vendorId: targetVendorId,
        ekycStatus: ekycStatus,
        reportDownload: true,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });

      const consumerList = response?.consumerList || [];

      if (!consumerList || consumerList.length === 0) {
        alert(t("NO_EKYC_DATA_FOUND") || "No eKYC data found to download.");
        return;
      }

      consumerList.forEach((item) => {
        if (item.assignedTime) {
          item.assignedTime = new Date(item.assignedTime).toLocaleDateString("en-GB");
        }

        if (item.submittedAt) {
          item.submittedAt = new Date(item.submittedAt).toLocaleDateString("en-GB");
        }
      });
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

  const handleApplyFilters = async () => {
    setShowFilterModal(false);
    await handleDownloadEkycData(customDate.startDate.getTime(), customDate.endDate.getTime());
  };

  const supervisorColumns = [
    {
      Header: t("SUPERVISOR_NAME") || "Supervisor Name",
      accessor: (row) => row?.original?.supervisorName || "N/A",
      Cell: ({ row }) => {
        console.log(row)
        const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";
        const targetPath = `/digit-ui/${userType}/ekyc/supervisor-dashboard/${row?.original?.supervisorId}/${row?.original?.vendorId}`;

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
      Header: t("ASSIGNED_ZONE") || "Assigned Zone",
      accessor: (row) => row?.assignedZoneId || "",
      id: "zone",
      Cell: ({ value }) => t(value) || value,
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
  ];

  // Report Download logic
  const [customDate, setCustomDate] = useState("");
  const reportMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target)) {
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <Fragment>
      <Card className="surveyor-dashboard">
        {/* Header + Download Report */}
        <div className="ekyc-dashboard-section">
          <div className="ekyc-details-wrapper">
            <div className="details-top-row">
              <div className="detail-item first-row">
                <div className="ekyc-dashboard-header">
                  <div className="header-content">
                    <h2 className="name">{vendorName}</h2>
                    <div className="designation">({t("VENDOR_AGENCY") || "Agency / Vendor"})</div>
                  </div>
                </div>

                {/* Download Report — far right */}
                <div className="report-download relative">
                  <button
                    disabled={ekycDownloadLoading}
                    className={`download-btn relative ${ekycDownloadLoading ? "disabled" : ""}`}
                    onClick={() => setShowFilterModal(true)}
                  >
                    <MdDownloadIcon />{ekycDownloadLoading ? t("DOWNLOADING") || "Downloading": t("DOWNLOAD_REPORT") || "Download Report"}
                  </button>
                </div>
              </div>
            </div>
            <div className="details-top-row">
              <div className="detail-item">
                <span className="label">{t("NAME")}</span>
                <span className="value">{ownerName}</span>
              </div>
              <div className="detail-item">
                <span className="label">{t("GENDER")}</span>
                <span className="value">{gender}</span>
              </div>
              <div className="detail-item">
                <span className="label">{t("MOBILE")}</span>
                <span className="value">{mobileNumber}</span>
              </div>

              <div className="detail-item">
                <span className="label">{t("EMAIL")}</span>
                <span className="value">{email}</span>
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

        {/* Stats */}
        <div className="stats-wrapper">
          {cards.map((card, idx) => (
            <StatCard key={idx} title={t(card.label)} value={card.count} type={card.type} isLoading={isPageLoading} icon={card.icon} />
          ))}
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
    </Fragment>
  );
};

export default VendorDetailsCard;
