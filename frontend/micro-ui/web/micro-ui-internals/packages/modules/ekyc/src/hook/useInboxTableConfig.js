import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

const useInboxTableConfig = ({
  parentRoute,
  onPageSizeChange,
  formState,
  totalCount,
  table,
  dispatch,
  checkPathName,
  onSortingByData,
  tenantId,
  inboxStyles = {},
  tableStyle = {},
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [selectedKno, setSelectedKno] = useState("");
  const { data: reviewData, getReview } = Digit.Hooks.ekyc.useEkycAPI("review", tenantId);
  const handleReview = (kno) => {
    setSelectedKno(kno);
    getReview({ kno });
  };

  const limit = formState?.tableForm?.limit || 10;
  const offset = formState?.tableForm?.offset || 0;
  const userType = Digit.SessionStorage.get("User")?.info?.type?.toLowerCase() || "citizen";

  React.useEffect(() => {
    if (reviewData) {
      history.push(`/digit-ui/${userType}/ekyc/review/${selectedKno}`, { aadhaarData: reviewData?.aadhaarData, reviewData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewData]);

  const tableColumnConfig = [
    {
      Header: t("EKYC_APPLICATION_NO"),
      accessor: "applicationNumber",
      disableSortBy: true,
      Cell: ({ row }) => {
        const kno = row.original?.kno || row.original?.applicationNumber || "NA";
        return (
          <span className="ekyc-application-link" onClick={() => handleReview(kno)}>
            {kno}
          </span>
        );
      },
    },
    {
      Header: t("EKYC_CITIZEN_NAME"),
      accessor: "citizenName",
      Cell: ({ row }) => <span>{row.original?.citizenName || "NA"}</span>,
    },
    {
      Header: t("EKYC_STATUS"),
      accessor: "actionStatus",
      Cell: ({ row }) => {
        const status = row.original?.status || "DEFAULT";
        return <span className={`ekyc-status-tag ${status}`}>{t(`${status}`)}</span>;
      },
    },
    {
      Header: t("EKYC_EKYC_STATUS"),
      accessor: "ekycStatus",
      Cell: ({ row }) => {
        const ekycStatus = (row.original?.ekycStatus || row.original?.ekycstatus || "NA").toUpperCase();
        return <span className={`ekyc-status-tag ${ekycStatus}`}>{t(`${ekycStatus}`)}</span>;
      },
    },
    {
      Header: t("EKYC_REVIEW"),
      accessor: "review",
      Cell: ({ row }) => {
        const kno = row.original?.kno || row.original?.applicationNumber || "NA";
        return (
          <span
            className="ekyc-application-link"
            style={{ color: "#add8f7", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => handleReview(kno)}
          >
            {t("EKYC_REVIEW")}
          </span>
        );
      },
    },
  ];

  return {
    disableSort: false,
    autoSort: false,
    manualPagination: true,
    initSortId: "applicationDate",
    onPageSizeChange: onPageSizeChange,
    currentPage: offset,
    onNextPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: { ...formState.tableForm, offset: parseInt(formState.tableForm?.offset) + limit },
        checkPathName,
      }),
    onPrevPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: { ...formState.tableForm, offset: parseInt(formState.tableForm?.offset) - limit },
        checkPathName,
      }),
    pageSizeLimit: limit,
    onSort: onSortingByData,
    // sortParams: [{id: getValues("sortBy"), desc: getValues("sortOrder") === "DESC" ? true : false}],
    totalRecords: totalCount,
    onSearch: formState?.searchForm?.message,
    onLastPage: () =>
      dispatch({
        action: "mutateTableForm",
        data: { ...formState.tableForm, offset: Math.max(0, Math.floor((totalCount - 1) / limit) * limit) },
        checkPathName,
      }),
    onFirstPage: () => dispatch({ action: "mutateTableForm", data: { ...formState.tableForm, offset: 0 }, checkPathName }),
    // globalSearch: {searchForItemsInTable},
    // searchQueryForTable,
    data: table,
    columns: tableColumnConfig,
    inboxStyles: { ...inboxStyles },
    tableStyle: { ...tableStyle },
  };
};

export default useInboxTableConfig;
