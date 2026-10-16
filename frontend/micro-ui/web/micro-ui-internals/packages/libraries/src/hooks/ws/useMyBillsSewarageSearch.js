import { useQuery, useQueryClient } from "react-query";
import _ from "lodash";
import { WSService } from "../../services/elements/WS";
import { PTService } from "../../services/elements/PT";

const getDate = (epochdate) => {
  return epochdate
    ? new Date(epochdate).getDate() + "/" + (new Date(epochdate).getMonth() + 1) + "/" + new Date(epochdate).getFullYear().toString()
    : "NA";
};

const getBillingPeriod = (fromPeriod, toPeriod) => {
  let from = fromPeriod ? new Date(fromPeriod).getFullYear().toString() : "";
  let to = toPeriod ? new Date(toPeriod).getFullYear().toString() : "";
  return from && to ? "FY " + from + "-" + to : "NA";
};

const getAddress = (address, t) => {
  if (!address) return "NA";
  return `${address?.doorNo ? `${address?.doorNo}, ` : ""}${address?.street ? `${address?.street}, ` : ""}${
    address?.landmark ? `${address?.landmark}, ` : ""
  }${address?.locality?.code ? t(`TENANTS_MOHALLA_${address?.locality?.code}`) : ""}${
    address?.city?.code || address?.city ? `, ${t(address?.city?.code || address?.city)}` : ""
  }${address?.pincode ? `, ${address.pincode}` : " "}`;
};

const combineResponse = (SewerageConnections = [], properties = [], billData = [], t) => {
  if (!SewerageConnections || SewerageConnections.length === 0) return [];
  const propsList = Array.isArray(properties) ? properties : properties?.Properties || [];

  const connectionsWithBill = billData && billData.length > 0
    ? SewerageConnections.filter((app) =>
        billData.some((bill) => (bill?.consumerCode || "").trim().toLowerCase() === (app?.connectionNo || "").trim().toLowerCase())
      )
    : [];

  return connectionsWithBill.map((app) => {
    const matchingBill = billData?.find(
      (bill) => (bill?.consumerCode || "").trim().toLowerCase() === (app?.connectionNo || "").trim().toLowerCase()
    );
    const prop = propsList?.find((p) => p?.propertyId === app?.propertyId) || app?.property;
    const consumerName =
      app?.connectionHolders && app.connectionHolders.length > 0
        ? app.connectionHolders.map((owner) => owner?.name).join(",")
        : prop?.owners?.map((ow) => ow?.name).join(",") || "NA";

    const address = prop?.address
      ? getAddress(prop.address, t)
      : app?.address
      ? getAddress(app.address, t)
      : app?.additionalDetails?.locality || "NA";

    const amount =
      matchingBill?.totalAmount !== undefined && matchingBill?.totalAmount !== null
        ? String(matchingBill.totalAmount)
        : "0";

    const expiryDate = matchingBill?.billDetails?.[0]?.expiryDate;
    const dueDate = expiryDate ? getDate(expiryDate) : "NA";

    const fromPeriod = matchingBill?.billDetails?.[0]?.fromPeriod;
    const toPeriod = matchingBill?.billDetails?.[0]?.toPeriod;
    const billingPeriod = getBillingPeriod(fromPeriod, toPeriod);

    const serviceName = matchingBill?.businessService
      ? t(`WS_SERVICE_TYPE_${matchingBill.businessService}`)
      : t("WS_SERVICE_TYPE_SEWERAGE");

    return {
      ConsumerNumber: app?.connectionNo,
      ConsumerName: consumerName,
      Address: address,
      AmountDue: amount,
      DueDate: dueDate,
      BillingPeriod: billingPeriod,
      ServiceName: serviceName,
      hasBill: Boolean(matchingBill),
      bill: matchingBill,
      privacy: {
        Address: {
          uuid: prop?.owners?.[0]?.uuid || app?.connectionHolders?.[0]?.uuid,
          fieldName: ["doorNo", "street", "landmark"],
          model: "Property",
          showValue: true,
          loadData: {
            serviceName: "/property-services/property/_search",
            requestBody: {},
            requestParam: { tenantId: app?.tenantId || "dl.djb", propertyIds: app?.propertyId },
            jsonPath: "Properties[0].address.street",
            isArray: false,
            d: (res) => {
              let resultString =
                (_.get(res, "Properties[0].address.doorNo") ? `${_.get(res, "Properties[0].address.doorNo")}, ` : "") +
                (_.get(res, "Properties[0].address.street") ? `${_.get(res, "Properties[0].address.street")}, ` : "") +
                (_.get(res, "Properties[0].address.landmark") ? `${_.get(res, "Properties[0].address.landmark")}` : "");
              return resultString;
            },
          },
        },
      },
    };
  });
};

