import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import WTDesktopInbox from "../../components/WTDesktopInbox";
import MobileInbox from "../../components/MobileInbox";

const WT_SORT_FIELD_MAP = {
  bookingNo: "bookingNo",
  applicantName: "applicantName",
  mobileNumber: "mobileNumber",
  localityCode: "localityCode",
  applicationStatus: "applicationStatus",
  bookingStatus: "bookingStatus",
  createdTime: "createdTime",
};

/**
 * `Inbox` is a responsive React component that displays and manages water tanker (WT) service requests.
 * It adapts to mobile and desktop views, allowing users to:
 * - Search, filter, and sort inbox items.
 * - Navigate through paginated results.
 * - Customize table view and filter options.
 *
 * The component uses `useNewInboxGeneral` or `useInboxGeneral` hooks to fetch data, based on the `useNewInboxAPI` flag.
 * It handles empty states, pagination, and sorting, with configurable behavior through various props.
 *
 * @returns {JSX.Element} A responsive inbox for water tanker service requests with search, filter, pagination, and sorting features.
 */
const Inbox = ({
  useNewInboxAPI,
  parentRoute,
  moduleCode,
  detailRoute,
  initialStates = {},
  filterComponent,
  isInbox,
  rawWfHandler,
  rawSearchHandler,
  combineResponse,
  wfConfig,
  searchConfig,
  middlewaresWf,
  middlewareSearch,
  EmptyResultInboxComp,
}) => {
  const tenantId = Digit.ULBService.getCitizenCurrentTenant(true) || Digit.ULBService.getCurrentTenantId();
  const user = Digit.UserService.getUser().info;

  const { t } = useTranslation();
  const [enableSarch, setEnableSearch] = useState(() => (isInbox ? {} : { enabled: false }));
  const [TableConfig, setTableConfig] = useState(() => Digit.ComponentRegistryService?.getComponent("WTInboxTableConfig"));
  const [pageOffset, setPageOffset] = useState(initialStates.pageOffset || 0);
  const [pageSize, setPageSize] = useState(initialStates.pageSize || 10);
  const [sortParams, setSortParams] = useState(initialStates.sortParams || [{ id: "createdTime", desc: true }]);
  const [searchParams, setSearchParams] = useState(initialStates.searchParams || {});
  const resolvedSortBy = WT_SORT_FIELD_MAP[sortParams?.[0]?.id] || sortParams?.[0]?.id || "createdTime";

  let isMobile = window.Digit.Utils.browser.isMobile();
  let paginationParams = isMobile
    ? { limit: 100, offset: 0, sortBy: resolvedSortBy, sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC" }
    : { limit: pageSize, offset: pageOffset, sortBy: resolvedSortBy, sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC" };

  const { isFetching, isLoading: hookLoading, searchResponseKey, data, searchFields, ...rest } = useNewInboxAPI
    ? Digit.Hooks.useNewInboxGeneral({
        tenantId,
        ModuleCode: moduleCode,
        filters: { ...searchParams, ...paginationParams, sortParams },
      })
    : Digit.Hooks.useInboxGeneral({
        tenantId,
        businessService: moduleCode,
        isInbox,
        filters: { ...searchParams, ...paginationParams, sortParams },
        rawWfHandler,
        rawSearchHandler,
        combineResponse,
        wfConfig,
        searchConfig: { ...enableSarch, ...searchConfig },
        middlewaresWf,
        middlewareSearch,
      });

  useEffect(() => {
    if (rest?.revalidate) rest?.revalidate();
    if (rest?.refetch) rest?.refetch();
  }, []);

  useEffect(() => {
    setPageOffset(0);
  }, [searchParams]);

  const fetchNextPage = () => {
    setPageOffset((prevState) => prevState + pageSize);
  };

  const fetchPrevPage = () => {
    setPageOffset((prevState) => prevState - pageSize);
  };

  const handleFilterChange = (filterParam) => {
    let keys_to_delete = filterParam.delete;
    let _new = { ...searchParams, ...filterParam };
    if (keys_to_delete) keys_to_delete.forEach((key) => delete _new[key]);
    delete filterParam.delete;
    setSearchParams({ ..._new });
    setEnableSearch({ enabled: true });
  };

  const handleSort = useCallback((args) => {
    if (!Array.isArray(args) || args.length === 0 || !args[0]?.id) return;
    setSortParams(args);
  }, []);

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
  };

  const buildExportInboxCriteria = useCallback(() => {
    const moduleNameMap = {
      WT: "request-service.water_tanker",
      MT: "request-service.mobile_toilet",
      TP: "request-service.tree_pruning",
    };

    const workflowFilters = {
      moduleName: moduleNameMap[moduleCode] || moduleNameMap.WT,
    };
    const moduleSearchCriteria = {
      isInboxSearch: true,
      creationReason: [""],
    };

    const assignedToMe = searchParams?.uuid?.code === "ASSIGNED_TO_ME";
    const loggedInUserUuid = Digit.UserService.getUser()?.info?.uuid;
    if (assignedToMe && loggedInUserUuid) {
      workflowFilters.assignee = loggedInUserUuid;
    }

    if (Array.isArray(searchParams?.services) && searchParams.services.length > 0) {
      workflowFilters.businessService = searchParams.services;
    }

    if (Array.isArray(searchParams?.applicationStatus) && searchParams.applicationStatus.length > 0) {
      const workflowStatus = searchParams.applicationStatus.map((status) => status?.uuid).filter(Boolean);
      if (workflowStatus.length > 0) {
        workflowFilters.status = workflowStatus;
      }
    }

    if (searchParams?.mobileNumber) {
      moduleSearchCriteria.mobileNumber = searchParams.mobileNumber;
    }

    if (searchParams?.bookingNo) {
      moduleSearchCriteria.bookingNo = searchParams.bookingNo;
    }

    if (searchParams?.vendorName) {
      moduleSearchCriteria.vendorName = searchParams.vendorName;
    }

    if (searchParams?.vehicleName) {
      moduleSearchCriteria.vehicleName = searchParams.vehicleName;
    }

    if (searchParams?.driverName) {
      moduleSearchCriteria.driverName = searchParams.driverName;
    }

    if (searchParams?.fillingPointId) {
      moduleSearchCriteria.fillingPointId = searchParams.fillingPointId;
    }

    if (Array.isArray(searchParams?.locality) && searchParams.locality.length > 0) {
      moduleSearchCriteria.locality = searchParams.locality
        .map((item) => String(item?.code || "").split("_").pop())
        .filter(Boolean);
    }

    if (Array.isArray(sortParams) && sortParams[0]?.id) {
      moduleSearchCriteria.sortBy = WT_SORT_FIELD_MAP[sortParams[0].id] || sortParams[0].id;
      moduleSearchCriteria.sortOrder = sortParams[0].desc ? "DESC" : "ASC";
    }

    return { workflowFilters, moduleSearchCriteria };
  }, [moduleCode, searchParams, sortParams]);

  const getCSVExportData = useCallback(async () => {
    if (!useNewInboxAPI || typeof Digit?.InboxGeneral?.Search !== "function") {
      return Array.isArray(data) ? data : [];
    }

    const { workflowFilters, moduleSearchCriteria } = buildExportInboxCriteria();
    const batchSize = 200;
    let offset = 0;
    let totalCount = Number.POSITIVE_INFINITY;
    const rows = [];

    while (offset < totalCount) {
      const response = await Digit.InboxGeneral.Search({
        inbox: {
          tenantId,
          processSearchCriteria: workflowFilters,
          moduleSearchCriteria,
          limit: batchSize,
          offset,
        },
      });

      const items = Array.isArray(response?.items) ? response.items : [];
      const mappedItems = items.map((item) => ({
        searchData: item?.businessObject || {},
        workflowData: item?.ProcessInstance || {},
        statusMap: response?.statusMap,
        totalCount: response?.totalCount,
      }));

      rows.push(...mappedItems);

      const resolvedTotal = Number(response?.totalCount);
      totalCount = Number.isFinite(resolvedTotal) && resolvedTotal >= 0 ? resolvedTotal : rows.length;

      if (items.length === 0 || items.length < batchSize) {
        break;
      }
      offset += items.length;
    }

    return rows;
  }, [buildExportInboxCriteria, data, tenantId, useNewInboxAPI]);

  if (rest?.data?.length !== null) {
    if (isMobile) {
      return (
        <MobileInbox
          data={data}
          isLoading={hookLoading}
          isSearch={!isInbox}
          searchFields={searchFields}
          onFilterChange={handleFilterChange}
          onSearch={handleFilterChange}
          onSort={handleSort}
          parentRoute={parentRoute}
          searchParams={searchParams}
            sortParams={sortParams}
            linkPrefix={detailRoute ? `${detailRoute}/` : `${parentRoute}/booking-details/`}
            tableConfig={rest?.tableConfig ? rest.tableConfig : TableConfig(t)[moduleCode]}
            filterComponent={filterComponent}
            EmptyResultInboxComp={EmptyResultInboxComp}
            useNewInboxAPI={useNewInboxAPI}
        />
      );
    } else {
      return (
        <div className="app-container" style={{ padding: user?.type === "CITIZEN" ? "0 24px" : "" }}>
          <WTDesktopInbox
            moduleCode={moduleCode}
            detailRoute={detailRoute}
            data={data}
            tableConfig={TableConfig(t)[moduleCode]}
            isLoading={hookLoading}
            defaultSearchParams={initialStates.searchParams}
            isSearch={!isInbox}
            onFilterChange={handleFilterChange}
            searchFields={searchFields}
            onSearch={handleFilterChange}
            onSort={handleSort}
            onNextPage={fetchNextPage}
            onPrevPage={fetchPrevPage}
            currentPage={Math.floor(pageOffset / pageSize)}
            pageSizeLimit={pageSize}
            disableSort={false}
            onPageSizeChange={handlePageSizeChange}
            parentRoute={parentRoute}
            searchParams={searchParams}
            sortParams={sortParams}
            totalRecords={Number(data?.[0]?.totalCount)}
            filterComponent={filterComponent}
            EmptyResultInboxComp={EmptyResultInboxComp}
            useNewInboxAPI={useNewInboxAPI}
            getCSVExportData={getCSVExportData}
          />
        </div>
      );
    }
  }
};

export default Inbox;
