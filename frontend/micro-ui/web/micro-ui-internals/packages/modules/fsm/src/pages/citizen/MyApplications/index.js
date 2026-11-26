import React, { useMemo } from "react";
import { Header, Loader, Card, SubmitBar, Table } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getPropertyTypeLocale } from "../../../utils";

export const MyApplications = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const user = Digit.UserService.getUser();
  const userInfo = user?.info || Digit.SessionStorage.get("User")?.info || {};
  const userMobileNumber = userInfo?.mobileNumber || (userInfo?.userName?.match(/^[0-9]{10}$/) ? userInfo?.userName : undefined);

  const filters = {
    mobileNumber: userMobileNumber,
    // uuid: userInfo?.uuid,
    limit: 100,
  };
  const { isLoading, isError, error, data: { data: { table: applicationsList } = {} } = {} } = Digit.Hooks.fsm.useSearchAll(tenantId, filters);

  const safeApplicationsList = useMemo(() => {
    return Array.isArray(applicationsList) ? applicationsList.filter((app) => app && app.applicationNo) : [];
  }, [applicationsList]);


  const columns = useMemo(
    () => [
      {
        Header: t("CS_FSM_APPLICATION_APPLICATION_NO"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const app = row.original;
          return (
            <span className="link">
              <Link
                to={{
                  pathname: `/digit-ui/citizen/fsm/application-details/${app?.applicationNo}`,
                  state: { tenantId: app?.tenantId },
                }}
              >
                {app?.applicationNo || "N/A"}
              </Link>
            </span>
          );
        },
      },
      {
        Header: t("CS_APPLICATION_DETAILS_APPLICANT_NAME"),
        disableSortBy: true,
        Cell: ({ row }) => <span>{row.original?.citizen?.name || "N/A"}</span>,
      },
      {
        Header: t("CS_APPLICATION_DETAILS_PROPERTY_TYPE"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const usage = row.original?.propertyUsage;
          return <span>{usage ? t(getPropertyTypeLocale(usage)) || usage : "N/A"}</span>;
        },
      },
      {
        Header: t("CS_APPLICATION_DETAILS_MOHALLA"),
        disableSortBy: true,
        Cell: ({ row }) => <span>{row.original?.address?.locality?.name || row.original?.address?.landmark || "N/A"}</span>,
      },
      {
        Header: t("CS_APPLICATION_DETAILS_APPLICATION_DATE"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const timestamp = row.original?.auditDetails?.createdTime;
          if (!timestamp) return <span>N/A</span>;
          const date = new Date(timestamp);
          return (
            <span>
              {isNaN(date.getTime())
                ? "N/A"
                : `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`}
            </span>
          );
        },
      },
      {
        Header: t("CS_FSM_APPLICATION_DETAIL_STATUS"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const status = row.original?.applicationStatus;
          if (!status) return <span>N/A</span>;
          const fsmKey = `CS_COMMON_FSM_${status}`;
          const commonKey = `CS_COMMON_${status}`;
          const label = t(fsmKey) !== fsmKey ? t(fsmKey) : t(commonKey) !== commonKey ? t(commonKey) : status;
          return <span>{label}</span>;
        },
      },
    ],
    [t]
  );

  if (isLoading) {
    return (
      <React.Fragment>
        <Header>{t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")}</Header>
        <Loader />
      </React.Fragment>
    );
  }

  if (isError) {
    return (
      <React.Fragment>
        <Header>{t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")}</Header>
        <Card>
          <p style={{ textAlign: "center", margin: "16px 0", color: "#d4351c" }}>
            {t("CS_SOMETHING_WENT_WRONG", "Something went wrong while fetching applications.")}
          </p>
        </Card>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div>
        <Header>{`${t("CS_FSM_APPLICATION_TITLE_MY_APPLICATION")}${safeApplicationsList?.length > 0 ? ` (${safeApplicationsList.length})` : ""}`}</Header>
        {safeApplicationsList?.length > 0 && (
          <div style={{ marginTop: "16px", overflowX: "auto" }}>
            <Table
              t={t}
              data={safeApplicationsList}
              columns={columns}
              getCellProps={(cellInfo) => ({
                style: {
                  minWidth: "130px",
                  padding: "16px 20px",
                  fontSize: "14px",
                },
              })}
              isPaginationRequired={safeApplicationsList.length > 10}
              totalRecords={safeApplicationsList.length}
              disableSort={false}
              autoSort={false}
            />
          </div>
        )}
        {safeApplicationsList?.length === 0 && (
          <Card>
            <p style={{ textAlign: "center", margin: "16px 0", fontSize: "16px", color: "#505A5F" }}>
              {t("CS_MYAPPLICATIONS_NO_APPLICATION", "No Applications Found")}
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
              <Link to="/digit-ui/citizen/fsm/new-application">
                <SubmitBar label={t("CS_HOME_APPLY_FOR_DESLUDGING", "Apply for Desludging")} />
              </Link>
            </div>
          </Card>
        )}
        {safeApplicationsList?.length > 0 && (
          <p style={{ marginLeft: "16px", marginTop: "24px" }}>
            {t("CS_NOT_ABLE_TO_FIND_THE_APPLICATION", "Not able to find your application?")}{" "}
            <span className="link" style={{ display: "block", marginTop: "8px" }}>
              <Link to="/digit-ui/citizen/fsm/new-application">
                {t("CS_HOME_APPLY_FOR_DESLUDGING", "Apply for Desludging")}
              </Link>
            </span>
          </p>
        )}
      </div>
    </React.Fragment>
  );
};
