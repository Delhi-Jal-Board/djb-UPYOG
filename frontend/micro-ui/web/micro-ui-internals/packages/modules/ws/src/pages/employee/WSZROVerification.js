import React, { useState } from "react";
import { Table, Card, Loader, SearchField, TextInput, SearchForm, SubmitBar } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const WSZROVerification = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [connectionNo, setConnectionNo] = useState("");
  const [filters, setFilters] = useState({
    status: "PENDING",
    offset: 0,
    limit: 20,
  });

  const { isLoading, data } = Digit.Hooks.ws.useWSZROVerification({
    tenantId,
    filters,
    config: {
      select: (res) => res?.cases || [],
    },
  });

  const onSubmit = (e) => {
    if (e) e.preventDefault();
    const newFilters = { status: "PENDING", offset: 0, limit: 20 };
    if (connectionNo?.trim()) {
      newFilters.connectionNo = connectionNo.trim();
    }
    setFilters(newFilters);
  };

  const clearSearch = () => {
    setConnectionNo("");
    setFilters({ status: "PENDING", offset: 0, limit: 20 });
  };

  const columns = React.useMemo(
    () => [
      {
        Header: t("WS_CONNECTION_NO_LABEL"),
        accessor: "connectionNo",
        Cell: ({ row }) => {
          return (
            <Link
              to={{
                pathname: `/digit-ui/employee/ws/zro-verification-details`,
                search: `?connectionNumber=${row.original?.connectionNo}&tenantId=${tenantId}`,
                state: { caseData: row.original },
              }}
              style={{ color: "#f47738", textDecoration: "none" }}
            >
              {row.original?.connectionNo || "NA"}
            </Link>
          );
        },
      },
      {
        Header: t("WS_BILLING_PERIOD_LABEL"),
        Cell: ({ row }) => {
          const from = row.original?.billingPeriodFrom ? Digit.DateUtils.ConvertTimestampToDate(row.original.billingPeriodFrom) : "NA";
          const to = row.original?.billingPeriodTo ? Digit.DateUtils.ConvertTimestampToDate(row.original.billingPeriodTo) : "NA";
          return <span>{`${from} - ${to}`}</span>;
        },
      },
      {
        Header: t("WS_PREVIOUS_READING_LABEL"),
        accessor: "previousReading",
        Cell: ({ row }) => row.original?.previousReading ?? "NA",
      },
      {
        Header: t("WS_CURRENT_READING_LABEL"),
        accessor: "currentReading",
        Cell: ({ row }) => row.original?.currentReading ?? "NA",
      },
      {
        Header: t("WS_CONSUMPTION_LABEL"),
        accessor: "actualConsumption",
        Cell: ({ row }) => row.original?.actualConsumption ?? "NA",
      },
      {
        Header: t("WS_COMMON_TABLE_COL_APP_STATUS_LABEL"),
        accessor: "verification.status",
        Cell: ({ row }) => (row.original?.verification?.status ? t(`WS_ZRO_STATUS_${row.original.verification.status}`) : "NA"),
      },
    ],
    [t]
  );

  return (
    <React.Fragment>
      <Card>
        <SearchForm 
          onSubmit={onSubmit} 
          handleSubmit={(fn) => fn} 
          className="formcomposer-section-grid"
        >
          <SearchField>
            <label>{t("WS_CONNECTION_NO_LABEL")}</label>
            <TextInput
              name="connectionNo"
              value={connectionNo}
              onChange={(e) => setConnectionNo(e.target.value)}
            />
          </SearchField>

          <SearchField className="ws-submit">
            <SubmitBar label={t("ES_COMMON_SEARCH")} submit={true} className="submit-bar generic-button" />
            <button
              type="button"
              className="clear-search generic-button"
              onClick={clearSearch}
            >
              {t("ES_COMMON_CLEAR_SEARCH")}
            </button>
          </SearchField>
        </SearchForm>
      </Card>

      {isLoading ? (
        <Loader />
      ) : (
        <Table
          t={t}
          data={data || []}
          totalRecords={data?.length || 0}
          isLoading={isLoading}
          isPaginationRequired={true}
          csvExportData={data}
          columns={columns}
        />
      )}
    </React.Fragment>
  );
};

export default WSZROVerification;
