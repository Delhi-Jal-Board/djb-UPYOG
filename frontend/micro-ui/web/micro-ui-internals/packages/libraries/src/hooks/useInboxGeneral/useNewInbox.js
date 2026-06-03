import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "react-query";
import { FSMService } from "../../services/elements/FSM";
import { PTService } from "../../services/elements/PT";
import { CHBServices } from "../../services/elements/CHB";
import { PTRService } from "../../services/elements/PTR";
import { SVService } from "../../services/elements/SV";
import { EwService } from "../../services/elements/EW";
import { filterFunctions } from "./newFilterFn";
import { getSearchFields } from "./searchFields";
import { InboxGeneral } from "../../services/elements/InboxService";
import { WTService } from "../../services/elements/WT";
import { MTService } from "../../services/elements/MT";

const inboxConfig = (tenantId, filters) => ({
  PT: {
    services: ["PT.CREATE"],
    searchResponseKey: "Properties",
    businessIdsParamForSearch: "acknowledgementIds",
    businessIdAliasForSearch: "acknowldgementNumber",
    fetchFilters: filterFunctions.PT,
    _searchFn: () => PTService.search({ tenantId, filters }),
  },
  PTR: {
    services: ["ptr"],
    searchResponseKey: "PetRegistrationApplications",
    businessIdsParamForSearch: "applicationNumber",
    businessIdAliasForSearch: "applicationNumber",
    fetchFilters: filterFunctions.PTR,
    _searchFn: () => PTRService.search({ tenantId, filters }),
  },
  ASSET: {
    services: ["asset-create"],
    searchResponseKey: "Asset",
    businessIdsParamForSearch: "applicationNo",
    businessIdAliasForSearch: "applicationNo",
    fetchFilters: filterFunctions.ASSET,
    _searchFn: () => ASSETService.search({ tenantId, filters }),
  },
  FSM: {
    services: ["FSM"],
    searchResponseKey: "fsm",
    businessIdsParamForSearch: "applicationNos",
    businessIdAliasForSearch: "applicationNo",
    fetchFilters: filterFunctions.FSM,
    _searchFn: () => FSMService.search(tenantId, filters),
  },
  SV: {
    services: ["street-vending"],
    searchResponseKey: "SVDetails",
    businessIdsParamForSearch: "applicationNo",
    businessIdAliasForSearch: "applicationNo",
    fetchFilters: filterFunctions.SV,
    _searchFn: () => SVService.search({ tenantId, filters }),
  },
  EW: {
    services: ["ewst"],
    searchResponseKey: "EwasteApplication",
    businessIdsParamForSearch: "requestId",
    businessIdAliasForSearch: "requestId",
    fetchFilters: filterFunctions.EW,
    _searchFn: () => EwService.search({ tenantId, filters }),
  },
  CHB: {
    services: ["booking-refund"],
    searchResponseKey: "hallsBookingApplication",
    businessIdsParamForSearch: "bookingNo",
    businessIdAliasForSearch: "bookingNo",
    fetchFilters: filterFunctions.CHB,
    _searchFn: () => CHBServices.search({ tenantId, filters }),
  },
  WT: {
    services: ["watertanker"],
    searchResponseKey: "waterTankerBookingDetail",
    businessIdsParamForSearch: "bookingNo",
    businessIdAliasForSearch: "bookingNo",
    fetchFilters: filterFunctions.WT,
    _searchFn: () => WTService.search({ tenantId, filters }),
  },
  MT: {
    services: ["mobileToilet"],
    searchResponseKey: "mobileToilerBookingDetail",
    businessIdsParamForSearch: "bookingNo",
    businessIdAliasForSearch: "bookingNo",
    fetchFilters: filterFunctions.MT,
    _searchFn: () => MTService.search({ tenantId, filters }),
  }
});


const callMiddlewares = async (data, middlewares) => {
  let applyBreak = false;
  let itr = -1;
  let _break = () => (applyBreak = true);
  let _next = async (data) => {
    if (!applyBreak && ++itr < middlewares.length) {
      let key = Object.keys(middlewares[itr])[0];
      let nextMiddleware = middlewares[itr][key];
      let isAsync = nextMiddleware.constructor.name === "AsyncFunction";
      if (isAsync) return await nextMiddleware(data, _break, _next);
      else return nextMiddleware(data, _break, _next);
    } else return data;
  };
  let ret = await _next(data);
  return ret || [];
};

