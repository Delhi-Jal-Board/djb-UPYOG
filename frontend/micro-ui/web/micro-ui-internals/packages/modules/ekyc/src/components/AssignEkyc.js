import React, { useMemo, useCallback, useReducer } from "react";
import { InboxComposer } from "@djb25/digit-ui-react-components";
import SupervisorInboxTableConfig from "../hook/SupervisorInboxTableConfig";
import SearchFormFieldsComponents from "./SearchFormFieldsComponent";
import { formInitValue, formReducer } from "../../../vendor/src/config/tableConfig";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine, FaMapMarkedAlt } from "react-icons/fa";
import useInboxMobileCardsData from "../hook/useInboxMobileCardsData";

// Mock data removed in favor of API integration

const AssignEkyc = () => {
  let tenantId = Digit.ULBService.getCurrentTenantId();
  if (!tenantId || tenantId === "dl") {
    tenantId = "dl.djb"; // Force tenantId to dl.djb for EKYC APIs in citizen portal
  }

  const [formState, dispatch] = useReducer(formReducer, formInitValue);

  let paginationParms = {
    limit: formState?.tableForm?.limit || 10,
    offset: formState?.tableForm?.offset || 0,
    sortBy: formState?.tableForm?.sortBy || "createdTime",
    sortOrder: formState?.tableForm?.sortOrder || "DESC",
  };

  const mobileNumber = formState?.searchForm?.mobileNumber || "";
  const isSearchActive = !!mobileNumber;

  const filters = {
    ...paginationParms,
    status: "ACTIVE,DISABLED",
  };

  if (isSearchActive) {
    filters.mobileNumber = mobileNumber;
  }

  const { data: dashboardData, isLoading } = Digit.Hooks.fsm.useSurveyorSearch(tenantId, filters, { enabled: !!tenantId, keepPreviousData: true });

  const { isLoading: isDataSearchLoading, data } = Digit.Hooks.ekyc.useEkycAssignmentProgress({
    enabled: !!tenantId,
    keepPreviousData: true,
  });

  const sourceData = useMemo(() => {
    return dashboardData?.surveyors || [];
  }, [dashboardData]);

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

  // const PropsForInboxLinks = {
  //   headerText: "EKYC_MODULE",
  // };

  const SearchFormFields = useCallback(
    ({ registerRef, searchFormState, controlSearchForm }) => (
      <SearchFormFieldsComponents {...{ registerRef, searchFormState, controlSearchForm }} searchType="mobile" className="search" />
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
    dispatch({ action: "mutateTableForm", data: { ...tableOrderFormDefaultValues } });
    dispatch({ action: "mutateSearchForm", data });
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

  const onPageSizeChange = (e) => {
    const newLimit = Number(e.target.value);

    dispatch({
      action: "mutateTableForm",
      data: {
        ...formState.tableForm,
        limit: newLimit,
        offset: 0, // reset page
      },
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
      inboxStyles: { overflowX: "scroll", overflowY: "hidden" },
      tableStyle: { width: "70%" },
    },
  });

  const isInboxLoading = isLoading;

  const cards = [
    {
      label: "TOTAL_EKYC_APPLICATIONS",
      count: data?.totalKnos || 0,
      color: "#0B2559",
      filter: null,
      active: true,
      type: "today",
      icon: <FaUsers />,
    },
    {
      label: "TOTAL_ASSIGNMENTS",
      count: data?.totalAssignments || 0,
      color: "#3B82F6",
      filter: ["ASSIGNED"],
      type: "week",
      icon: <FaMapMarkedAlt />,
    },
    {
      label: "EKYC_COMPLETED",
      count: data?.completedKnos || 0,
      color: "#10B981",
      filter: ["COMPLETED"],
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: "PENDING_APPLICATIONS",
      count: (data?.totalKnos || 0) - (data?.completedKnos || 0),
      color: "#F59E0B",
      filter: ["PENDING"],
      type: "pending",
      icon: <FaClock />,
    },
    {
      label: "OVERALL_PROGRESS",
      count: `${data?.overallProgressPercent || 0}%`,
      color: "#A855F7",
      filter: ["IN_PROGRESS"],
      type: "progress",
      icon: <FaChartLine />,
    },
  ];


  const onMobileSortOrderData = (data) => {
    const { sortOrder } = data;
    dispatch({ action: "mutateTableForm", data: { ...formState.tableForm, sortOrder } });
  };

  const onSortFormReset = (setSortFormValue) => {
    setSortFormValue("sortOrder", "DESC");
    dispatch({ action: "mutateTableForm", data: tableOrderFormDefaultValues });
  };

  const propsForMobileSortForm = { onMobileSortOrderData, sortFormDefaultValues: formState?.tableForm, onSortFormReset };
  const propsForInboxMobileCards = useInboxMobileCardsData({ table: filteredData, isSupervisor: true });

  return (
    <div className="app-container">
      <InboxComposer
        {...{
          isInboxLoading,
          // PropsForInboxLinks,
          ...propsForSearchForm,
          // ...propsForFilterForm,
          ...propsForMobileSortForm,
          propsForInboxTable,
          propsForInboxMobileCards,
          formState,
          countData: dashboardData?.dashboardInfo,
          // cards,
          isCardLoading: isDataSearchLoading,
        }}
      />
    </div>
  );
};

export default AssignEkyc;
