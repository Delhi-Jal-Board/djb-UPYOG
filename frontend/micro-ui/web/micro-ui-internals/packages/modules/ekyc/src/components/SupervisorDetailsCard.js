import React, { Fragment, useState } from "react";
import { Card, Loader, Table, MdDownloadIcon } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";
import { getEkycExcelData } from "../utils/ekycExcelData";
import EkycFilterModal from "./EkycFilterModal";

const SupervisorDetailsCard = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId() || "dl.djb";
  const ownerIds = Digit.SessionStorage.get("User")?.info?.uuid;
  const { id: supervisorId } = useParams();
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [customDate, setCustomDate] = useState({ from: "", to: "" });
  const [ekycStatus, setEkycStatus] = useState("ALL");

  const { data, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE", ...(supervisorId ? { ids: supervisorId } : { ownerIds: ownerIds }) },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  const { supervisors: [supervisor] = [] } = data || {};

  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    { vendorId: supervisor?.vendorId, supervisorId: supervisorId || supervisor?.id },
    {
      enabled: !!tenantId && !!supervisor?.vendorId,
      keepPreviousData: true,
    }
  );

  const userRoles = Digit.UserService.getUser()?.info?.roles;

  const isSupervisor = userRoles?.some((role) => role.code === "EKYC_SUPERVISOR");

  const currentSupervisor = isSupervisor
    ? progressData?.supervisorReport[0] || []
    : progressData?.supervisorReport?.find((ele) => ele.supervisorId === supervisorId);

  const surveyorsData = currentSupervisor?.surveyors || [];

  const fullName = currentSupervisor?.supervisorName || "N/A";
  const mobileNumber = currentSupervisor?.mobileNo || "N/A";
  const email = supervisor?.owner?.emailId;
  const gender = supervisor?.owner?.gender;
  const status = supervisor?.status || "N/A";
  const assignedZone = t(currentSupervisor?.assignedZoneId) || "N/A";

  const vendorName = supervisor?.vendorName;

  const surveyors = supervisor?.surveyors || [];

  const cards = [
    {
      label: "TOTAL_EKYC_APPLICATIONS",
      count: progressData?.totalAssignments || 0,
      color: "#0B2559",
      type: "today",
      icon: <FaUsers />,
    },
    {
      label: "EKYC_SUBMITTED_TITLE",
      count: progressData?.submittedKnos || 0,
      color: "#10B981",
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: "PENDING_APPLICATIONS",
      count: progressData?.pendingKnos || 0,
      color: "#F59E0B",
      type: "pending",
      icon: <FaClock />,
    },
    {
      label: "OVERALL_PROGRESS",
      count: `${progressData?.overallProgressPercent || 0}%`,
      color: "#A855F7",
      type: "progress",
      icon: <FaChartLine />,
    },
  ];

  const surveyorColumns = [
    {
      Header: t("SURVEYOR_NAME") || "Surveyor Name",
      accessor: (row) => row?.surveyorName || "N/A",
      Cell: ({ row }) => {
        const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";
        const targetPath = `/digit-ui/${userType}/ekyc/surveyor-dashboard/${row.original.surveyorId}`;
        return (
          <a
            href={targetPath}
            style={{ color: "#1D70B8", fontWeight: "600", textDecoration: "none" }}
            onClick={(e) => {
              e.preventDefault();
              history.push(targetPath);
            }}
          >
            {row.original?.surveyorName || "N/A"}
          </a>
        );
      },
    },
    {
      Header: t("MOBILE_NUMBER") || "Mobile Number",
      accessor: (row) => row?.mobileNo || "N/A",
      id: "mobileNumber",
    },
    {
      Header: t("STATUS") || "Status",
      accessor: () => "ACTIVE",
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
  ];

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

  const isPageLoading = isProgressLoading || isSupervisorSearchLoading;

  if (isPageLoading && !supervisor) {
    return <Loader />;
  }

  if (!supervisor) {
    return (
      <Card>
        <div style={{ padding: "24px" }}>{t("NO_SUPERVISOR_FOUND")}</div>
      </Card>
    );
  }

  const handleDownloadEkycData = async (fromDate, toDate) => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        // Vendor-specific filter
        vendorId: supervisor?.vendorId,
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

  return (
    <Fragment>
      <Card className="surveyor-dashboard">
        {/* Header + Download Report */}
        <div className="ekyc-details-wrapper">
          <div className="details-top-row">
            <div className="detail-item first-row">
              <div className="ekyc-dashboard-header">
                <div className="header-content">
                  <h2 className="name">{fullName}</h2>
                  <div className="designation">({t("FIELD_SUPERVISOR") || "Field Supervisor"})</div>
                </div>
              </div>

              <div className="report-download relative">
                <button
                  disabled={ekycDownloadLoading}
                  className={`download-btn relative ${ekycDownloadLoading ? "disabled" : ""}`}
                  onClick={() => setShowFilterModal(true)}
                >
                  <MdDownloadIcon />
                  {ekycDownloadLoading ? t("DOWNLOADING") || "Downloading" : t("DOWNLOAD_REPORT") || "Download Report"}
                </button>
              </div>
            </div>
          </div>
          <div className="details-grid-row">
            <div className="detail-item">
              <span className="label">{t("VENDOR_NAME") || "Vendor Name"}</span>
              <span className="value">{vendorName}</span>
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

          {/* Bottom Row: Remaining Details */}
          <div className="details-grid-row">
            <div className="detail-item">
              <span className="label">{t("ASSIGNED_ZONE") || "Assigned Zone"}</span>
              <span className="value">
                {assignedZone && assignedZone !== "N/A" ? t(assignedZone.trim().toUpperCase()) || assignedZone : assignedZone}
              </span>
            </div>

            <div className="detail-item">
              <span className="label">{t("GENDER")}</span>
              <span className="value">{t(gender) || gender}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("STATUS")}</span>
              <span className="value">{status}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-wrapper">
          {cards.map((card, idx) => (
            <StatCard key={idx} title={t(card.label)} value={card.count} type={card.type} isLoading={isProgressLoading} icon={card.icon} />
          ))}
        </div>

        <div>
          <Table
            t={t}
            tableTitle={t("CONNECTED_SURVEYORS") || "Connected Surveyors"}
            tableClass="ekycTable"
            isTableScrollable={true}
            data={surveyorsData}
            columns={surveyorColumns}
            isLoading={isProgressLoading}
            totalRecords={surveyors.length}
            currentPage={currentPage}
            pageSizeLimit={pageSize}
            isPaginationRequired={true}
            onNextPage={() => {
              if (currentPage < Math.ceil(surveyors.length / pageSize) - 1) {
                setCurrentPage((prev) => prev + 1);
              }
            }}
            onPrevPage={() => {
              if (currentPage > 0) {
                setCurrentPage((prev) => prev - 1);
              }
            }}
            onFirstPage={() => {
              setCurrentPage(0);
            }}
            onLastPage={() => {
              setCurrentPage(Math.max(Math.ceil(surveyors.length / pageSize) - 1, 0));
            }}
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

export default SupervisorDetailsCard;
