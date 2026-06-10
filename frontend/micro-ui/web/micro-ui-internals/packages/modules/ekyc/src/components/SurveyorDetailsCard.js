import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

import { Card, SubmitBar, ActionBar, Menu, Loader, Table } from "@djb25/digit-ui-react-components";

import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import AssignEkycModal from "./AssignEkycModal";

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

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const queryParams = {
    tenantId: "dl.djb",
    offset: currentPage * pageSize,
    limit: pageSize,
    surveyorId: surveyor?.owner?.uuid,
  };

  const { isFetching: isDashboardLoading, data: dashboardData = {} } = Digit.Hooks.ekyc.useEkycSurveyorDashboard({}, queryParams, {
    enabled: !!queryParams.tenantId && !!queryParams.surveyorId,
    keepPreviousData: true,
  });

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

  const fullName = surveyor?.owner?.name || surveyor?.name || "N/A";

  const employeeId = surveyor?.employeeId || surveyor?.owner?.uuid || surveyor?.id;

  const handleMenuSelect = (option) => {
    setShowOptions(false); // close menu
    setShowModal(true);
  };

  return (
    <Card className="surveyor-dashboard">
      {/* Header */}
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
      {(!roles.includes("EKYC_SURVEYOR") || roles.includes("EMPLOYEE")) && (
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

      {showModal && <AssignEkycModal surveyor={surveyor} closeModal={() => setShowModal(false)} />}
    </Card>
  );
};

export default SurveyorDetailsDashboard;
