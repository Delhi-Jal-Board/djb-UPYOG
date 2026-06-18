import React, { useMemo, useState, useRef, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

import { Card, SubmitBar, ActionBar, Menu, Loader, Table } from "@djb25/digit-ui-react-components";

import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import AssignEkycModal from "./AssignEkycModal";
import { downloadSurveyorPDF } from "../utils/reportDownloader";

const SurveyorDetailsDashboard = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [showModal, setShowModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const { id: surveyorId } = useParams();
  const ownerIds = Digit.SessionStorage.get("User")?.info?.uuid;

  const { t } = useTranslation();

  const searchParams = surveyorId ? { ids: surveyorId } : { ownerIds };

  const { data: surveyorSearchResponse, isLoading } = Digit.Hooks.fsm.useSurveyorSearch(tenantId, searchParams, { staleTime: Infinity });

  const roles = Digit.SessionStorage.get("User")?.info?.roles.map((ele) => ele.code);

  const surveyor = useMemo(() => {
    return surveyorSearchResponse?.surveyors?.[0] || null;
  }, [surveyorSearchResponse]);

  const { data: vendorData } = Digit.Hooks.fsm.useDsoSearch(tenantId, { status: "ACTIVE" }, { enabled: !!tenantId });
  const { data: supervisorSearchResponse } = Digit.Hooks.fsm.useSupervisorSearch(tenantId, { status: "ACTIVE" }, { enabled: !!tenantId });

  const vendorName = useMemo(() => {
    if (!vendorData || !surveyor?.vendorId) return "N/A";
    const mappedVendor = vendorData.find((v) => v.dsoDetails?.id === surveyor.vendorId || v.dsoDetails?.vendorId === surveyor.vendorId);
    return mappedVendor?.dsoDetails?.name || surveyor.vendorId || "N/A";
  }, [vendorData, surveyor?.vendorId]);

  const supervisorName = useMemo(() => {
    if (!supervisorSearchResponse?.supervisors || !surveyor?.supervisorId) return "N/A";
    const mappedSupervisor = supervisorSearchResponse.supervisors.find((s) => s.id === surveyor.supervisorId || s.owner?.uuid === surveyor.supervisorId);
    return mappedSupervisor?.name || mappedSupervisor?.owner?.name || surveyor.supervisorId || "N/A";
  }, [supervisorSearchResponse, surveyor?.supervisorId]);

  const fullName = surveyor?.owner?.name || surveyor?.name || "N/A";
  const employeeId = surveyor?.employeeId || surveyor?.owner?.uuid || surveyor?.id;
  const mobileNumber = surveyor?.owner?.mobileNumber || surveyor?.mobileNo || "N/A";

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

  const knoColumns = useMemo(
    () => [
      {
        Header: "KNO",
        accessor: "kno",
      },
      {
        Header: "Consumer Name",
        accessor: (row) => `${row.firstName || ""} ${row.middleName || ""} ${row.lastName || ""}`.trim(),
        id: "consumerName",
      },
      {
        Header: "Zone",
        accessor: "zoneName",
      },
      {
        Header: "Pincode",
        accessor: "pincode",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span className={`status-badge ${value === "ACTIVE" ? "verified" : value === "PENDING" ? "pending" : "assigned"}`}>{value}</span>
        ),
      },
      {
        Header: "eKYC Status",
        accessor: "ekycStatus",
        Cell: ({ value }) => value || "-",
      },
    ],
    []
  );

  // ─── Download Report hooks (must be before any early returns) ───────

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

  if (isLoading) {
    return <Loader />;
  }

  if (!surveyor) {
    return (
      <Card>
        <div style={{ padding: "24px" }}>{t("NO_SURVEYOR_FOUND")}</div>
      </Card>
    );
  }

  const weeklyData = [
    { day: "Mon", completed: 4 },
    { day: "Tue", completed: 6 },
    { day: "Wed", completed: 3 },
    { day: "Thu", completed: 8 },
    { day: "Fri", completed: 5 },
    { day: "Sat", completed: 7 },
    { day: "Sun", completed: 2 },
  ];

  const statusData = [
    {
      name: "Completed",
      value: surveyor?.completedCases || 0,
      color: "#10B981",
    },
    {
      name: "Pending",
      value: surveyor?.pendingCases || 0,
      color: "#F59E0B",
    },
    {
      name: "Rejected",
      value: surveyor?.rejectedCases || 0,
      color: "#EF4444",
    },
  ];

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

  const handlePresetDownload = (filter) => {
    const allRows = dashboardData?.dashboardInfo?.consumerList || [];

    const range = getDateRange(filter);

    if (!range) return;

    const filtered = allRows.filter((r) => {
      const ts =
        r.submittedAt ||
        r.createdTime ||
        r.lastModifiedTime ||
        0;

      return ts >= range.from.getTime() && ts <= range.to.getTime();
    });

    downloadSurveyorPDF({
      rows: filtered.length ? filtered : allRows,
      surveyorName: fullName,
      vendorName,
      supervisorName,
      employeeId,
      mobileNumber,
      dashboardInfo: dashboardData?.dashboardInfo,
      t,
    });

    setShowReportMenu(false);
    setShowCustomPicker(false);
  };

  const handleCustomDownload = () => {
    if (!customDate.from || !customDate.to) {
      alert(t("SELECT_DATE_RANGE") || "Please select both From and To dates.");
      return;
    }
    const from = new Date(customDate.from);
    const to = new Date(customDate.to);
    to.setHours(23, 59, 59, 999);
    const allRows = dashboardData?.dashboardInfo?.consumerList || [];
    const filtered = allRows.filter((r) => {
      const ts = r.createdTime || r.lastModifiedTime || 0;
      return ts >= from.getTime() && ts <= to.getTime();
    });
    downloadSurveyorPDF({
      rows: filtered.length ? filtered : allRows,
      surveyorName: fullName,
      vendorName,
      supervisorName,
      employeeId,
      mobileNumber,
      dashboardInfo: dashboardData?.dashboardInfo,
      t,
    });
    setShowReportMenu(false);
    setShowCustomPicker(false);
  };

  const StatCard = ({ title, value, type, isLoading }) => (
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
        </React.Fragment>
      )}
    </div>
  );

  const options = [{ action: "Assign" }];

  const handleMenuSelect = (option) => {
    setShowOptions(false); // close menu
    setShowModal(true);
  };

  const closeModal = async () => {
    setShowModal(false);
  };

  return (
    <Card className="surveyor-dashboard">
      {/* Header + Download Report */}
      <div className="ekyc-dashboard-section">
        <div className="ekyc-dashboard-header">
          <div className="avatar">{fullName?.charAt(0)?.toUpperCase()}</div>

          <div className="header-content">
            <h2 className="name">{fullName}</h2>

            <div className="designation">{surveyor?.description || t("FIELD_SURVEYOR")}</div>

            <div className="employee-id">
              {t("EMPLOYEE_ID")}: {employeeId}
            </div>
          </div>
        </div>

        {/* Download Report — far right */}
        <div className="report-download" ref={reportMenuRef}>
          <button
            className="download-btn"
            onClick={() => {
              setShowReportMenu((p) => !p);
              setShowCustomPicker(false);
            }}
          >
            {t("DOWNLOAD_REPORT") || "Download Report"}
          </button>

          {showReportMenu && (
            <div className="report-menu">
              {[
                { label: t("TODAY") || "Today", key: "today" },
                { label: t("THIS_WEEK") || "This Week", key: "week" },
                { label: t("THIS_MONTH") || "This Month", key: "month" },
              ].map(({ label, key }) => (
                <div
                  key={key}
                  className="menu-item"
                  onClick={() => handlePresetDownload(key)}
                >
                  {label}
                </div>
              ))}

              <div
                className="custom-date-trigger"
                onClick={() => setShowCustomPicker((p) => !p)}
              >
                {t("CUSTOM_DATE") || "Custom Date"}
              </div>

              {showCustomPicker && (
                <div className="custom-picker">
                  <div className="date-field">
                    <label className="date-label">
                      {t("FROM_DATE") || "From"}
                    </label>
                    <input
                      type="date"
                      className="date-input"
                      value={customDate.from}
                      onChange={(e) =>
                        setCustomDate((d) => ({ ...d, from: e.target.value }))
                      }
                    />
                  </div>

                  <div className="date-field">
                    <label className="date-label">
                      {t("TO_DATE") || "To"}
                    </label>
                    <input
                      type="date"
                      className="date-input"
                      value={customDate.to}
                      onChange={(e) =>
                        setCustomDate((d) => ({ ...d, to: e.target.value }))
                      }
                    />
                  </div>

                  <button
                    className="download-action-btn"
                    onClick={handleCustomDownload}
                  >
                    {t("DOWNLOAD") || "Download"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-wrapper">
        <StatCard title={t("TOTAL_ASSIGNED")} value={dashboardData?.dashboardInfo?.total || 0} type="today" isLoading={isDashboardLoading} />
        <StatCard title={t("COMPLETED")} value={dashboardData?.dashboardInfo?.completed || 0} type="week" isLoading={isDashboardLoading} />
        <StatCard title={t("PENDING")} value={dashboardData?.dashboardInfo?.pending || 0} type="pending" isLoading={isDashboardLoading} />
        <StatCard title={t("SUBMITTED")} value={dashboardData?.dashboardInfo?.submittedCount || 0} type="month" isLoading={isDashboardLoading} />
      </div>

      {/* Charts */}
      <div className="charts-wrapper">
        {/* Weekly Chart */}
        <div className="chart-card">
          <h3 className="chart-title">{t("WEEKLY_SURVEY_PROGRESS")}</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="completed" fill="#0B2559" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h3 className="chart-title">{t("CASE_DISTRIBUTION")}</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Details */}
      <div className="ekyc-dashboard-section">
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">{t("MOBILE")}:</span>
            <span className="value">{surveyor?.owner?.mobileNumber || surveyor?.mobileNo || "N/A"}</span>
          </div>

          <div className="detail-item">
            <span className="label">{t("EMAIL")}:</span>
            <span className="value">{surveyor?.owner?.emailId || "N/A"}</span>
          </div>

          <div className="detail-item">
            <span className="label">{t("GENDER")}:</span>
            <span className="value">{surveyor?.owner?.gender || "N/A"}</span>
          </div>

          <div className="detail-item">
            <span className="label">{t("STATUS")}:</span>
            <span className="value">{surveyor?.status || "N/A"}</span>
          </div>

          <div className="detail-item">
            <span className="label">{t("SERVICE_TYPE")}:</span>
            <span className="value">{surveyor?.additionalDetails?.serviceType || "N/A"}</span>
          </div>

          <div className="detail-item">
            <span className="label">{t("VENDOR_ID")}:</span>
            <span className="value">{surveyor?.vendorId || "N/A"}</span>
          </div>
        </div>
      </div>
      <Card className="dashboard-card">
        <Table
          t={t}
          tableTitle={t("ASSIGNED_KNOS")}
          tableClass="ekycTable"
          data={dashboardData?.dashboardInfo?.consumerList || []}
          columns={knoColumns}
          isLoading={isDashboardLoading}
          totalRecords={dashboardData?.dashboardInfo?.total}
          currentPage={currentPage}
          pageSizeLimit={pageSize}
          isPaginationRequired={true}
          onNextPage={() => {
            if (currentPage < (dashboardData?.dashboardInfo?.totalPages || 1) - 1) {
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
            setCurrentPage(Math.max((dashboardData?.dashboardInfo?.totalPages || 1) - 1, 0));
          }}
          onPageSizeChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
        />
      </Card>
      {/* Actions */}
      {
        (!roles.includes("EKYC_SURVEYOR") || roles.includes("EMPLOYEE")) && (
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
          
        )
      }

      {showModal && <AssignEkycModal surveyor={surveyor} closeModal={closeModal} refetchDashboard={refetchDashboard} />}
    </Card>

  );
};

export default SurveyorDetailsDashboard;