const useMyBillsSewarageSearch = ({ tenantId, filters = {}, BusinessService = "SW", t }, config = {}) => {
  const client = useQueryClient();
  const cleanTenantId = tenantId && tenantId !== "dl" ? tenantId : "dl.djb";

  const { isLoading, error, data, isSuccess } = useQuery(
    ["WS_SEARCH", cleanTenantId, filters, BusinessService, config],
    async () => await WSService.search({ tenantId: cleanTenantId, filters: { tenantId: cleanTenantId, ...filters }, businessService: BusinessService }),
    config
  );

  let propertyids = "";
  let consumercodes = "";
  data?.SewerageConnections?.forEach((item) => {
    propertyids = propertyids + item?.propertyId + ",";
    consumercodes = consumercodes + item?.connectionNo + ",";
  });

  let propertyfilter = { propertyIds: propertyids.substring(0, propertyids.length - 1) };
  if (propertyids !== "" && filters?.locality) propertyfilter.locality = filters?.locality;
  config = { ...config, enabled: propertyids !== "" ? true : false };

  const { isLoading: isPropertyLoading, error: isPropertyError, data: propertyData, isSuccess: isPropertySuccess } = useQuery(
    ["WSP_SEARCH", cleanTenantId, propertyfilter, BusinessService, config],
    async () => {
      try {
        return await PTService.search({ tenantId: cleanTenantId, filters: propertyfilter, auth: filters?.locality ? false : true });
      } catch (e) {
        return { Properties: [] };
      }
    },
    config
  );

  const { isLoading: isBillLoading, error: isBillError, data: bill, isSuccess: isBillSuccess } = useQuery(
    ["BILL_SEARCH", cleanTenantId, consumercodes, BusinessService, config],
    async () => {
      const codeList = consumercodes
        ? consumercodes
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : [];
      if (codeList.length === 0) return { Bill: [] };

      const billPromises = codeList.map(async (code) => {
        try {
          const fetchRes = await Digit.PaymentService.fetchBill(cleanTenantId, {
            businessService: BusinessService,
            consumerCode: code,
          });
          if (fetchRes?.Bill?.length > 0) return fetchRes.Bill;
        } catch (e) {
          // ignore
        }
        try {
          const searchRes = await Digit.PaymentService.searchBill(cleanTenantId, {
            consumerCode: code,
            Service: BusinessService,
          });
          return searchRes?.Bill || [];
        } catch (err) {
          return [];
        }
      });

      const allBillsNested = await Promise.all(billPromises);
      return { Bill: allBillsNested.flat().filter(Boolean) };
    },
    config
  );

  const response = {
    isLoading,
    error,
    data,
    isSuccess,
    revalidate: () => client.invalidateQueries(["WS_SEARCH", cleanTenantId, filters, BusinessService]),
  };

  const properties = {
    isPropertyLoading,
    isPropertyError,
    propertyData,
    isPropertySuccess,
    revalidate: () => client.invalidateQueries(["WSP_SEARCH", cleanTenantId, propertyfilter, BusinessService]),
  };

  const billData = {
    isBillLoading,
    isBillError,
    bill,
    isBillSuccess,
    revalidate: () => client.invalidateQueries(["BILL_SEARCH", cleanTenantId, consumercodes, BusinessService]),
  };

  if (response?.isLoading || properties?.isPropertyLoading || billData?.isBillLoading) {
    return undefined;
  }
  const bills = billData?.bill?.Bill || [];
  const connections = response?.data?.SewerageConnections || [];
  return combineResponse(connections, properties?.propertyData?.Properties || [], bills, t);
};

export default useMyBillsSewarageSearch;