const useNewInboxGeneral = ({ tenantId, ModuleCode, businessService, filters, middleware = [], config = {} }) => {
  const client = useQueryClient();
  const { t } = useTranslation();
  const { fetchFilters, searchResponseKey, businessIdAliasForSearch, businessIdsParamForSearch } = inboxConfig()[ModuleCode];
  let { workflowFilters, searchFilters, limit, offset, sortBy, sortOrder, isDraftApplication } = fetchFilters(filters);

  const query = useQuery(
    ["INBOX", workflowFilters, searchFilters, ModuleCode, businessService, limit, offset, sortBy, sortOrder],
    async () => {
      let inboxRes = { items: [], totalCount: 0, statusMap: [] };
      try {
        const res = await InboxGeneral.Search({
          inbox: { tenantId, processSearchCriteria: workflowFilters, moduleSearchCriteria: { ...searchFilters, sortBy, sortOrder, isDraftApplication }, limit, offset },
        });
        if (res && res.items) inboxRes = res;
      } catch (e) {
        console.error("Error calling InboxGeneral.Search", e);
      }

      const isFixedPoint = businessService === "watertanker-fixedpoint" || filters?.services?.includes("watertanker-fixedpoint") || workflowFilters?.businessService?.includes("watertanker-fixedpoint");

      if (ModuleCode === "WT" && isFixedPoint) {
        try {
          const wtFilters = { ...searchFilters, offset: offset || 0, limit: limit || 100, applicationType: "watertanker-fixedpoint" };
          delete wtFilters.isInboxSearch;
          delete wtFilters.creationReason;
          if (Array.isArray(workflowFilters?.status) && workflowFilters.status.length > 0) {
            wtFilters.status = workflowFilters.status[0];
            wtFilters.bookingStatus = workflowFilters.status[0];
          }
          if (wtFilters.fromDate && !wtFilters.toDate) {
            wtFilters.toDate = new Date().getTime();
          }
          const wtRes = await WTService.search({ tenantId, filters: wtFilters });
          const wtDetails = wtRes?.waterTankerBookingDetail || [];

          if (Array.isArray(wtDetails)) {
            inboxRes.items = inboxRes.items || [];
            wtDetails.forEach((wtItem) => {
              if (!inboxRes.items.some((item) => (item?.businessObject?.bookingNo || item?.ProcessInstance?.businessId) === wtItem?.bookingNo)) {
                inboxRes.items.push({
                  businessObject: wtItem,
                  ProcessInstance: {
                    businessId: wtItem.bookingNo,
                    state: {
                      applicationStatus: wtItem.bookingStatus || "SCHEDULED",
                    },
                    auditDetails: wtItem.auditDetails,
                  },
                });
              }
            });

            if (wtRes?.statusCounts && Object.keys(wtRes.statusCounts).length > 0) {
              const sc = wtRes.statusCounts;
              inboxRes.statusMap = Object.keys(sc).map((st) => ({
                applicationStatus: st.toUpperCase().replace(/\s+/g, "_"),
                count: Number(sc[st]) || 0,
              }));
              inboxRes.totalCount = Number(inboxRes.totalCount) || Number(wtRes?.count) || inboxRes.items.length;
            } else {
              inboxRes.totalCount = Math.max(Number(inboxRes.totalCount) || 0, inboxRes.items.length);
              const sMap = {};
              inboxRes.items.forEach((item) => {
                let st = (item.businessObject?.bookingStatus || item?.ProcessInstance?.state?.applicationStatus || "SCHEDULED").toUpperCase();
                st = st.replace(/\s+/g, "_");
                sMap[st] = (sMap[st] || 0) + 1;
              });
              inboxRes.statusMap = Object.keys(sMap).map((st) => ({ applicationStatus: st, count: sMap[st] }));
            }
            const todayStr = new Date().toDateString();
            inboxRes.todayCount = inboxRes.items.filter((item) => {
              const cTime = item?.businessObject?.auditDetails?.createdTime || item?.ProcessInstance?.auditDetails?.createdTime;
              if (!cTime) return false;
              return new Date(cTime).toDateString() === todayStr;
            }).length;
          }
        } catch (e) {
          console.error("Error calling WT search API", e);
        }
      }
      return inboxRes;
    },
    {
      select: (data) => {
        const { statusMap, totalCount, todayCount } = data;
        client.setQueryData(`INBOX_STATUS_MAP_${ModuleCode}`, statusMap);

        if (data?.items?.length) {
          return data.items?.map((obj) => ({
            searchData: obj.businessObject,
            workflowData: obj.ProcessInstance,
            statusMap,
            totalCount,
            todayCount: todayCount || 0,
          }));
        } else {
          return [{ statusMap, totalCount, todayCount: todayCount || 0, dataEmpty: true }];
        }
      },
      retry: false,
      ...config,
    }
  );

  return {
    ...query,
    searchResponseKey,
    businessIdsParamForSearch,
    businessIdAliasForSearch,
    searchFields: getSearchFields(true)[ModuleCode],
  };
};

export default useNewInboxGeneral;
