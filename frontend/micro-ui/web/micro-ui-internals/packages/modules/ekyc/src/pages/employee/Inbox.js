import React, { useMemo, useCallback, useReducer } from "react";
import { useLocation } from "react-router-dom";
import { InboxComposer } from "@djb25/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { FaUsers, FaCheckCircle, FaClock, FaChartLine } from "react-icons/fa";
import useInboxTableConfig from "../../hook/useInboxTableConfig";
import SearchFormFieldsComponents from "../../components/SearchFormFieldsComponent";
import useInboxMobileCardsData from "../../hook/useInboxMobileCardsData";

const StatCard = ({ title, value, type, isLoading, icon }) => (
  <div className={`stat-card ${type}`}>
    {isLoading ? (
      <React.Fragment>
        <div className="stat-title skeleton skeleton-text"></div>
        <div className="stat-value skeleton skeleton-number"></div>
      </React.Fragment>
    ) : (
      <React.Fragment>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
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

  // Fetch vendors from DSO search to get vendor ID for progress API
  const { data: vendorSearchResponse } = Digit.Hooks.fsm.useDsoSearch(
    tenantId,
    { status: "ACTIVE" },
    { enabled: !!tenantId, staleTime: 300000 }
  );

  const { targetVendorId, allVendorIds } = useMemo(() => {
    if (!vendorSearchResponse || vendorSearchResponse.length === 0) {
      return { targetVendorId: null, allVendorIds: [] };
    }
    const loggedInUser = Digit.SessionStorage.get("User")?.info;
    const userUuid = loggedInUser?.uuid;
    const userMobile = loggedInUser?.mobileNumber;
    const matchesUser = (v) => {
      const ownerUuid = v.owner?.uuid || v.owner?.id;
      const ownerMobile = v.owner?.mobileNumber || v.mobileNumber;
      return (userUuid && ownerUuid === userUuid) || (userMobile && ownerMobile === userMobile);
    };

    const allIds = vendorSearchResponse
      .map((v) => {
        const dso = v.dsoDetails || v;
        return dso.id || dso.vendorId || v.id || v.vendorId;
      })
      .filter(Boolean);

    const matched = vendorSearchResponse.find((v) => matchesUser(v.dsoDetails || v));
    let matchedId = null;
    if (matched) {
      const dso = matched.dsoDetails || matched;
      matchedId = dso.id || dso.vendorId || matched.id || matched.vendorId;
    }

    return { targetVendorId: matchedId, allVendorIds: allIds };
  }, [vendorSearchResponse]);

  const { isLoading: isProgressLoading, data: progressData } = Digit.Hooks.ekyc.useEkycAssignmentProgress(
    { tenantId },
    {
      enabled: !!tenantId,
      keepPreviousData: true,
    }
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

  const sourceData = useMemo(() => {
    if (isSearchActive) {
      if (!searchData) return [];
      return [searchData];
    }

    return listData?.consumerList || [];
  }, [isSearchActive, searchData, listData]);

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
          ekycStatus: (
            item.connectionDetails?.ekycStatus ||
            item.connectionDetails?.ekycstatus ||
            item.ekycStatus ||
            item.ekycstatus ||
            "NA"
          ).toUpperCase(),
          sla: 0,
        };
      }

      // ✅ dashboard mapping
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
  }, [sourceData]);


  const { t } = useTranslation();

  const progressMetrics = useMemo(() => {
    if (!progressData) return { totalKnos: 0, submittedKnos: 0, pendingKnos: 0, progressPercent: 0 };

    const totalKnos = progressData?.totalKnos ?? progressData?.totalAssignments ?? 0;
    const submittedKnos = progressData?.completedKnos ?? progressData?.submittedKnos ?? 0;
    const pendingKnos = progressData?.pendingKnos ?? (totalKnos >= submittedKnos ? totalKnos - submittedKnos : 0);
    const progressPercent = progressData?.overallProgressPercent ?? progressData?.progressPercent ?? (totalKnos > 0 ? ((submittedKnos / totalKnos) * 100).toFixed(1) : 0);

    return {
      totalKnos,
      submittedKnos,
      pendingKnos,
      progressPercent,
    };
  }, [progressData]);

  const cards = useMemo(() => [
    {
      label: t("TOTAL_EKYC_APPLICATIONS"),
      count: progressMetrics?.totalKnos || 0,
      color: "#0B2559",
      type: "today",
      icon: <FaUsers />,
    },
    {
      label: t("EKYC_COMPLETED"),
      count: progressMetrics?.submittedKnos || 0,
      color: "#10B981",
      type: "month",
      icon: <FaCheckCircle />,
    },
    {
      label: t("PENDING_APPLICATIONS"),
      count: progressMetrics?.pendingKnos || 0,
      color: "#F59E0B",
      type: "pending",
      icon: <FaClock />,
    },
    {
      label: t("OVERALL_PROGRESS"),
      count: `${progressMetrics?.progressPercent || 0}%`,
      color: "#A855F7",
      type: "progress",
      icon: <FaChartLine />,
    },
  ], [progressMetrics, t]);
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

  const onMobileSortOrderData = (data) => {
    const { sortOrder } = data;
    dispatch({ action: "mutateTableForm", data: { ...formState.tableForm, sortOrder } });
  };

  const onSortFormReset = (setSortFormValue) => {
    setSortFormValue("sortOrder", "DESC");
    dispatch({ action: "mutateTableForm", data: tableOrderFormDefaultValues });
  };

  const propsForMobileSortForm = { onMobileSortOrderData, sortFormDefaultValues: formState?.tableForm, onSortFormReset };
  const propsForInboxMobileCards = useInboxMobileCardsData({ table: filteredData, tenantId });

  const isInboxLoading = isListLoading || isSearchLoading;

  return (
    <div className="app-container">
      {/* Stats */}
      <div className="surveyor-dashboard" style={{ overflowY: "visible", marginBottom: "24px" }}>
        <div className="stats-wrapper" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {cards.map((card, idx) => (
            <StatCard
              key={idx}
              title={t(card.label)}
              value={card.count}
              type={card.type}
              isLoading={isProgressLoading}
              icon={card.icon}
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
          ...propsForMobileSortForm,
          propsForInboxTable,
          propsForInboxMobileCards,
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
