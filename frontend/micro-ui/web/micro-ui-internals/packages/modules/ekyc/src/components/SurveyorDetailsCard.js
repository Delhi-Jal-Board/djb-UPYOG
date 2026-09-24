import React, { useMemo, useState, Fragment } from "react";
// import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

import { Card, SubmitBar, ActionBar, Menu, Loader, Table,MdDownloadIcon } from "@djb25/digit-ui-react-components";

import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import AssignEkycModal from "./AssignEkycModal";
import { getEkycExcelData } from "../utils/ekycExcelData";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";
import EkycFilterModal from "./EkycFilterModal";

const SurveyorDetailsCard = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [showModal, setShowModal] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [ekycDownloadLoading, setEkycDownloadLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [ekycStatus, setEkycStatus] = useState("ALL");

  const { id: surveyorId } = useParams();
  const ownerIds = Digit.SessionStorage.get("User")?.info?.uuid;

  const { t } = useTranslation();

  const { data: surveyorSearchById, isLoading: isLoadingId } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { ids: surveyorId },
    { enabled: !!surveyorId, staleTime: Infinity }
  );

  const hasFoundById = !!surveyorSearchById?.surveyors?.length;

  const { data: surveyorSearchByOwner, isLoading: isLoadingOwner } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    surveyorId ? { ownerIds: surveyorId } : { ownerIds },
    { enabled: !surveyorId || (!isLoadingId && !hasFoundById), staleTime: Infinity }
  );

  const surveyorSearchResponse = useMemo(() => {
    if (surveyorId && hasFoundById) {
      return surveyorSearchById;
    }
    return surveyorSearchByOwner;
  }, [surveyorId, hasFoundById, surveyorSearchById, surveyorSearchByOwner]);

  const isLoading = surveyorId ? isLoadingId || (isLoadingOwner && !hasFoundById) : isLoadingOwner;

  const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);

  const surveyor = useMemo(() => {
    return surveyorSearchResponse?.surveyors?.[0] || null;
  }, [surveyorSearchResponse]);

  const { data: vendorData, isLoading: isVendorLoading } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );
  const { data: supervisorSearchResponse, isLoading: isSupervisorSearchLoading } = Digit.Hooks.fsm.useSupervisorSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );
  const vendorName = useMemo(() => {
    if (surveyor?.vendorName) return surveyor.vendorName;
    if (!vendorData || !surveyor?.vendorId) return "N/A";
    const mappedVendor = vendorData.find((v) => v.dsoDetails?.id === surveyor.vendorId || v.dsoDetails?.vendorId === surveyor.vendorId);
    return mappedVendor?.dsoDetails?.name || surveyor.vendorId || "N/A";
  }, [vendorData, surveyor?.vendorId, surveyor?.vendorName]);

  const supervisorName = useMemo(() => {
    if (surveyor?.supervisorName) return surveyor.supervisorName;
    if (!supervisorSearchResponse?.supervisors || !surveyor?.supervisorId) return "N/A";
    const mappedSupervisor = supervisorSearchResponse.supervisors.find(
      (s) => s.id === surveyor.supervisorId || s.owner?.uuid === surveyor.supervisorId
    );
    return mappedSupervisor?.name || mappedSupervisor?.owner?.name || surveyor.supervisorId || "N/A";
  }, [supervisorSearchResponse, surveyor?.supervisorId, surveyor?.supervisorName]);
  const fullName = surveyor?.owner?.name || surveyor?.name || "N/A";

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const queryParams = {
    tenantId: "dl.djb",
    offset: currentPage * pageSize,
    limit: pageSize,
    surveyorId: surveyor?.owner?.uuid,
  };

  const { isFetching: isDashboardLoading, data: dashboardData = {}, refetch: refetchDashboard } = Digit.Hooks.ekyc.useEkycSurveyorDashboard(
    {},
    queryParams,
    {
      enabled: !!queryParams.tenantId && !!queryParams.surveyorId,
      keepPreviousData: true,
    }
  );

  const toTitleCase = (str) => {
    if (!str) return "";
    // Handle dot-notation values like "CONSUMERTYPE.INDIVIDUAL" → "Individual"
    const cleanStr = String(str).includes(".") ? String(str).split(".").pop() : String(str);
    return cleanStr
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const knoColumns = useMemo(
    () => [
      {
        Header: t("KNO") || "KNO",
        accessor: "kno",
      },
      {
        Header: t("CONSUMER_NAME") || "Consumer Name",
        accessor: (row) => toTitleCase(`${row.firstName || ""} ${row.middleName || ""} ${row.lastName || ""}`.trim()),
        id: "consumerName",
      },
      {
        Header: t("ZONE") || "Zone",
        accessor: (row) => toTitleCase(row.zoneName),
        id: "zoneName",
      },
      {
        Header: t("EKYC_STATUS") || "eKYC Status",
        accessor: "ekycStatus",
        Cell: ({ value }) => {
          const status = (value || "NA").toUpperCase();
          return value ? <span className={`ekyc-status-tag ${status}`}>{toTitleCase(value)}</span> : "-";
        },
      },
      {
        Header: t("SUBMITTED_AT") || "Submitted At",
        accessor: "submittedAt",
        Cell: ({ value }) => (value ? Digit.DateUtils.ConvertEpochToDate(value) : "-"),
      },
      {
        Header: t("ASSIGNED_AT") || "Assigned At",
        accessor: "assignedAt",
        Cell: ({ value }) => (value ? Digit.DateUtils.ConvertEpochToDate(value) : "-"),
      },
    ],
    [t]
  );

  const [customDate, setCustomDate] = useState({ from: "", to: "" });



  const isPageLoading = isLoading || isVendorLoading || isSupervisorSearchLoading;

  if (isPageLoading && !surveyor) {
    return <Loader />;
  }

  if (!surveyor) {
    return (
      <Card>
        <div style={{ padding: "24px" }}>{t("NO_SURVEYOR_FOUND")}</div>
      </Card>
    );
  }

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

  const options = [{ action: "Assign" }, { action: "EKYC_REASSIGN" }];

  const handleMenuSelect = (option) => {
    setShowOptions(false); // close menu
    setShowModal(option.action);
  };

  const closeModal = async () => {
    setShowModal(null);
  };

    const handleDownloadEkycData = async (fromDate, toDate) => {
    setEkycDownloadLoading(true);
    try {
      const response = await Digit.EkycService.application_list({
        tenantId: tenantId,
        offset: 0,
        limit: 10000,
        // Vendor-specific filter
        surveyorId: surveyor?.owner?.uuid,
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
      {/* Details */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-details-wrapper">
          <div className="details-top-row">
            <div className="detail-item first-row">
              <div className="ekyc-dashboard-header">
                <div className="header-content">
                  <h2 className="name">{fullName}</h2>
                  <div className="designation">({surveyor?.description || t("FIELD_SURVEYOR")})</div>
                  {/* <div className="employee-id">{t("EMPLOYEE_ID")}: {employeeId}</div> */}
                </div>
              </div>

              {/* Download Report — far right */}
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
              <span className="label">{t("SUPERVISOR_NAME") || "Supervisor Name"}</span>
              <span className="value">{supervisorName}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("MOBILE")}</span>
              <span className="value">{surveyor?.owner?.mobileNumber || surveyor?.mobileNo || "N/A"}</span>
            </div>
          </div>

          {/* Bottom Row: Remaining Details */}
          <div className="details-grid-row">
            <div className="detail-item">
              <span className="label">{t("EMAIL")}</span>
              <span className="value">{surveyor?.owner?.emailId || "N/A"}</span>
            </div>
            
            <div className="detail-item">
              <span className="label">{t("GENDER")}</span>
              <span className="value">{surveyor?.owner?.gender || "N/A"}</span>
            </div>

            <div className="detail-item">
              <span className="label">{t("STATUS")}</span>
              <span className="value">{surveyor?.status || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-wrapper">
        <StatCard
          title={t("TOTAL_ASSIGNED")}
          value={dashboardData?.dashboardInfo?.total || 0}
          type="today"
          isLoading={isDashboardLoading}
          icon={<FaUsers />}
        />
        <StatCard
          title={t("IN_PROGRESS")}
          value={dashboardData?.dashboardInfo?.inProgressCount || 0}
          type="week"
          isLoading={isDashboardLoading}
          icon={<FaCheckCircle />}
        />
        <StatCard
          title={t("PENDING")}
          value={dashboardData?.dashboardInfo?.pending || 0}
          type="pending"
          isLoading={isDashboardLoading}
          icon={<FaClock />}
        />
        <StatCard
          title={t("SUBMITTED")}
          value={dashboardData?.dashboardInfo?.submittedCount || 0}
          type="month"
          isLoading={isDashboardLoading}
          icon={<FaChartLine />}
        />
      </div>

      <div>
        <Table
          t={t}
          tableTitle={t("ASSIGNED_KNOS")}
          tableClass="ekycTable"
          isTableScrollable={true}
          data={dashboardData?.dashboardInfo?.consumerList || []}
          columns={knoColumns}
          isLoading={isDashboardLoading}
          totalRecords={dashboardData?.dashboardInfo?.total}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          showAutoSerialNo={true}
          isPaginationRequired={true}
          onNextPage={() => {
            const total = dashboardData?.dashboardInfo?.total || 0;
            if (currentPage < Math.ceil(total / pageSize) - 1) {
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
            const total = dashboardData?.dashboardInfo?.total || 0;
            setCurrentPage(Math.max(Math.ceil(total / pageSize) - 1, 0));
          }}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        />
      </div>
      {/* Actions */}
      {roles.includes("EKYC_SUPERVISOR") && (
        <ActionBar>
          <SubmitBar label={t("EKYC_ASSIGN_KNOS")} onSubmit={() => setShowOptions((prev) => !prev)} />

          {showOptions && (
            <Menu
              options={options}
              optionKey={"action"}
              t={t}
              onSelect={handleMenuSelect}
              style={{
                color: "#FFFFFF",
                fontSize: "18px",
              }}
            />
          )}
        </ActionBar>
      )}

      {showModal && (
        <AssignEkycModal surveyor={surveyor} isReassign={showModal === "EKYC_REASSIGN"} closeModal={closeModal} refetchDashboard={refetchDashboard} />
      )}
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

export default SurveyorDetailsCard;
