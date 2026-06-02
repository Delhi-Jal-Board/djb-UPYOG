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

  const knoColumns = React.useMemo(
    () => [
      {
        Header: t("KNO"),
        accessor: "kno",
      },
      {
        Header: t("CONSUMER_NAME"),
        accessor: "consumerName",
      },
      {
        Header: t("MOBILE_NO"),
        accessor: "mobileNumber",
      },
      {
        Header: t("STATUS"),
        accessor: "status",
        Cell: ({ value }) => <span className={`status-badge ${value?.toLowerCase() || ""}`}>{value}</span>,
      },
      {
        Header: t("ASSIGNED_DATE"),
        accessor: "assignedDate",
      },
      {
        Header: t("COMPLETED_DATE"),
        accessor: "completedDate",
      },
    ],
    [t]
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
  const assignedKnos = [
    {
      kno: "123456789",
      consumerName: "Rahul Sharma",
      mobileNumber: "9876543210",
      status: "Completed",
      assignedDate: "01-06-2026",
      completedDate: "02-06-2026",
    },
    {
      kno: "123456790",
      consumerName: "Amit Kumar",
      mobileNumber: "9876543211",
      status: "Pending",
      assignedDate: "03-06-2026",
      completedDate: "-",
    },
  ];

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

  const StatCard = ({ title, value, type }) => (
    <div className={`stat-card ${type}`}>
      <div className="stat-title">{title}</div>

      <div className="stat-value">{value}</div>
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
        <StatCard title={t("TODAYS_EKYC")} value={surveyor?.todayCompleted || 0} type="today" />

        <StatCard title={t("THIS_WEEK")} value={surveyor?.weekCompleted || 0} type="week" />

        <StatCard title={t("THIS_MONTH")} value={surveyor?.monthCompleted || 0} type="month" />

        <StatCard title={t("PENDING_CASES")} value={surveyor?.pendingCases || 0} type="pending" />
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

      <Table
        t={t}
        tableTitle={t("ASSIGNED_KNOS")}
        data={assignedKnos}
        columns={knoColumns}
        totalRecords={assignedKnos?.length}
        isPaginationRequired={true}
        pageSizeLimit={10}
        manualPagination={false}
      />

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
