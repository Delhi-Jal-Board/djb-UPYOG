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
 *
 * @param {Object} props - The properties passed to the component.
 * @returns {JSX.Element} A desktop inbox UI for Water Tanker applications, with search, filter, and table display.
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
    <div className="inbox-container">
      {!props.isSearch && (
        <div className="side-panel-item">
          <InboxLinks parentRoute={props.parentRoute} businessService={props.moduleCode} />
          <div className="filter-form ">
            {
              <FilterComponent
                defaultSearchParams={props.defaultSearchParams}
                onFilterChange={props.onFilterChange}
                searchParams={props.searchParams}
                type="desktop"
                useNewInboxAPI={useNewInboxAPI}
                statusMap={useNewInboxAPI ? data?.[0].statusMap : null}
                moduleCode={props.moduleCode}
              />
            }
          </div>
        </div>
      )}
      <div className="employee-form-content" style={{ flex: 1 }}>
        {!props.isSearch && (
          <div className="summary-cards-container">
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

              const isFixedPoint =
                props.businessService === "watertanker-fixedpoint" || props.searchParams?.services?.includes("watertanker-fixedpoint");
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
              ];
              cards.push(
                { label: "IN_TRANSIT", count: getCount(["IN_TRANSIT", "DELIVERY_PENDING"]), color: "#A855F7", filter: ["IN_TRANSIT"] },
                { label: "MISSED", count: getCount(["MISSED", "DELIVERY_MISSED"]), color: "#EF4444", filter: ["MISSED"] },
                { label: "REJECTED", count: getCount(["CANCELLED", "REJECTED", "REQUEST_REJECTED"]), color: "#64748B", filter: ["CANCELLED"] }
              );
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
                    padding: "16px 14px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    flex: "1 1 0%",
                    minWidth: "110px",
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
                      fontSize: "11px",
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
                  <div style={{ fontSize: "28px", fontWeight: "700", color: card.color, marginTop: "12px" }}>
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
        <div className="result" style={{ flex: 1 }}>
          {result}
        </div>
      </div>
    </div>
  );
};

export default WTDesktopInbox;
