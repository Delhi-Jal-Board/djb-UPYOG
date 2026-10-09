import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, Loader } from "@djb25/digit-ui-react-components";
import ApplicationTable from "./inbox/ApplicationTable";
import Filter from "./inbox/Filter";
import SearchApplication from "./inbox/search";

const DesktopInbox = (props) => {
  const { t } = useTranslation();
  const DSO = Digit.UserService.hasAccess(["FSM_DSO"]) || false;
  const GetCell = (value) => <span className="cell-text">{value}</span>;
  const FSTP = Digit.UserService.hasAccess("FSM_EMP_FSTPO") || false;

  const GetSlaCell = (value) => {
    if (value === undefined || value === null || value === "" || value === "-") return <span className="cell-text">—</span>;
    if (isNaN(value)) return <span className="sla-cell-success">0</span>;
    const daysText = t("CS_DAYS") !== "CS_DAYS" ? t("CS_DAYS") : "Days";
    const valNum = Number(value);
    return valNum < 0 ? (
      <span className="sla-cell-error">{value} {daysText}</span>
    ) : (

      <span className="sla-cell-success">{value} {daysText}</span>
    );
  };

  const GetStatusCell = (status, rawStatus = "") => {
    const textStr = (status || "").toString();
    const rawStr = (rawStatus || "").toString();
    const combined = `${textStr} ${rawStr}`.toUpperCase();

    const isError =
      combined.includes("REJECT") ||
      combined.includes("CANCEL") ||
      combined.includes("CLOSED") ||
      combined.includes("INACTIVE");

    return isError ? (
      <span className="sla-cell-error">{textStr}</span>
    ) : (
      <span className="sla-cell-success">{textStr}</span>
    );
  };

  function goTo(id) {
    // history.push("/digit-ui/employee/fsm/complaint/details/" + id);
  }

  const columns = React.useMemo(() => {
    if (props.isSearch) {
      return [
        {
          Header: t("ES_INBOX_APPLICATION_NO"),
          accessor: "applicationNo",
          disableSortBy: true,
          Cell: ({ row }) => {
            return (
              <div>
                <span className="link">
                  <Link to={`${props.parentRoute}/${DSO ? "dso-application-details" : "application-details"}/` + row.original["applicationNo"]}>
                    {row.original["applicationNo"]}
                  </Link>
                </span>
                {/* <a onClick={() => goTo(row.row.original["serviceRequestId"])}>{row.row.original["serviceRequestId"]}</a> */}
              </div>
            );
          },
        },
        {
          Header: t("ES_APPLICATION_DETAILS_APPLICANT_NAME"),
          disableSortBy: true,
          accessor: (row) => GetCell(row.citizen?.name || ""),
        },
        {
          Header: t("ES_APPLICATION_DETAILS_APPLICANT_MOBILE_NO"),
          disableSortBy: true,
          accessor: (row) => GetCell(row.citizen?.mobileNumber || ""),
        },
        {
          Header: t("ES_APPLICATION_DETAILS_PROPERTY_TYPE"),
          accessor: (row) => {
            const key = t(`PROPERTYTYPE_MASTERS_${row.propertyUsage.split(".")[0]}`);
            return key;
          },
          disableSortBy: true,
        },
        {
          Header: t("ES_APPLICATION_DETAILS_PROPERTY_SUB-TYPE"),
          accessor: (row) => {
            const key = t(`PROPERTYTYPE_MASTERS_${row.propertyUsage}`);
            return key;
          },
          disableSortBy: true,
        },
        {
          Header: t("ES_INBOX_LOCALITY"),
          accessor: (row) => GetCell(t(Digit.Utils.locale.getRevenueLocalityCode(row.address.locality.code, row.tenantId))),
          disableSortBy: true,
        },
        {
          Header: t("ES_INBOX_STATUS"),
          accessor: (row) => {
            return GetStatusCell(t(`CS_COMMON_FSM_${row.applicationStatus}`), row.applicationStatus);
          },
          disableSortBy: true,
        },
      ];
    }
    switch (props.userRole) {
      case "FSM_EMP_FSTPO_REQUEST":
        return [
          {
            Header: t("ES_INBOX_APPLICATION_NO"),
            accessor: "applicationNo",
            // disableSortBy: true,
            Cell: ({ row }) => {
              // fetching out citizen info
              let citizen_info = props?.fstprequest?.find((i) => row.original.tripDetails[0].referenceNo === i.applicationNo);
              return (
                <div>
                  <span className="link">
                    <Link to={"/digit-ui/employee/fsm/fstp-operator-details/" + row.original["applicationNo"]}> {citizen_info?.applicationNo}</Link>
                  </span>
                </div>
              );
            },
          },
          {
            Header: t("CS_COMMON_CITIZEN_NAME"),
            disableSortBy: true,
            Cell: ({ row }) => {
              let citizen_info = props?.fstprequest?.find((i) => row.original.tripDetails[0].referenceNo === i.applicationNo);
              return (
                <div>
                  <span>{citizen_info?.citizen?.name}</span>
                </div>
              );
            },
          },
          {
            Header: t("CS_COMMON_CITIZEN_NUMBER"),
            disableSortBy: true,
            accessor: "number",
            Cell: ({ row }) => {
              let citizen_info = props?.fstprequest?.find((i) => row.original.tripDetails[0].referenceNo === i.applicationNo);
              return (
                <div>
                  <span>{citizen_info?.citizen?.mobileNumber}</span>
                </div>
              );
            },
          },
          {
            Header: t("ES_INBOX_LOCALITY"),
            disableSortBy: true,
            accessor: "locality",
            Cell: ({ row }) => {
              let citizen_info = props?.fstprequest?.find((i) => row.original.tripDetails[0].referenceNo === i.applicationNo);
              return (
                <div>
                  <span>{t(`${citizen_info?.address?.locality?.name}`)}</span>
                </div>
              );
            },
          },
        ];
      case "FSM_EMP_FSTPO":
        return [
          {
            Header: t("ES_INBOX_APPLICATION_NO"),
            disableSortBy: true,
            accessor: "tripDetails",
            Cell: ({ row }) => {
              return (
                <div>
                  <span className="link">
                    <Link to={"/digit-ui/employee/fsm/fstp-operator-details/" + row.original["applicationNo"]}>
                      {row.original["tripDetails"].map((i) => (
                        <div>
                          {i.referenceNo}
                          <br />
                        </div>
                      ))}
                    </Link>
                  </span>
                </div>
              );
            },
          },
          {
            Header: t("ES_INBOX_VEHICLE_LOG"),
            accessor: "applicationNo",
            disableSortBy: true,
            Cell: ({ row }) => {
              return (
                <div>
                  <span className="link">
                    <Link to={"/digit-ui/employee/fsm/fstp-operator-details/" + row.original["applicationNo"]}>{row.original["applicationNo"]}</Link>
                  </span>
                </div>
              );
            },
          },
          {
            Header: t("ES_INBOX_APPLICATION_DATE"),
            accessor: "createdTime",
            Cell: ({ row }) => {
              return GetCell(
                `${new Date(row.original.auditDetails.createdTime).getDate()}/${
                  new Date(row.original.auditDetails.createdTime).getMonth() + 1
                }/${new Date(row.original.auditDetails.createdTime).getFullYear()}`
              );
            },
          },
          {
            Header: t("ES_INBOX_VEHICLE_NO"),
            disableSortBy: true,
            accessor: (row) => row.vehicle?.registrationNumber,
          },
          {
            Header: t("ES_INBOX_DSO_NAME"),
            disableSortBy: true,
            accessor: (row) => (row.dsoName ? `${row.dsoName} - ${row.tripOwner.name}` : `${row.tripOwner.name}`),
          },
          {
            Header: t("ES_INBOX_VEHICLE_STATUS"),
            disableSortBy: true,
            accessor: (row) => row.status,
          },
          {
            Header: t("ES_INBOX_WASTE_COLLECTED"),
            disableSortBy: true,
            accessor: (row) => row.tripDetails[0]?.volume,
          },
        ];
      default:
        return [
          {
            Header: t("CS_FILE_DESLUDGING_APPLICATION_NO"),
            Cell: ({ row }) => {
              return (
                <div>
                  <span className="link">
                    <Link to={`${props.parentRoute}/${DSO ? "dso-application-details" : "application-details"}/` + row.original["applicationNo"]}>
                      {row.original["applicationNo"]}
                    </Link>
                  </span>
                  {/* <a onClick={() => goTo(row.row.original["serviceRequestId"])}>{row.row.original["serviceRequestId"]}</a> */}
                </div>
              );
            },
          },
          {
            Header: t("ES_INBOX_APPLICATION_DATE"),
            accessor: "createdTime",
            Cell: ({ row }) => {
              const dt = row.original?.createdTime ? new Date(row.original.createdTime) : null;
              return GetCell(
                dt && !isNaN(dt) ? `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}` : "—"
              );
            },
          },
          {
            Header: t("ES_INBOX_LOCALITY"),
            Cell: ({ row }) => {
              return GetCell(t(Digit.Utils.locale.getRevenueLocalityCode(row.original["locality"], row.original["tenantId"])));
            },
          },
          {
            Header: t("ES_INBOX_STATUS"),
            Cell: ({ row }) => {
              return GetStatusCell(t(`CS_COMMON_FSM_${row.original["status"]}`), row.original["status"]);
            },
          },
          {
            Header: t("ES_INBOX_SLA_DAYS_REMAINING"),
            Cell: ({ row }) => {
              return GetSlaCell(row.original["sla"]);
            },
          },
        ];
    }
  }, [props.fstprequest, props.data]);

  let result;
  if (props.isLoading) {
    result = <Loader />;
  } else if ((props.isSearch && !props.shouldSearch) || props?.data?.table?.length === 0) {
    result = (
      <Card style={{ marginTop: 20 }}>
        {/* TODO Change localization key */}
        {
          // t("CS_MYCOMPLAINTS_NO_COMPLAINTS")
          t("CS_MYAPPLICATIONS_NO_APPLICATION")
            .split("\\n")
            .map((text, index) => (
              <p key={index} style={{ textAlign: "center" }}>
                {text}
              </p>
            ))
        }
      </Card>
    );
  } else if (props?.data?.table?.length > 0) {
    result = (
      <ApplicationTable
        t={t}
        data={props.data.table}
        columns={columns}
        getCellProps={(cellInfo) => {
          return {
            style: {
              maxWidth:
                cellInfo.column.Header === t("CS_FILE_DESLUDGING_APPLICATION_NO") ||
                cellInfo.column.Header === t("ES_INBOX_APPLICATION_NO")
                  ? "240px"
                  : "",
              minWidth: "140px",
              padding: "16px 18px",
              fontSize: "14px",
            },
          };
        }}
        onPageSizeChange={props.onPageSizeChange}
        currentPage={props.currentPage}
        onNextPage={props.onNextPage}
        onPrevPage={props.onPrevPage}
        pageSizeLimit={props.pageSizeLimit}
        onSort={props.onSort}
        disableSort={props.disableSort}
        sortParams={props.sortParams}
        totalRecords={props.totalRecords}
        isPaginationRequired={props.isPaginationRequired}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="inbox-container">
        {props.userRole !== "FSM_EMP_FSTPO" && !props.isSearch && (
          <div className="filters-container">
            <div>
              <Filter
                searchParams={props.searchParams}
                paginationParms={props.paginationParms}
                applications={props.data}
                onFilterChange={props.onFilterChange}
                type="desktop"
              />
            </div>
          </div>
        )}
        <div className="form-search-wrapper employee-form-content">
          <SearchApplication
            onSearch={props.onSearch}
            type="desktop"
            searchFields={props.searchFields}
            isInboxPage={!props?.isSearch}
            searchParams={props.searchParams}
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
