import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ApplicationTable from "../inbox/ApplicationTable";
import { Card, Loader } from "@djb25/digit-ui-react-components";
import InboxLinks from "../inbox/ApplicationLinks";
import SearchApplication from "./search";
import { Link } from "react-router-dom";

const getPrimaryAssignment = (assignments = []) =>
  [...(Array.isArray(assignments) ? assignments : [])].sort((a, b) => new Date(a?.fromDate || 0) - new Date(b?.fromDate || 0))[0];

const getEmployeeZone = (employee) => {
  const jurisdictions = employee?.jurisdictions;
  if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) return "N/A";

  for (const j of jurisdictions) {
    if (j?.zone && j.zone !== "null") return j.zone;
    if (Array.isArray(j?.zones) && j.zones.length > 0) {
      const z = j.zones[0];
      const zCode = typeof z === "object" ? z?.code || z?.name : z;
      if (zCode && zCode !== "null") return zCode;
    }
    if (j?.zones && typeof j.zones === "string" && j.zones !== "null") return j.zones;
  }

  for (const j of jurisdictions) {
    if (
      j?.boundary &&
      j.boundary !== "null" &&
      j.boundary !== employee?.tenantId &&
      j.boundary !== "dl.djb" &&
      j?.boundaryType !== "City"
    ) {
      return j.boundary;
    }
  }

  return "N/A";
};

