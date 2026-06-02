import React from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SupervisorInboxTableConfig = ({
  onPageSizeChange,
  formState,
  totalCount,
  table,
  dispatch,
  checkPathName,
  onSortingByData,
  inboxStyles = {},
  tableStyle = {},
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";

  const handleReview = (id) => {
    history.push(`/digit-ui/${userType}/ekyc/assign/surveyor-details/${id}`);
  };

  const limit = formState?.tableForm?.limit || 10;
  const offset = formState?.tableForm?.offset || 0;

  const tableColumnConfig = [
    {
      Header: t("SURVEYOR_ID"),
      accessor: "id",
      Cell: ({ row }) => {
        const id = row.original?.id;
        return (
          <span
            className="ekyc-application-link"
            style={{ color: "#add8f7", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => handleReview(id)}
          >
            {id || "NA"}
          </span>
        );
      },
    },

    {
      Header: t("SURVEYOR_NAME"),
      accessor: "surveyorName",
      Cell: ({ row }) => <span>{row.original?.surveyorName || row.original?.name || "NA"}</span>,
    },

    {
      Header: t("MOBILE_NUMBER"),
      accessor: "mobileNo",
      Cell: ({ row }) => <span>{row.original?.mobileNo || row.original?.owner?.mobileNumber || "NA"}</span>,
    },

    {
      Header: t("STATUS"),
      accessor: "status",
      Cell: ({ row }) => {
        const status = row.original?.status || "DEFAULT";
        return <span className={`ekyc-status-tag ${status}`}>{t(status)}</span>;
      },
    },

    {
      Header: t("SERVICE_TYPE"),
      accessor: "serviceType",
      Cell: ({ row }) => <span>{row.original?.serviceType || "NA"}</span>,
    },
  ];

  return {
    getCellProps: () => ({
      style: {
        padding: "8px",
        fontSize: "12px",
      },
    }),

    disableSort: false,
    autoSort: false,
    manualPagination: true,

    currentPage: Math.floor(offset / limit),

    onPageSizeChange,

    onNextPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Number(offset) + Number(limit),
        },
        checkPathName,
      }),

    onPrevPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Number(offset) - Number(limit),
        },
        checkPathName,
      }),

    onLastPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: {
          ...formState.tableForm,
          offset: Math.ceil(totalCount / limit) * limit - Number(limit),
        },
        checkPathName,
      }),

    onFirstPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: { ...formState.tableForm, offset: 0 },
        checkPathName,
      }),

    totalRecords: totalCount,
    onSort: onSortingByData,

    data: table,
    columns: tableColumnConfig,

    inboxStyles: { ...inboxStyles },
    tableStyle: { ...tableStyle },
  };
};

export default SupervisorInboxTableConfig;
