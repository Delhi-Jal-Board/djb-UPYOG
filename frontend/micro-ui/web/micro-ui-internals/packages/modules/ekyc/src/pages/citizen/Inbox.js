import React, { useMemo, useCallback, useReducer } from "react";
import { useLocation } from "react-router-dom";
import { InboxComposer } from "@djb25/digit-ui-react-components";
import useInboxTableConfig from "../../hook/useInboxTableConfig";
import SearchFormFieldsComponents from "../../components/SearchFormFieldsComponent";

// Mock data removed in favor of API integration

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

  const queryParams = useMemo(() => {
    return {
      tenantId,
      offset: formState?.tableForm?.offset || 0,
      limit: formState?.tableForm?.limit || 10,
      search: formState?.searchForm || {},
    };
  }, [tenantId, formState?.tableForm?.offset, formState?.tableForm?.limit, formState?.searchForm]);

  const filters = useMemo(() => {
    const searchForm = formState?.searchForm || {};
    return {
      ...searchForm,
      ...(searchForm.kNumber && { kno: searchForm.kNumber }),
    };
  }, [formState?.searchForm]);

  const { isLoading, data: dashboardData = {} } = Digit.Hooks.ekyc.useEkycApplicationList(filters, queryParams, {
    enabled: !!tenantId,
    keepPreviousData: true,
  });

  const searchDetails = useMemo(
    () => ({
      kno: formState?.searchForm?.kNumber || "",
      name: formState?.searchForm?.kName || "",
    }),
    [formState?.searchForm?.kNumber, formState?.searchForm?.kName]
  );

  const isSearchActive = !!(searchDetails.kno || searchDetails.name);

  const { isLoading: isSearchLoading, data: searchData } = Digit.Hooks.ekyc.useSearchConnection(
    {
      tenantId,
      details: searchDetails,
    },
    {
      enabled: !!tenantId && !!searchDetails.kno, // 🔥 important
      keepPreviousData: true,
    }
  );

  const sourceData = useMemo(() => {
    if (isSearchActive) {
      if (!searchData) return [];
      return [searchData];
    }

    return dashboardData?.consumerList || [];
  }, [isSearchActive, searchData, dashboardData]);

  const filteredData = useMemo(() => {
    return (sourceData || []).map((item) => {
      // ✅ detect search response
      const isSearchItem = !!item.connectionDetails;

      if (isSearchItem) {
        return {
          applicationNo: item.propertyInfo?.kno || "",
          connectionNo: item.propertyInfo?.kno || "",
          owner: item.connectionDetails?.consumerName || "",
          applicationNumber: item.propertyInfo?.kno || "",
          citizenName: item.connectionDetails?.consumerName || "",
          status: item.connectionDetails?.statusflag || "",
          ekycStatus: item.connectionDetails?.ekycStatus || item.connectionDetails?.ekycstatus || item.ekycStatus || item.ekycstatus || "NA",
          sla: 0,
        };
      }

      // ✅ dashboard mapping
      return {
        ...item,
        applicationNo: item.kno || item.applicationNumber || "",
        connectionNo: item.connectionNo || "",
        owner: item.consumerName || item.citizenName || "",
        applicationNumber: item.kno || item.applicationNumber || "",
        citizenName: item.consumerName || item.citizenName || "",
        status: item.status || "",
        ekycStatus: item.ekycStatus || item.ekycstatus || "NA",
        sla: item.sla ?? 0,
      };
    });
  }, [sourceData]);

  const totalRecords = dashboardData?.dashboardInfo?.totalRecords || dashboardData?.totalCount || 0;

  const checkPathName = location.pathname.includes("ekyc/inbox");
  // const PropsForInboxLinks = {
  //   headerText: "EKYC_MODULE",
  // };

  const SearchFormFields = useCallback(
    ({ registerRef, searchFormState, controlSearchForm }) => (
      <SearchFormFieldsComponents {...{ registerRef, searchFormState, controlSearchForm }} className="search" />
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

  // const FilterFormFields = useCallback(
  //   ({ registerRef, controlFilterForm, setFilterFormValue, getFilterFormValue }) => <React.Fragment></React.Fragment>,
  //   []
  // );

  // const propsForFilterForm = {
  //   FilterFormFields,
  //   onFilterFormSubmit: () => { },
  //   filterFormDefaultValues: "",
  //   resetFilterFormDefaultValues: "",
  //   onFilterFormReset: () => { },
  // };

  function formReducer(state, payload) {
    const storageKey = payload.checkPathName ? "EKYC.INBOX" : "EKYC.SW.INBOX";

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

  const isInboxLoading = isLoading || isSearchLoading;

  return (
    <div className="app-container">
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
        }}
      />
    </div>
  );
};

export default Inbox;
