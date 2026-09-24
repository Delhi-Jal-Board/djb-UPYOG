import React, { Fragment, useMemo, useState } from "react";
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
  const { id: supervisorId, vendorId } = useParams();
  const loggedInUser = Digit.SessionStorage.get("User")?.info;
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [ekycStatus, setEkycStatus] = useState("ALL");

  // Fetch all supervisors to get details if assignment progress fails
  const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  // Resolve vendorId of this supervisor if available
  const targetVendorId = useMemo(() => {
    const targetId = supervisorId || loggedInUser?.uuid;
    if (!targetId || !supervisorSearchResponse?.supervisors) return null;
    const matchedSup = supervisorSearchResponse.supervisors.find(
      (s) => s.id?.toLowerCase() === targetId?.toLowerCase() || s.owner?.uuid?.toLowerCase() === targetId?.toLowerCase()
    );
    return matchedSup?.vendorId || null;
  }, [supervisorId, loggedInUser, supervisorSearchResponse]);

  // Fetch assignment progress with hierarchy (supervisor and surveyor details)
  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    { vendorId: vendorId || targetVendorId },
    {
      enabled: !!tenantId,
      keepPreviousData: true,
    }
  );

  const userRoles = Digit.UserService.getUser()?.info?.roles;

  const isSupervisor = userRoles?.some((role) => role.code === "EKYC_SUPERVISOR");

  const currentSupervisor = isSupervisor
    ? progressData?.supervisorReport[0] || []
    : progressData?.supervisorReport?.find((ele) => ele.supervisorId === supervisorId);

  const surveyorsData = currentSupervisor?.surveyors || [];

  // Fetch all surveyors to get details of connected surveyors if assignment progress fails
  const { data: surveyorSearchResponse, isLoading: isSurveyorSearchLoading } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  // Fetch all vendors from DSO search
  const { data: vendorSearchResponse, isLoading: isVendorSearchLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  const supervisor = useMemo(() => {
    const targetOwnerOrId = supervisorId || loggedInUser?.uuid;
    if (!targetOwnerOrId) return null;

    // Step 0: resolve real supervisor entity id (handles self-login case
    // where we only have the owner/auth uuid, not the supervisor record id)
    let resolvedSupervisorId = supervisorId; // if URL already has entity id, trust it
    if (!resolvedSupervisorId && supervisorSearchResponse?.supervisors && targetOwnerOrId) {
      const selfSup = supervisorSearchResponse.supervisors.find(
        (s) => s.owner?.uuid?.toLowerCase() === targetOwnerOrId?.toLowerCase() || s.id?.toLowerCase() === targetOwnerOrId?.toLowerCase()
      );
      resolvedSupervisorId = selfSup?.id;
    }

    const targetId = resolvedSupervisorId || targetOwnerOrId;

    // 1. Find the supervisor profile from search response
    let matchedSup = null;
    if (supervisorSearchResponse?.supervisors) {
      matchedSup = supervisorSearchResponse.supervisors.find(
        (s) => s.id?.toLowerCase() === targetId?.toLowerCase() || s.owner?.uuid?.toLowerCase() === targetId?.toLowerCase()
      );
    }

    // 2. Find progress report for this supervisor from progressData
    let progressReport = null;
    if (progressData?.supervisorReport && targetId) {
      progressReport = progressData.supervisorReport.find(
        (s) => s.supervisorId?.toLowerCase() === targetId?.toLowerCase() || s.id?.toLowerCase() === targetId?.toLowerCase()
      );
    }

    // 3. If we found the supervisor in search response, enrich and return
    if (matchedSup) {
      const matchedSurveyors = surveyorSearchResponse?.surveyors
        ? surveyorSearchResponse.surveyors
            .filter((surv) => surv.supervisorId === (matchedSup.id || matchedSup.owner?.uuid))
            .map((surv) => {
              let realStats = null;
              if (progressData?.supervisorReport) {
                for (const report of progressData.supervisorReport) {
                  if (
                    report.supervisorId?.toLowerCase() !== matchedSup.id?.toLowerCase() &&
                    report.id?.toLowerCase() !== matchedSup.id?.toLowerCase()
                  )
                    continue;
                  const matchedSurv = report.surveyors?.find(
                    (s) =>
                      (s.surveyorId &&
                        (s.surveyorId?.toLowerCase() === surv.id?.toLowerCase() ||
                          s.surveyorId?.toLowerCase() === surv.owner?.uuid?.toLowerCase())) ||
                      (s.id && (s.id?.toLowerCase() === surv.id?.toLowerCase() || s.id?.toLowerCase() === surv.owner?.uuid?.toLowerCase()))
                  );
                  if (matchedSurv) {
                    realStats = matchedSurv;
                    break;
                  }
                }
              }

              return {
                surveyorId: surv.id || surv.owner?.uuid,
                surveyorName: surv.name || surv.owner?.name || "N/A",
                mobileNo: surv.owner?.mobileNumber || surv.mobileNo || "N/A",
                email: surv.owner?.emailId || "N/A",
                gender: surv.owner?.gender || "N/A",
                status: surv.status || "ACTIVE",
                totalKnos: realStats?.totalKnos || 0,
                submittedKnos: realStats?.submittedKnos || 0,
                pendingKnos: realStats?.pendingKnos || 0,
                progressPercent: realStats?.progressPercent || 0,
              };
            })
        : [];

      const totalKnos = progressReport?.totalKnos || matchedSurveyors.reduce((acc, s) => acc + (s.totalKnos || 0), 0);
      const submittedKnos = progressReport?.submittedKnos || matchedSurveyors.reduce((acc, s) => acc + (s.submittedKnos || 0), 0);
      const pendingKnos = progressReport?.pendingKnos || matchedSurveyors.reduce((acc, s) => acc + (s.pendingKnos || 0), 0);
      const progressPercent = progressReport ? progressReport.progressPercent : totalKnos > 0 ? Math.round((submittedKnos / totalKnos) * 100) : 0;

      return {
        supervisorId: matchedSup.id || matchedSup.owner?.uuid,
        supervisorName: matchedSup.name || matchedSup.owner?.name || "N/A",
        mobileNo: matchedSup.owner?.mobileNumber || matchedSup.mobileNo || "N/A",
        email: matchedSup.owner?.emailId || matchedSup.owner?.email || matchedSup.email || matchedSup.emailId || "N/A",
        gender: matchedSup.owner?.gender || matchedSup.gender || "N/A",
        status: matchedSup.status || "ACTIVE",
        assignedZoneId: matchedSup.assignedZoneId || "N/A",
        vendorId: matchedSup.vendorId,
        surveyors: matchedSurveyors,
        totalKnos,
        submittedKnos,
        pendingKnos,
        progressPercent,
      };
    }

    // 4. Fallback: If not found in search response, but we have progressData report, return it and enrich with loggedInUser details
    if (progressReport) {
      const isSelf = targetId?.toLowerCase() === loggedInUser?.uuid?.toLowerCase();
      const supervisorName = isSelf ? loggedInUser?.name || progressReport.supervisorName || "N/A" : progressReport.supervisorName || "N/A";
      const mobileNo = isSelf ? loggedInUser?.mobileNumber || progressReport.mobileNo || "N/A" : progressReport.mobileNo || "N/A";

      const matchedSupForFallback = supervisorSearchResponse?.supervisors?.find(
        (s) =>
          s.id?.toLowerCase() === (progressReport.supervisorId || progressReport.id)?.toLowerCase() ||
          s.owner?.uuid?.toLowerCase() === (progressReport.supervisorId || progressReport.id)?.toLowerCase()
      );

      const email =
        matchedSupForFallback?.owner?.emailId ||
        matchedSupForFallback?.owner?.email ||
        matchedSupForFallback?.email ||
        (isSelf ? loggedInUser?.emailId : null) ||
        progressReport.email ||
        "N/A";
      const gender =
        matchedSupForFallback?.owner?.gender ||
        matchedSupForFallback?.gender ||
        (isSelf ? loggedInUser?.gender : null) ||
        progressReport.gender ||
        "N/A";

      const surveyorsMapped = progressReport.surveyors
        ? progressReport.surveyors.map((surv) => {
            const matchedSurv = surveyorSearchResponse?.surveyors?.find(
              (s) => s.id?.toLowerCase() === surv.surveyorId?.toLowerCase() || s.owner?.uuid?.toLowerCase() === surv.surveyorId?.toLowerCase()
            );

            return {
              surveyorId: surv.surveyorId || surv.id,
              surveyorName: matchedSurv?.name || matchedSurv?.owner?.name || surv.surveyorName || "N/A",
              mobileNo: matchedSurv?.owner?.mobileNumber || matchedSurv?.mobileNo || surv.mobileNo || "N/A",
              email: matchedSurv?.owner?.emailId || matchedSurv?.owner?.email || matchedSurv?.email || surv.email || "N/A",
              gender: matchedSurv?.owner?.gender || matchedSurv?.gender || surv.gender || "N/A",
              status: matchedSurv?.status || surv.status || "ACTIVE",
              totalKnos: surv.totalKnos || 0,
              submittedKnos: surv.submittedKnos || 0,
              pendingKnos: surv.pendingKnos || 0,
              progressPercent: surv.progressPercent || 0,
            };
          })
        : [];

      return {
        supervisorId: progressReport.supervisorId || progressReport.id,
        supervisorName,
        mobileNo,
        email,
        gender,
        status: progressReport.status || "ACTIVE",
        assignedZoneId: progressReport.assignedZoneId || "N/A",
        vendorId: progressReport.vendorId,
        surveyors: surveyorsMapped,
        totalKnos: progressReport.totalKnos || 0,
        submittedKnos: progressReport.submittedKnos || 0,
        pendingKnos: progressReport.pendingKnos || 0,
        progressPercent: progressReport.progressPercent || 0,
      };
    }

    return null;
  }, [progressData, supervisorSearchResponse, surveyorSearchResponse, supervisorId, loggedInUser]);

  const fullName = currentSupervisor?.supervisorName || "N/A";
  const mobileNumber = currentSupervisor?.mobileNo || "N/A";
  const email = supervisor?.email || (supervisor?.supervisorId === loggedInUser?.uuid ? loggedInUser?.emailId : null) || "N/A";
  const gender = supervisor?.gender || (supervisor?.supervisorId === loggedInUser?.uuid ? loggedInUser?.gender : null) || "N/A";
  const status = supervisor?.status || "N/A";
  const assignedZone = t(currentSupervisor?.assignedZoneId) || "N/A";

  const vendorName = useMemo(() => {
    if (!vendorSearchResponse || !supervisor) return "N/A";
    const targetVendorId = supervisor.vendorId;
    if (!targetVendorId) return "N/A";
    const matchedVendor = vendorSearchResponse.find(
      (v) =>
        v.dsoDetails?.id === targetVendorId || v.dsoDetails?.vendorId === targetVendorId || v.id === targetVendorId || v.vendorId === targetVendorId
    );
    return matchedVendor?.dsoDetails?.name || matchedVendor?.name || "N/A";
  }, [vendorSearchResponse, supervisor]);

  const surveyors = useMemo(() => {
    return supervisor?.surveyors || [];
  }, [supervisor]);

  const cards = useMemo(
    () => [
      {
        label: "TOTAL_EKYC_APPLICATIONS",
        count: supervisor?.totalKnos || 0,
        color: "#0B2559",
        type: "today",
        icon: <FaUsers />,
      },
      {
        label: "EKYC_SUBMITTED_TITLE",
        count: supervisor?.submittedKnos || 0,
        color: "#10B981",
        type: "month",
        icon: <FaCheckCircle />,
      },
      {
        label: "PENDING_APPLICATIONS",
        count: supervisor?.pendingKnos || 0,
        color: "#F59E0B",
        type: "pending",
        icon: <FaClock />,
      },
      {
        label: "OVERALL_PROGRESS",
        count: `${supervisor?.progressPercent || 0}%`,
        color: "#A855F7",
        type: "progress",
        icon: <FaChartLine />,
      },
    ],
    [supervisor]
  );
  const surveyorColumns = useMemo(
    () => [
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
    ],
    [t, history]
  );

  // Report Download logic
  const [customDate, setCustomDate] = useState({ from: "", to: "" });

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

  const isPageLoading = isProgressLoading || isSupervisorSearchLoading || isSurveyorSearchLoading || isVendorSearchLoading;

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
