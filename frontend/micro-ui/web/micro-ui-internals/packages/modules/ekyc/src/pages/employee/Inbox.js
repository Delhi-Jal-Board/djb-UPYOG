import React, { useMemo, useCallback, useReducer } from "react";
import { useLocation } from "react-router-dom";
import { InboxComposer } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { FaUsers, FaCheckCircle, FaClock } from "react-icons/fa";
import useInboxTableConfig from "../../hook/useInboxTableConfig";
import SearchFormFieldsComponents from "../../components/SearchFormFieldsComponent";
// import useInboxMobileCardsData from "../../hook/useInboxMobileCardsData";

const StatCard = ({ title, value, type, isLoading, icon, color }) => (
  <div style={{ borderColor: color }} className={`stat-card ${type}`}>
    {isLoading ? (
      <React.Fragment>
        <div className="stat-title skeleton skeleton-text"></div>
        <div className="stat-value skeleton skeleton-number"></div>
      </React.Fragment>
    ) : (
      <React.Fragment>
        <div className="stat-title">{title}</div>
        <div style={{ color: color }} className="stat-value">
          {value}
        </div>
        {icon && <div className="stat-icon">{icon}</div>}
      </React.Fragment>
    )}
  </div>
);

const Inbox = ({ parentRoute }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const location = useLocation();

  const formInitValue = {
    filterForm: {},
    searchForm: {},
    tableForm: {
      limit: 10,
      offset: 0,
      sortBy: "createdTime",
      sortOrder: "DESC",
    },
  };

  const [formState, dispatch] = useReducer(formReducer, formInitValue);

  const filters = useMemo(() => {
    const searchForm = formState?.searchForm || {};
    return {
      ...searchForm,
      ...(searchForm.kNumber && { kno: searchForm.kNumber }),
    };
  }, [formState?.searchForm]);

  const queryParams = useMemo(() => {
    return {
      tenantId,
      offset: formState?.tableForm?.offset || 0,
      limit: formState?.tableForm?.limit || 10,
    };
  }, [tenantId, formState?.tableForm?.offset, formState?.tableForm?.limit]);

  const { isLoading: isListLoading, data: listData = {} } = Digit.Hooks.ekyc.useEkycApplicationList(filters, queryParams, {
    enabled: !!tenantId,
    keepPreviousData: true,
  });

  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    { tenantId, allVendorsDetailed: true },
    {
      enabled: !!tenantId,
      keepPreviousData: true,
    }
  );

  const filteredData = (listData?.consumerList || []).map((item) => {
    const fullName = [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ");
    return {
      ...item,
      applicationNo: item.kno || item.applicationNumber || "",
      connectionNo: item.kno || "",
      owner: fullName || item.consumerName || item.citizenName || "",
      applicationNumber: item.kno || item.applicationNumber || "",
      citizenName: fullName || item.consumerName || item.citizenName || "",
      status: item.status || "",
      ekycStatus: (item.ekycStatus || item.ekycstatus || "NA").toUpperCase(),
      sla: item.sla ?? 0,
    };
  });

  const { t } = useTranslation();

  const cards = [
    {
      label: t("EKYC_TOTAL"),
      count: progressData?.totalKnosInZones || 0,
      color: "#0B2559",
      type: "today",
      icon: <FaUsers />,
    },
    {
      label: t("EKYC_COMPLETED"),
      count: progressData?.completedKnosInZones || 0,
      color: "#2E8B57",
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: t("EKYC_SUBMITTED_BY_VENDORS"),
      count: progressData?.submittedKnosInZones || 0,
      color: "#8B5CF6",
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: t("EKYC_SUBMITTED_BY_CITIZEN"),
      count: progressData?.selfEkycCountInZones || 0,
      color: "#2775DD",
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: t("EKYC_PENDING"),
      count: progressData?.pendingKnosInZones || 0,
      color: "#F59E0B",
      type: "pending",
      icon: <FaClock />,
    },
    // {
    //   label: t("OVERALL_PROGRESS"),
    //   count: `${progressData?.overallProgressPercent || 0}%`,
    //   color: "#A855F7",
    //   type: "progress",
    //   icon: <FaChartLine />,
    // },
  ];

  const totalRecords = listData?.totalCount || 0;

  const checkPathName = location.pathname.includes("ekyc/inbox");

  const SearchFormFields = useCallback(
    ({ registerRef, searchFormState, controlSearchForm }) => (
      <SearchFormFieldsComponents {...{ registerRef, searchFormState, controlSearchForm }} searchType="kno" className="search" />
    ),
    []
  );

  const tableOrderFormDefaultValues = {
    sortBy: "createdTime",
    limit: window.Digit.Utils.browser.isMobile() ? 50 : 10,
    offset: 0,
    sortOrder: "DESC",
  };

  const onSearchFormSubmit = (data) => {
    data.hasOwnProperty("") && delete data?.[""];
    dispatch({ action: "mutateTableForm", data: { ...tableOrderFormDefaultValues }, checkPathName });
    dispatch({ action: "mutateSearchForm", data, checkPathName });
  };

  const searchFormDefaultValues = {
    kNumber: "",
    applicationNumber: "",
    consumerNo: "",
  };

  const onSearchFormReset = (setSearchFormValue) => {
    setSearchFormValue("kNumber", null);
    setSearchFormValue("applicationNumber", null);
    setSearchFormValue("consumerNo", null);
    dispatch({ action: "mutateSearchForm", data: searchFormDefaultValues });
  };

  const propsForSearchForm = {
    SearchFormFields,
    onSearchFormSubmit,
    searchFormDefaultValues: formState?.searchForm,
    resetSearchFormDefaultValues: searchFormDefaultValues,
    onSearchFormReset,
    className: "search-form-wns-inbox",
  };

  function formReducer(state, payload) {
    // ✅ safety for SLA
    switch (payload.action) {
      case "mutateSearchForm":
        Digit.SessionStorage.set("EKYC.INBOX", { ...state, searchForm: payload.data });
        return { ...state, searchForm: payload.data };

      case "mutateFilterForm":
        Digit.SessionStorage.set("EKYC.INBOX", { ...state, filterForm: payload.data });
        return { ...state, filterForm: payload.data };

      case "mutateTableForm":
        Digit.SessionStorage.set("EKYC.INBOX", { ...state, tableForm: payload.data });
        return { ...state, tableForm: payload.data };

      default:
        return state; // ✅ IMPORTANT
    }
  }

  const onPageSizeChange = (e) => {
    const newLimit = Number(e.target.value);

    dispatch({
      action: "mutateTableForm",
      data: {
        ...formState.tableForm,
        limit: newLimit,
        offset: 0, // reset page
      },
      checkPathName,
    });
  };

  const onSortingByData = (e) => {
    if (e.length > 0) {
      const [{ id, desc }] = e;
      const sortOrder = desc ? "DESC" : "ASC";
      const sortBy = id;

      if (!(formState.tableForm.sortBy === sortBy && formState.tableForm.sortOrder === sortOrder)) {
        dispatch({
          action: "mutateTableForm",
          data: {
            ...formState.tableForm,
            sortBy: id,
            sortOrder: desc ? "DESC" : "ASC",
          },
          checkPathName,
        });
      }
    }
  };

  const propsForInboxTable = useInboxTableConfig({
    ...{
      parentRoute,
      onPageSizeChange,
      formState,
      totalCount: totalRecords,
      table: filteredData,
      dispatch,
      onSortingByData,
      tenantId,
      checkPathName,
      inboxStyles: { overflowX: "scroll", overflowY: "hidden" },
      tableStyle: { width: "70%" },
    },
  });

  // const onMobileSortOrderData = (data) => {
  //   const { sortOrder } = data;
  //   dispatch({ action: "mutateTableForm", data: { ...formState.tableForm, sortOrder } });
  // };

  // const onSortFormReset = (setSortFormValue) => {
  //   setSortFormValue("sortOrder", "DESC");
  //   dispatch({ action: "mutateTableForm", data: tableOrderFormDefaultValues });
  // };

  // const propsForMobileSortForm = { onMobileSortOrderData, sortFormDefaultValues: formState?.tableForm, onSortFormReset };
  // const propsForInboxMobileCards = useInboxMobileCardsData({ table: filteredData, tenantId });

  const isInboxLoading = isListLoading;

  return (
    <div className="app-container">
      {/* Stats */}
      <div className="surveyor-dashboard" style={{ overflowY: "visible", marginBottom: "24px" }}>
        <div className="stats-wrapper">
          {cards.map((card, idx) => (
            <StatCard
              key={idx}
              title={t(card.label)}
              value={card.count}
              type={card.type}
              isLoading={isProgressLoading}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </div>
      </div>

      <InboxComposer
        {...{
          isInboxLoading,
          // PropsForInboxLinks,
          ...propsForSearchForm,
          // ...propsForFilterForm,
          // ...propsForMobileSortForm,
          propsForInboxTable,
          // propsForInboxMobileCards,
          formState,
          countData: listData,
          forceTable: true,
          showSearchOnMobile: true,
        }}
      />
    </div>
  );
};

export default Inbox;
