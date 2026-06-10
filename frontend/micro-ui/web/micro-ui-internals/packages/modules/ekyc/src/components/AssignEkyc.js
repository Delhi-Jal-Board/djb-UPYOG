import React, { useMemo, useCallback, useReducer, useState } from "react";
import { useLocation } from "react-router-dom";
import { InboxComposer } from "@djb25/digit-ui-react-components";
import SupervisorInboxTableConfig from "../hook/SupervisorInboxTableConfig";
import SearchFormFieldsComponents from "./SearchFormFieldsComponent";

// Mock data removed in favor of API integration

const AssignEkyc = () => {
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
  const userDetails = Digit.SessionStorage.get("User");

  let paginationParms = {
    limit: formState?.tableForm?.limit || 10,
    offset: formState?.tableForm?.offset || 0,
    sortBy: formState?.tableForm?.sortBy || "createdTime",
    sortOrder: formState?.tableForm?.sortOrder || "DESC",
  };

  const { data: dashboardData, isLoading } = Digit.Hooks.fsm.useSurveyorSearch(
    tenantId,
    { ...paginationParms, status: "ACTIVE,DISABLED", vendorId: userDetails?.info?.uuid },
    { enabled: !!tenantId, keepPreviousData: true }
  );

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
  const { isLoading: isDataSearchLoading, data } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    {},
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

    return dashboardData?.surveyors || [];
  }, [isSearchActive, searchData, dashboardData]);

  const filteredData = useMemo(() => {
    return (sourceData || []).map((item) => {
      const owner = item?.owner || {};

      const roleCodes = owner?.roles?.map((role) => role.code)?.join(", ") || "";

      return {
        ...item,

        id: item?.id || "",

        surveyorName: item?.name || owner?.name || "",

        mobileNo: item?.mobileNo || owner?.mobileNumber || "",

        email: owner?.emailId || "",

        vendorId: item?.vendorId || "",

        tenantId: item?.tenantId || "",

        supervisorId: item?.supervisorId || "",

        status: item?.status || "",

        roleCodes,

        userName: owner?.userName || "",

        gender: owner?.gender || "",

        serviceType: item?.additionalDetails?.serviceType || "",

        createdTime: item?.auditDetails?.createdTime || 0,

        lastModifiedTime: item?.auditDetails?.lastModifiedTime || 0,
      };
    });
  }, [sourceData]);

  const totalRecords = dashboardData?.dashboardInfo?.totalRecords || dashboardData?.totalCount || 0;

  const checkPathName = location.pathname.includes("ekyc/inbox");
  const PropsForInboxLinks = {
    headerText: checkPathName ? "EKYC_MODULE" : "MODULE_SW",
  };

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
    mobileNumber: "",
    applicationNumber: "",
    consumerNo: "",
  };

  const onSearchFormReset = (setSearchFormValue) => {
    setSearchFormValue("mobileNumber", null);
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

  const FilterFormFields = useCallback(
    ({ registerRef, controlFilterForm, setFilterFormValue, getFilterFormValue }) => <React.Fragment></React.Fragment>,
    []
  );

  const propsForFilterForm = {
    FilterFormFields,
    onFilterFormSubmit: () => {},
    filterFormDefaultValues: "",
    resetFilterFormDefaultValues: "",
    onFilterFormReset: () => {},
  };

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

  const propsForInboxTable = SupervisorInboxTableConfig({
    ...{
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

  const cards = [
    {
      label: "TOTAL_EKYC_APPLICATIONS",
      count: data?.totalKnos || 0,
      color: "#0B2559",
      filter: null,
      active: true,
    },
    {
      label: "TOTAL_ASSIGNMENTS",
      count: data?.totalAssignments || 0,
      color: "#3B82F6",
      filter: ["ASSIGNED"],
    },
    {
      label: "EKYC_COMPLETED",
      count: data?.completedKnos || 0,
      color: "#10B981",
      filter: ["COMPLETED"],
    },
    {
      label: "PENDING_APPLICATIONS",
      count: (data?.totalKnos || 0) - (data?.completedKnos || 0),
      color: "#F59E0B",
      filter: ["PENDING"],
    },
    {
      label: "OVERALL_PROGRESS",
      count: `${data?.overallProgressPercent || 0}%`,
      color: "#A855F7",
      filter: ["IN_PROGRESS"],
    },
  ];

  return (
    <div className="app-container">
      <InboxComposer
        {...{
          isInboxLoading,
          PropsForInboxLinks,
          ...propsForSearchForm,
          ...propsForFilterForm,
          // ...propsForMobileSortForm,
          propsForInboxTable,
          // propsForInboxMobileCards,
          formState,
          countData: dashboardData?.dashboardInfo,
          cards,
          isCardLoading: isDataSearchLoading,
        }}
      />
    </div>
  );
};

export default AssignEkyc;
