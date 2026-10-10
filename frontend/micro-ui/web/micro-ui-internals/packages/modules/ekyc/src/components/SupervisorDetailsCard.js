import React, { Fragment, useState } from "react";
import { Card, Loader, Table, MdDownloadIcon, Toast, DateRange } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";
import EkycFilterModal from "./EkycFilterModal";
import { downloadEkycReport } from "../utils/ekycExcelData"

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
  const [toast, setToast] = useState({
    show: false,
    label: "",
    error: false,
  });
  const [filterDate,setFilterDate] = useState({ from: "", to: "" });

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

  const { data, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE", ...(supervisorId ? { ids: supervisorId } : { ownerIds: ownerIds }) },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  const { supervisors: [supervisor] = [] } = data || {};

  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    { vendorId: supervisor?.vendorId, supervisorId: supervisorId || supervisor?.id, fromDate: filterDate?.startDate?.getTime(), toDate: filterDate?.endDate?.getTime() },
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
      count: currentSupervisor?.totalKnos || 0,
      color: "#0B2559",
      type: "today",
      icon: <FaUsers />,
    },
    {
      label: "EKYC_SUBMITTED_TITLE",
      count: currentSupervisor?.submittedKnos || 0,
      color: "#10B981",
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: "PENDING_APPLICATIONS",
      count: currentSupervisor?.pendingKnos || 0,
      color: "#F59E0B",
      type: "pending",
      icon: <FaClock />,
    },
    {
      label: "OVERALL_PROGRESS",
      count: `${currentSupervisor?.overallProgressPercent || 0}%`,
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

  const handleApplyFilters = async () => {
    setShowFilterModal(false);
    downloadEkycReport({
      tenantId,
      ekycStatus,
      fromDate: customDate?.startDate?.getTime(),
      toDate: customDate?.endDate?.getTime(),
      fileName: `eKYC_Data_${fullName.replace(/[^a-zA-Z0-9]/g, "_")}`,
      t,
      setLoading: setEkycDownloadLoading,
      showToast,
    });
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
                <DateRange
                  values={filterDate}
                  t={t}
                  hideLabel
                  onFilterChange={(data) => {
                    setFilterDate(data.range);
                  }}
                  emptyInitialDate={true}
                />
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
      {toast.show && <Toast label={toast.label} error={toast.error} isDleteBtn duration={5000} onClose={hideToast} />}
    </Fragment>
  );
};

export default SupervisorDetailsCard;
