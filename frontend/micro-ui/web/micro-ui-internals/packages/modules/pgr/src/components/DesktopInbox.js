import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Loader, ComplaintIcon } from "@djb25/digit-ui-react-components";
import ComplaintTable from "./inbox/ComplaintTable";
import Filter from "./inbox/Filter";
import SearchComplaint from "./inbox/search";
import { LOCALE } from "../constants/Localization";

/* ── helpers ─────────────────────────────────────────── */
const toTitleCase = (str) => {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/* ── Sidebar links — mirrors HRMS ApplicationLinks ────── */
const PGRInboxLinks = ({ t }) => {
  const hasCsrRole = Digit.UserService.hasAccess(["CSR"]);
  return (
    <Card className="employeeCard filter inboxLinks">
      <div className="complaint-links-container">
        <div className="header">
          <span className="logo">
            <ComplaintIcon />
          </span>{" "}
          <span className="text">{t("ES_PGR_HEADER_COMPLAINT")}</span>
        </div>
        {hasCsrRole && (
          <div className="body">
            <span className="link">
              <Link to="/digit-ui/employee/pgr/complaint/create">
                {t("ES_PGR_NEW_COMPLAINT")}
              </Link>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

/* ── Main DesktopInbox ────────────────────────────────── */
const DesktopInbox = ({
  data,
  onFilterChange,
  onSearch,
  isLoading,
  searchParams,
  onNextPage,
  onPrevPage,
  currentPage,
  pageSizeLimit,
  onPageSizeChange,
  totalRecords,
}) => {
  const { t } = useTranslation();

  /* Status cell — mirrors HRMS GetSlaCell style */
  const GetStatusCell = (status, rawStatus = "") => {
    const textStr = (status || "").toString();
    const rawStr = (rawStatus || "").toString();
    const combined = `${textStr} ${rawStr}`.toUpperCase();

    const isError =
      combined.includes("REJECT") ||
      combined.includes("CLOSED_AFTER_REJECTION") ||
      combined.includes("CLOSED AFTER REJECTION") ||
      combined.includes("CANCEL") ||
      combined.includes("EXPIRED") ||
      combined.includes("INACTIVE");

    return isError ? (
      <span className="sla-cell-error">{textStr}</span>
    ) : (
      <span className="sla-cell-success">{textStr}</span>
    );
  };

  /* SLA cell — red / green */
  const GetSlaCell = (value) => {
    if (value === undefined || value === null || value === "")
      return <span className="cell-text">—</span>;

    const daysText = t("CS_DAYS") !== "CS_DAYS" ? t("CS_DAYS") : "Days";
    const valNum = Number(value);

    return valNum < 0 ? (
      <span className="sla-cell-error">{value} {daysText}</span>
    ) : (
      <span className="sla-cell-success">{value} {daysText}</span>
    );
  };

  const columns = React.useMemo(
    () => [
      {
        Header: t("CS_COMMON_COMPLAINT_NO"),
        Cell: ({ row }) => (
          <div>
            <span className="link">
              <Link
                to={
                  "/digit-ui/employee/pgr/complaint/details/" +
                  row.original["serviceRequestId"]
                }
              >
                {row.original["serviceRequestId"]}
              </Link>
            </span>
            <br />
            <span className="complain-no-cell-text">
              {t(
                `SERVICEDEFS.${row.original["complaintSubType"]?.toUpperCase()}`
              )}
            </span>
          </div>
        ),
      },
      {
        Header: t("WF_INBOX_HEADER_LOCALITY"),
        Cell: ({ row }) => (
          <span className="cell-text">
            {t(
              Digit.Utils.locale.getLocalityCode(
                row.original["locality"],
                row.original["tenantId"]
              )
            )}
          </span>
        ),
      },
      {
        Header: t("CS_COMPLAINT_DETAILS_CURRENT_STATUS"),
        Cell: ({ row }) =>
          GetStatusCell(
            t(`CS_COMMON_${row.original["status"]}`),
            row.original["status"]
          ),
      },
      {
        Header: t("WF_INBOX_HEADER_CURRENT_OWNER"),
        Cell: ({ row }) => (
          <span className="cell-text">{row.original["taskOwner"] || "—"}</span>
        ),
      },
      {
        Header: t("WF_INBOX_HEADER_SLA_DAYS_REMAINING"),
        Cell: ({ row }) => GetSlaCell(row.original["sla"]),
      },
    ],
    [t]
  );

  /* Result section */
  let result;
  if (isLoading) {
    result = <Loader />;
  } else if (data && data.length === 0) {
    result = (
      <Card style={{ marginTop: 20 }}>
        {t(LOCALE.NO_COMPLAINTS_EMPLOYEE)
          .split("\\n")
          .map((text, index) => (
            <p key={index} style={{ textAlign: "center" }}>
              {text}
            </p>
          ))}
      </Card>
    );
  } else if (data && data.length > 0) {
    result = (
      <ComplaintTable
        t={t}
        data={data}
        columns={columns}
        getCellProps={(cellInfo) => ({
          style: {
            maxWidth:
              cellInfo.column.Header === t("CS_COMMON_COMPLAINT_NO")
                ? "240px"
                : "",
            minWidth: "150px",
            padding: "16px 18px",
            fontSize: "14px",
          },
        })}
        onNextPage={onNextPage}
        onPrevPage={onPrevPage}
        totalRecords={totalRecords}
        onPageSizeChagne={onPageSizeChange}
        currentPage={currentPage}
        pageSizeLimit={pageSizeLimit}
      />
    );
  } else {
    result = (
      <Card style={{ marginTop: 20 }}>
        {t(LOCALE.ERROR_LOADING_RESULTS)
          .split("\\n")
          .map((text, index) => (
            <p key={index} style={{ textAlign: "center" }}>
              {text}
            </p>
          ))}
      </Card>
    );
  }

  /* ── Layout: exact HRMS pattern ──────────────────────
     app-container
       inbox-container
         filters-container   (sidebar)
           PGRInboxLinks
           Filter
         form-search-wrapper employee-form-content  (main)
           SearchComplaint
           result
  ─────────────────────────────────────────────────── */
  return (
    <div className="app-container">
      <div className="inbox-container">
        {/* Sidebar */}
        <div className="filters-container">
          <PGRInboxLinks t={t} />
          <div>
            <Filter
              complaints={data}
              onFilterChange={onFilterChange}
              type="desktop"
              searchParams={searchParams}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="form-search-wrapper employee-form-content">
          <SearchComplaint
            onSearch={onSearch}
            type="desktop"
            searchParams={searchParams}
          />
          <div className="result" style={{ flex: 1 }}>
            {result}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopInbox;
