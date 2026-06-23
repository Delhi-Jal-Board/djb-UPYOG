import React from "react";
export function formReducer(state, payload) {
  const storageKey = "EKYC.SW.INBOX";

  // ✅ safety for SLA
  switch (payload.action) {
    case "mutateSearchForm":
      Digit.SessionStorage.set(storageKey, { ...state, searchForm: payload.data });
      return { ...state, searchForm: payload.data };

    case "mutateFilterForm":
      Digit.SessionStorage.set(storageKey, { ...state, filterForm: payload.data });
      return { ...state, filterForm: payload.data };

    case "mutateTableForm":
      Digit.SessionStorage.set(storageKey, { ...state, tableForm: payload.data });
      return { ...state, tableForm: payload.data };

    default:
      return state; // ✅ IMPORTANT
  }
}

export const formInitValue = {
  filterForm: {},
  searchForm: {},
  tableForm: {
    limit: 10,
    offset: 0,
    sortBy: "createdTime",
    sortOrder: "DESC",
  },
};

export const tableColumnConfig = (t, handleReview) => [
  {
    Header: t("SURVEYOR_NAME"),
    accessor: "surveyorName",
    Cell: ({ row }) => {
      const id = row.original?.id;
      return (
        <span className="ekyc-application-link" style={{ color: "#318ED0", cursor: "pointer", fontSize: "16px" }} onClick={() => handleReview(id)}>
          {row.original?.surveyorName || row.original?.name || "NA"}
        </span>
      );
    },
  },
  // {
  //   Header: t("SURVEYOR_NAME"),
  //   accessor: "surveyorName",
  //   Cell: ({ row }) => <span>{row.original?.surveyorName || row.original?.name || "NA"}</span>,
  // },
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
