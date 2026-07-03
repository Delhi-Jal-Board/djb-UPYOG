import { Card, Loader } from "@djb25/digit-ui-react-components";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ApplicationTable from "./inbox/ApplicationTable";
import InboxLinks from "./inbox/InboxLink";
import SearchApplication from "./inbox/search";

/**
 * `WTDesktopInbox` is a desktop view component for managing and displaying Water Tanker (WT) service applications.
 * It includes functionality to search, filter, and view application details in a table format.
 * The component dynamically renders content based on the state of the data:
 * - Displays a loader if the data is loading.
 * - Shows a "no application" message or a custom empty result component if no data is available.
 * - Renders an application table if data exists, supporting pagination, sorting, and filtering.
 * The component also handles the display of filters and search components, and conditionally shows additional links related to the WT service.
 * A toggle button allows users to collapse/expand the filter sidebar to give more space to the table.
 *
 * @param {Object} props - The properties passed to the component.
 * @returns {JSX.Element} A desktop inbox UI for Water Tanker applications, with search, filter, pagination, and sorting features.
 */

const WTDesktopInbox = ({ tableConfig, filterComponent, ...props }) => {
  const { data, useNewInboxAPI } = props;
  const { t } = useTranslation();
  const getCreatedAtValue = React.useCallback((row) => {
    const createdTime = row?.searchData?.auditDetails?.createdTime || row?.workflowData?.auditDetails?.createdTime;
    if (!createdTime) return "";
    return `${Digit.DateUtils.ConvertEpochToDate(createdTime)} ${Digit.DateUtils.ConvertEpochToTimeInHours(createdTime)}`;
  }, []);
  const [FilterComponent, setComp] = useState(() => Digit.ComponentRegistryService?.getComponent(filterComponent));
  const [EmptyInboxComp, setEmptyInboxComp] = useState(() => {
    const com = Digit.ComponentRegistryService?.getComponent(props.EmptyResultInboxComp);
    return com;
  });

  const [clearSearchCalled, setClearSearchCalled] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const columns = React.useMemo(() => (props.isSearch ? tableConfig.searchColumns(props) : tableConfig.inboxColumns(props) || []), []);

  const inboxCsvColumns = React.useMemo(() => {
    const csvColumns = [
      {
        Header: columns?.[0]?.Header || t("WT_BOOKING_NO"),
        exportAccessor: (row) => row?.searchData?.bookingNo || "",
      },
      {
        Header: columns?.[1]?.Header || t("WT_APPLICANT_NAME"),
        exportAccessor: (row) => row?.searchData?.applicantDetail?.name || "",
      },
      {
        Header: columns?.[2]?.Header || t("WT_MOBILE_NUMBER"),
        exportAccessor: (row) => row?.searchData?.applicantDetail?.mobileNumber || "",
      },
      {
        Header: columns?.[3]?.Header || t("LOCALITY"),
        exportAccessor: (row) => {
          if (!row?.searchData?.localityCode) return "";
          const tenant = row?.searchData?.tenantId || Digit.ULBService.getCurrentTenantId() || "djb";
          const prefix = tenant.replace(".", "_").toUpperCase();
          return t(`${prefix}_REVENUE_${row.searchData.localityCode}`);
        },
      },
    ];

    if (columns?.some((column) => column?.id === "fillingPoint")) {
      csvColumns.push({
        Header: columns?.find((column) => column?.id === "fillingPoint")?.Header || t("Filling Point"),
        exportAccessor: (row) => row?.searchData?.fillingPointMetadata?.name || row?.searchData?.fillingPointName || "-",
      });
    }

    if (columns?.some((column) => column?.id === "createdTime")) {
      csvColumns.push({
        Header: columns?.find((column) => column?.id === "createdTime")?.Header || t("CREATED_AT"),
        exportAccessor: (row) => getCreatedAtValue(row),
      });
    }

    csvColumns.push({
      Header: columns?.find((column) => column?.id === "applicationStatus")?.Header || t("WT_STATUS"),
      exportAccessor: (row) => (row?.workflowData?.state?.applicationStatus ? t(row.workflowData.state.applicationStatus) : ""),
    });

    if (columns?.some((column) => column?.id === "deliveryDateTime")) {
      csvColumns.push({
        Header: columns?.find((column) => column?.id === "deliveryDateTime")?.Header || t("WT_DELIVERY_DATE_TIME"),
        exportAccessor: (row) => {
          const driverTripReport = row?.searchData?.driverTripReport;
          if (Array.isArray(driverTripReport) && driverTripReport.length > 0) {
            const lastModifiedTime = driverTripReport[0]?.auditDetails?.lastModifiedTime;
            if (lastModifiedTime) {
              return `${Digit.DateUtils.ConvertEpochToDate(lastModifiedTime)} ${Digit.DateUtils.ConvertEpochToTimeInHours(lastModifiedTime)}`;
            }
          }
          return "-";
        },
      });
    }

    if (columns?.some((column) => column?.id === "vendorName")) {
      csvColumns.push({
        Header: columns?.find((column) => column?.id === "vendorName")?.Header || t("WT_VENDOR_NAME"),
        exportAccessor: (row) => row?.searchData?.vendor?.name || row?.searchData?.vendorName || "-",
      });
    }

    if (columns?.some((column) => column?.id === "vehicleNumber")) {
      csvColumns.push({
        Header: columns?.find((column) => column?.id === "vehicleNumber")?.Header || t("WT_VEHICLE_NO"),
        exportAccessor: (row) => {
          const searchData = row?.searchData;
          const mappedVehicle = searchData?.vehicle || searchData?.vendor?.vehicles?.find((vehicle) => vehicle?.id === searchData?.vehicleId);
          return (
            mappedVehicle?.registrationNumber ||
            mappedVehicle?.name ||
            mappedVehicle?.type ||
            searchData?.vehicleName ||
            searchData?.vehicleRegistrationNo ||
            "-"
          );
        },
      });
    }

    if (columns?.some((column) => column?.id === "driverName")) {
      csvColumns.push({
        Header: columns?.find((column) => column?.id === "driverName")?.Header || t("WT_DRIVER_NAME"),
        exportAccessor: (row) => {
          const searchData = row?.searchData;
          const mappedDriver =
            searchData?.driver ||
            searchData?.vendor?.drivers?.find(
              (driver) =>
                driver?.id === searchData?.driverId || driver?.ownerId === searchData?.driverId || driver?.owner?.uuid === searchData?.driverId
            );
          return mappedDriver?.name || mappedDriver?.owner?.name || searchData?.driverName || "-";
        },
      });
    }

    return csvColumns;
  }, [columns, getCreatedAtValue, t]);

  let result;
  if (props.isLoading) {
    result = <Loader />;
  } else if (clearSearchCalled) {
    result = null;
  } else if (!data || data?.length === 0 || (useNewInboxAPI && data?.[0]?.dataEmpty)) {
    if (EmptyInboxComp) {
      result = <EmptyInboxComp data={data} />;
    } else if (data?.length === 0 || (useNewInboxAPI && data?.[0]?.dataEmpty)) {
      result = (
        <Card style={{ marginTop: 20 }}>
          {t("DATA_NOT_FOUND", "Data Not Found")
            .split("\n")
            .map((text, index) => (
              <p key={index} style={{ textAlign: "center" }}>
                {text}
              </p>
            ))}
        </Card>
      );
    } else {
      result = <Loader />;
    }
  } else if (data?.length > 0) {
    result = (
      <ApplicationTable
        t={t}
        data={data}
        columns={columns}
        getCellProps={(cellInfo) => ({
          style: {
            padding: "8px 12px",
            fontSize: "13.5px",
          },
        })}
        onPageSizeChange={props.onPageSizeChange}
        currentPage={props.currentPage}
        onNextPage={props.onNextPage}
        onPrevPage={props.onPrevPage}
        pageSizeLimit={props.pageSizeLimit}
        onSort={props.onSort}
        disableSort={props.disableSort}
        sortParams={props.sortParams}
        autoSort={false}
        totalRecords={props.totalRecords}
        showCSVExport={true}
        getCSVExportData={props.getCSVExportData}
        csvExportColumns={inboxCsvColumns}
        csvExportFileName={`${String(props.moduleCode || "wt").toLowerCase()}-inbox`}
      />
    );
  }

  return (
    <div
      className="inbox-container"
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "12px",
        alignItems: "flex-start",
        width: "100%",
        minHeight: 0,
        overflow: "visible",
      }}
    >
      {/* -------- Collapsible Sidebar -------- */}
      {!props.isSearch && (
        <div
          className="wt-sidebar-panel"
          style={{
            width: isSidebarCollapsed ? "40px" : "240px",
            minWidth: isSidebarCollapsed ? "40px" : "240px",
            flexShrink: 0,
            transition: "width 0.25s ease, min-width 0.25s ease",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Toggle button */}
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? "Expand Filters" : "Collapse Filters"}
            style={{
              alignSelf: "flex-end",
              background: "#0B2559",
              border: "none",
              borderRadius: "6px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              transition: "background 0.2s ease",
              marginBottom: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a7a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0B2559")}
          >
            {isSidebarCollapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Sidebar content - hidden when collapsed */}
          <div
            style={{
              opacity: isSidebarCollapsed ? 0 : 1,
              visibility: isSidebarCollapsed ? "hidden" : "visible",
              transition: "opacity 0.2s ease, visibility 0.2s ease",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              overflow: "hidden",
            }}
          >
            <InboxLinks parentRoute={props.parentRoute} businessService={props.moduleCode} />
            <div className="filter-form">
              <FilterComponent
                defaultSearchParams={props.defaultSearchParams}
                onFilterChange={props.onFilterChange}
                searchParams={props.searchParams}
                type="desktop"
                useNewInboxAPI={useNewInboxAPI}
                statusMap={useNewInboxAPI ? data?.[0].statusMap : null}
                moduleCode={props.moduleCode}
              />
            </div>
          </div>
        </div>
      )}

      {/* -------- Main Content Area -------- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: 0, overflow: "hidden" }}>
        {!props.isSearch && (
          <div
            className="summary-cards-container"
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            {(() => {
              const getCount = (statusList) => {
                return (data?.[0]?.statusMap || [])
                  .filter((s) => {
                    const st = (s.applicationStatus || s.applicationstatus || s.bookingStatus || s.bookingstatus || s.statusid || "")
                      .toUpperCase()
                      .replace(/\s+/g, "_");
                    return statusList.includes(st);
                  })
                  .reduce((acc, curr) => acc + curr.count, 0);
              };

              const cards = [
                {
                  label: "WT_TOTAL_BOOKINGS",
                  count: data?.[0]?.totalCount || 0,
                  color: "#0B2559",
                  filter: null,
                  active: !props.searchParams?.status,
                },
                { label: "WT_SCHEDULED", count: getCount(["SCHEDULED", "VENDOR_ASSIGNED"]), color: "#F59E0B", filter: ["SCHEDULED"] },
                { label: "WT_DELIVERED", count: getCount(["TANKER_DELIVERED", "DELIVERED"]), color: "#10B981", filter: ["TANKER_DELIVERED"] },
                { label: "IN_TRANSIT", count: getCount(["IN_TRANSIT", "DELIVERY_PENDING"]), color: "#A855F7", filter: ["IN_TRANSIT"] },
                { label: "MISSED", count: getCount(["MISSED", "DELIVERY_MISSED"]), color: "#EF4444", filter: ["MISSED"] },
                { label: "REJECTED", count: getCount(["CANCELLED", "REJECTED", "REQUEST_REJECTED"]), color: "#64748B", filter: ["CANCELLED"] },
              ];

              return cards;
            })().map((card, idx) => {
              const isActive = props.searchParams?.status?.code ? card.filter?.includes(props.searchParams?.status?.code) : card.active;
              return (
                <div
                  key={idx}
                  className="summary-card"
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "6px",
                    padding: "12px 14px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    flex: "1 1 110px",
                    minWidth: "100px",
                    border: isActive ? `2px solid ${card.color}` : "1px solid #E2E8F0",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748B",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t(card.label)}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: card.color, marginTop: "8px" }}>
                    {String(card.count).padStart(2, "0")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <SearchApplication
          defaultSearchParams={props.defaultSearchParams}
          onSearch={(d) => {
            props.onSearch(d);
            setClearSearchCalled(false);
          }}
          type="desktop"
          searchFields={props.searchFields}
          isInboxPage={!props?.isSearch}
          searchParams={props.searchParams}
          clearSearch={() => setClearSearchCalled(true)}
        />
        <div className="result" style={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
          {result}
        </div>
      </div>
    </div>
  );
};

export default WTDesktopInbox;