const DesktopInbox = ({ tableConfig, filterComponent, getCSVExportData: getCSVExportDataProp, ...props }) => {
  const { t } = useTranslation();
  const tenantIds = Digit.SessionStorage.get("HRMS_TENANTS");
  const GetCell = (value) => <span className="cell-text">{t(value)}</span>;
  const GetSlaCell = (value) => {
    return value === "INACTIVE" ? (
      <span className="sla-cell-error">{t(value) || ""}</span>
    ) : (
      <span className="sla-cell-success">{t(value) || ""}</span>
    );
  };
  const data = props?.data?.Employees;

  const [FilterComponent, setComp] = useState(() => Digit.ComponentRegistryService?.getComponent(filterComponent));

  const columns = React.useMemo(() => {
    return [
      {
        Header: t("HR_EMP_ID_LABEL"),
        id: "employeeCode",
        accessor: (row) => row?.code || "",
        Cell: ({ row }) => {
          return (
            <span className="link">
              <Link to={`/digit-ui/employee/hrms/details/${row.original.tenantId}/${row.original.code}`}>{row.original.code}</Link>
            </span>
          );
        },
      },
      {
        Header: t("HR_EMP_NAME_LABEL"),
        id: "employeeName",
        accessor: (row) => row?.user?.name || "",
        Cell: ({ row }) => {
          return GetCell(`${row.original?.user?.name}`);
        },
      },
      {
        Header: t("HR_ROLE_NO_LABEL"),
        id: "roleCount",
        accessor: (row) => row?.user?.roles?.length || 0,
        Cell: ({ row }) => {
          return (
            <div className="tooltip">
              {" "}
              {GetCell(`${row.original?.user?.roles.length}`)}
              <span className="tooltiptext" style={{ whiteSpace: "nowrap" }}>
                {row.original?.user?.roles.map((ele, index) => (
                  <span>
                    {`${index + 1}. ` + t(`ACCESSCONTROL_ROLES_ROLES_${ele.code}`)} <br />{" "}
                  </span>
                ))}
              </span>
            </div>
          );
        },
      },
      {
        Header: t("HR_DESG_LABEL"),
        id: "designation",
        accessor: (row) => {
          const assignment = getPrimaryAssignment(row?.assignments);
          return assignment?.designation ? t(`COMMON_MASTERS_DESIGNATION_${assignment?.designation}`) : "";
        },
        Cell: ({ row }) => {
          return GetCell(
            `${
              t(
                "COMMON_MASTERS_DESIGNATION_" + row.original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]?.designation
              ) || ""
            }`
          );
        },
      },
      {
        Header: t("HR_DEPT_LABEL"),
        id: "department",
        accessor: (row) => {
          const assignment = getPrimaryAssignment(row?.assignments);
          return assignment?.department ? t(`COMMON_MASTERS_DEPARTMENT_${assignment?.department}`) : "";
        },
        Cell: ({ row }) => {
          return GetCell(
            `${
              t(
                "COMMON_MASTERS_DEPARTMENT_" + row.original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]?.department
              ) || ""
            }`
          );
        },
      },
      {
        Header: t("HR_ZONE_LABEL"),
        id: "zone",
        accessor: (row) => {
          const zoneVal = getEmployeeZone(row);
          return zoneVal !== "N/A" ? t(zoneVal) || zoneVal : "N/A";
        },
        Cell: ({ row }) => {
          const zoneVal = getEmployeeZone(row?.original);
          return GetCell(zoneVal !== "N/A" ? zoneVal : "N/A");
        },
      },
      {
        Header: t("HR_STATUS_LABEL"),
        id: "status",
        accessor: (row) => (row?.isActive ? "ACTIVE" : "INACTIVE"),
        Cell: ({ row }) => {
          return GetSlaCell(`${row.original?.isActive ? "ACTIVE" : "INACTIVE"}`);
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const csvExportColumns = React.useMemo(
    () => [
      {
        Header: t("HR_EMP_ID_LABEL"),
        exportAccessor: (row) => row?.code || "",
      },
      {
        Header: t("HR_EMP_NAME_LABEL"),
        exportAccessor: (row) => row?.user?.name || "",
      },
      {
        Header: t("HR_ROLE_NO_LABEL"),
        exportAccessor: (row) => row?.user?.roles?.length || 0,
      },
      {
        Header: t("HR_DESG_LABEL"),
        exportAccessor: (row) => {
          const assignment = getPrimaryAssignment(row?.assignments);
          return assignment?.designation ? t(`COMMON_MASTERS_DESIGNATION_${assignment?.designation}`) : "";
        },
      },
      {
        Header: t("HR_DEPT_LABEL"),
        exportAccessor: (row) => {
          const assignment = getPrimaryAssignment(row?.assignments);
          return assignment?.department ? t(`COMMON_MASTERS_DEPARTMENT_${assignment?.department}`) : "";
        },
      },
      {
        Header: t("HR_ZONE_LABEL") || t("HR_DEPT_ZONE_LABEL") || "Zone",
        exportAccessor: (row) => {
          const zoneVal = getEmployeeZone(row);
          return zoneVal !== "N/A" ? t(zoneVal) || zoneVal : "N/A";
        },
      },
      {
        Header: t("HR_STATUS_LABEL"),
        exportAccessor: (row) => (row?.isActive ? "ACTIVE" : "INACTIVE"),
      },
    ],
    [t]
  );

  const getCSVExportData = React.useCallback(async () => {
    if (typeof getCSVExportDataProp === "function") {
      return getCSVExportDataProp();
    }
    return data || [];
  }, [getCSVExportDataProp, data]);

  let result;
  if (props.isLoading) {
    result = <Loader />;
  } else if (data?.length === 0) {
    result = (
      <Card style={{ marginTop: 20 }}>
        {/* TODO Change localization key */}
        {t("COMMON_TABLE_NO_RECORD_FOUND")
          .split("\\n")
          .map((text, index) => (
            <p key={index} style={{ textAlign: "center" }}>
              {text}
            </p>
          ))}
      </Card>
    );
  } else if (data?.length > 0) {
    result = (
      <ApplicationTable
        t={t}
        data={data}
        columns={columns}
        getCellProps={(cellInfo) => {
          return {
            style: {
              maxWidth: cellInfo.column.Header === t("HR_EMP_ID_LABEL") ? "150px" : "",
              minWidth: "150px",
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
        autoSort={false}
        totalRecords={props.totalRecords}
        showCSVExport={true}
        getCSVExportData={getCSVExportData}
        csvExportColumns={csvExportColumns}
        csvExportFileName="hrms-inbox"
      />
    );
  }

  return (
    <div className="app-container">
      <div className="inbox-container">
        {!props.isSearch && (
          <div className="filters-container">
            <InboxLinks
              parentRoute={props.parentRoute}
              allLinks={[
                {
                  text: "HR_COMMON_CREATE_EMPLOYEE_HEADER",
                  link: "/digit-ui/employee/hrms/create",
                  businessService: "hrms",
                  roles: ["HRMS_ADMIN"],
                },
              ]}
              headerText={"HRMS"}
              businessService={props.businessService}
            />
            <div>
              {
                <FilterComponent
                  defaultSearchParams={props.defaultSearchParams}
                  onFilterChange={props.onFilterChange}
                  searchParams={props.searchParams}
                  type="desktop"
                  tenantIds={tenantIds}
                />
              }
            </div>
          </div>
        )}
        <div className="form-search-wrapper employee-form-content">
          <SearchApplication
            defaultSearchParams={props.defaultSearchParams}
            onSearch={props.onSearch}
            type="desktop"
            tenantIds={tenantIds}
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
